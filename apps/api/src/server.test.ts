import { describe, expect, it } from "vitest";
import { FakeVizioDevice } from "@b-list/tv-vizio";
import { buildServer } from "./server.js";

describe("API server", () => {
  it("reports health without touching the TV", async () => {
    const app = buildServer();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "b-list-api" });
    await app.close();
  });

  it("keeps device info behind a discovered device id", async () => {
    const app = buildServer({
      discover: async () => [
        {
          id: "uuid:sample-tv",
          location: "https://192.168.1.50:7345",
          usn: "uuid:sample-tv",
        },
      ],
    });

    const undiscovered = await app.inject({
      method: "GET",
      url: "/api/tv/devices/not-discovered/info",
    });
    expect(undiscovered.statusCode).toBe(404);

    const discovered = await app.inject({ method: "GET", url: "/api/tv/discover" });
    expect(discovered.statusCode).toBe(200);

    await app.close();
  });

  it("routes movie search through the provider boundary", async () => {
    const app = buildServer({
      movieProvider: {
        name: "fixture",
        search: async (query, limit) => [
          { id: "dune-2021", title: query === "dune" ? "Dune" : "Other", genres: ["Sci-Fi"] },
        ].slice(0, limit),
      },
    });

    const response = await app.inject({ method: "GET", url: "/api/movies/search?query=dune&limit=1" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      query: "dune",
      provider: "fixture",
      results: [{ id: "dune-2021", title: "Dune", genres: ["Sci-Fi"] }],
    });
    await app.close();
  });

  it("rejects an empty movie search query", async () => {
    const app = buildServer();
    const response = await app.inject({ method: "GET", url: "/api/movies/search?query=" });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("runs pairing and confirmation-gated commands only through the dry-run simulator", async () => {
    const device = new FakeVizioDevice({ pin: "2468" });
    const app = buildServer({ dryRunDevice: device });

    const start = await app.inject({ method: "POST", url: "/api/tv/dry-run/pairing/start" });
    expect(start.statusCode).toBe(200);
    expect(start.json()).toMatchObject({ deviceId: device.deviceId, simulatorPin: "2468" });

    const notConfirmed = await app.inject({
      method: "POST",
      url: "/api/tv/dry-run/commands",
      payload: { command: "volumeUp", confirmed: false },
    });
    expect(notConfirmed.statusCode).toBe(400);

    const complete = await app.inject({
      method: "POST",
      url: "/api/tv/dry-run/pairing/complete",
      payload: { pin: "2468" },
    });
    expect(complete.statusCode).toBe(200);
    expect(complete.json()).toEqual({ paired: true, deviceId: device.deviceId, deviceName: device.deviceName });

    const command = await app.inject({
      method: "POST",
      url: "/api/tv/dry-run/commands",
      payload: { command: "volumeUp", confirmed: true },
    });
    expect(command.statusCode).toBe(200);
    expect(device.getKeyCommands()).toHaveLength(1);
    await app.close();
  });
});
