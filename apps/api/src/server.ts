import Fastify, { type FastifyInstance } from "fastify";
import {
  MovieSearchQuerySchema,
  MovieSearchResponseSchema,
} from "@b-list/contracts";
import {
  FakeVizioDevice,
  InMemoryVizioTokenStore,
  VizioControlClient,
  VizioPairingManager,
  VIZIO_ALLOWED_KEY_COMMANDS,
  discoverVizioDevices,
  VizioReadOnlyClient,
  type VizioDiscoveryCandidate,
} from "@b-list/tv-vizio";
import { InMemoryMovieProvider, type MovieProvider } from "./movies.js";

export interface ApiDependencies {
  discover?: () => Promise<VizioDiscoveryCandidate[]>;
  createClient?: (candidate: VizioDiscoveryCandidate) => VizioReadOnlyClient;
  movieProvider?: MovieProvider;
  dryRunDevice?: FakeVizioDevice;
}

type DryRunCommand = (typeof VIZIO_ALLOWED_KEY_COMMANDS)[number];

export function buildServer(dependencies: ApiDependencies = {}): FastifyInstance {
  const discovered = new Map<string, VizioDiscoveryCandidate>();
  const discover = dependencies.discover ?? (() => discoverVizioDevices());
  const createClient =
    dependencies.createClient ??
    ((candidate: VizioDiscoveryCandidate) =>
      new VizioReadOnlyClient({ baseUrl: candidate.location }));
  const movieProvider =
    dependencies.movieProvider ??
    new InMemoryMovieProvider([
      { id: "dune-2021", title: "Dune", year: 2021, genres: ["Sci-Fi", "Adventure"] },
      { id: "arrival-2016", title: "Arrival", year: 2016, genres: ["Sci-Fi", "Drama"] },
      { id: "the-fall-guy-2024", title: "The Fall Guy", year: 2024, genres: ["Action", "Comedy"] },
      { id: "spirited-away-2001", title: "Spirited Away", year: 2001, genres: ["Animation", "Fantasy"] },
      { id: "grand-budapest-2014", title: "The Grand Budapest Hotel", year: 2014, genres: ["Comedy", "Drama"] },
    ]);
  const dryRunDevice = dependencies.dryRunDevice ?? new FakeVizioDevice();
  const dryRunPairing = new VizioPairingManager({
    baseUrl: "https://fake.invalid:7345",
    deviceId: dryRunDevice.deviceId,
    deviceName: dryRunDevice.deviceName,
    transport: dryRunDevice,
    tokenStore: new InMemoryVizioTokenStore(),
  });
  let dryRunSession: Awaited<ReturnType<VizioPairingManager["start"]>> | undefined;

  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ status: "ok", service: "b-list-api" }));

  app.get("/api/tv/dry-run/status", async () => ({
    deviceId: dryRunDevice.deviceId,
    deviceName: dryRunDevice.deviceName,
    paired: dryRunDevice.isPaired(),
    commandCount: dryRunDevice.getKeyCommands().length,
  }));

  app.post("/api/tv/dry-run/pairing/start", async () => {
    dryRunSession = await dryRunPairing.start();
    return {
      deviceId: dryRunSession.deviceId,
      deviceName: dryRunSession.deviceName,
      challengeType: dryRunSession.challengeType,
      simulatorPin: dryRunDevice.pin,
    };
  });

  app.post<{ Body: unknown }>("/api/tv/dry-run/pairing/complete", async (request, reply) => {
    if (!dryRunSession) return reply.code(409).send({ error: "Start the dry-run pairing flow first." });
    const body = asRecord(request.body);
    const pin = body?.pin;
    if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return reply.code(400).send({ error: "PIN must be exactly four digits." });
    }

    const paired = await dryRunPairing.complete(dryRunSession, pin);
    dryRunSession = undefined;
    return { paired: true, ...paired };
  });

  app.post<{ Body: unknown }>("/api/tv/dry-run/commands", async (request, reply) => {
    const body = asRecord(request.body);
    const command = body?.command;
    if (!isDryRunCommand(command)) {
      return reply.code(400).send({ error: "Command is not in the dry-run allowlist." });
    }
    if (body?.confirmed !== true) {
      return reply.code(400).send({ error: "Explicit confirmation is required for this command." });
    }
    const authToken = await dryRunPairing.getToken();
    if (!authToken) return reply.code(409).send({ error: "Complete dry-run pairing before sending commands." });

    const control = new VizioControlClient({
      transport: dryRunDevice,
      authToken,
      confirm: async (requested) => requested === command,
    });
    await control.sendKeyPress(command);
    return { accepted: true, command, commandCount: dryRunDevice.getKeyCommands().length };
  });

  app.get<{ Querystring: Record<string, string | undefined> }>(
    "/api/movies/search",
    async (request, reply) => {
      const parsed = MovieSearchQuerySchema.safeParse(request.query);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid movie search query." });

      return MovieSearchResponseSchema.parse({
        query: parsed.data.query,
        results: await movieProvider.search(parsed.data.query, parsed.data.limit),
        provider: movieProvider.name,
      });
    },
  );

  app.get("/api/tv/discover", async () => {
    const candidates = await discover();
    discovered.clear();
    for (const candidate of candidates) {
      discovered.set(candidate.id, candidate);
    }
    return { devices: candidates };
  });

  app.get<{ Params: { deviceId: string } }>(
    "/api/tv/devices/:deviceId/info",
    async (request, reply) => {
      const candidate = discovered.get(request.params.deviceId);
      if (!candidate) {
        return reply.code(404).send({ error: "Device was not discovered in this session." });
      }

      const info = await createClient(candidate).getDeviceInfo();
      return { device: info };
    },
  );

  return app;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function isDryRunCommand(value: unknown): value is DryRunCommand {
  return typeof value === "string" && VIZIO_ALLOWED_KEY_COMMANDS.includes(value as DryRunCommand);
}
