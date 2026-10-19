import Fastify, { type FastifyInstance } from "fastify";
import {
  MovieSearchQuerySchema,
  MovieSearchResponseSchema,
} from "@b-list/contracts";
import {
  discoverVizioDevices,
  VizioReadOnlyClient,
  type VizioDiscoveryCandidate,
} from "@b-list/tv-vizio";
import { InMemoryMovieProvider, type MovieProvider } from "./movies.js";

export interface ApiDependencies {
  discover?: () => Promise<VizioDiscoveryCandidate[]>;
  createClient?: (candidate: VizioDiscoveryCandidate) => VizioReadOnlyClient;
  movieProvider?: MovieProvider;
}

export function buildServer(dependencies: ApiDependencies = {}): FastifyInstance {
  const discovered = new Map<string, VizioDiscoveryCandidate>();
  const discover = dependencies.discover ?? (() => discoverVizioDevices());
  const createClient =
    dependencies.createClient ??
    ((candidate: VizioDiscoveryCandidate) =>
      new VizioReadOnlyClient({ baseUrl: candidate.location }));
  const movieProvider = dependencies.movieProvider ?? new InMemoryMovieProvider();

  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ status: "ok", service: "b-list-api" }));

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
