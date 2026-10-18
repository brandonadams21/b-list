import { describe, expect, it } from "vitest";
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
});
