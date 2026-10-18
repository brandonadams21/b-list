import Fastify, { type FastifyInstance } from "fastify";
import {
  discoverVizioDevices,
  VizioReadOnlyClient,
  type VizioDiscoveryCandidate,
} from "@b-list/tv-vizio";

export interface ApiDependencies {
  discover?: () => Promise<VizioDiscoveryCandidate[]>;
  createClient?: (candidate: VizioDiscoveryCandidate) => VizioReadOnlyClient;
}

export function buildServer(dependencies: ApiDependencies = {}): FastifyInstance {
  const discovered = new Map<string, VizioDiscoveryCandidate>();
  const discover = dependencies.discover ?? (() => discoverVizioDevices());
  const createClient =
    dependencies.createClient ??
    ((candidate: VizioDiscoveryCandidate) =>
      new VizioReadOnlyClient({ baseUrl: candidate.location }));

  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ status: "ok", service: "b-list-api" }));

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
