import { describe, expect, it, vi } from "vitest";
import { VizioAuthenticatedReadClient } from "./client.js";

describe("VIZIO authenticated read client", () => {
  it("retrieves the token from the store and sends it only as AUTH", async () => {
    const get = vi.fn().mockResolvedValue({
      STATUS: { RESULT: "SUCCESS" },
      ITEM: { MODEL_NAME: "TEST-1", DEVICE_NAME: "Living Room TV" },
    });
    const client = new VizioAuthenticatedReadClient({
      baseUrl: "https://fake.invalid:7345",
      deviceId: "device-id",
      tokenStore: {
        get: vi.fn().mockResolvedValue("fixture-token"),
        set: vi.fn(),
        delete: vi.fn(),
      },
      transport: { get },
    });

    await expect(client.getDeviceInfo()).resolves.toMatchObject({
      model: "TEST-1",
      name: "Living Room TV",
    });
    expect(get).toHaveBeenCalledWith("/state/device/deviceinfo", { AUTH: "fixture-token" });
  });

  it("does not make a request when the token is missing", async () => {
    const get = vi.fn();
    const client = new VizioAuthenticatedReadClient({
      baseUrl: "https://fake.invalid:7345",
      deviceId: "device-id",
      tokenStore: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn(), delete: vi.fn() },
      transport: { get },
    });

    await expect(client.getDeviceInfo()).rejects.toThrow("No VIZIO auth token");
    expect(get).not.toHaveBeenCalled();
  });
});
