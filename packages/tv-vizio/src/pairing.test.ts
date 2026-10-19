import { describe, expect, it, vi } from "vitest";
import { InMemoryVizioTokenStore, VizioPairingClient } from "./pairing.js";

describe("VIZIO pairing", () => {
  it("starts and completes a PIN pairing session through an injected transport", async () => {
    const put = vi
      .fn()
      .mockResolvedValueOnce({
        STATUS: { RESULT: "SUCCESS" },
        ITEM: { PAIRING_REQ_TOKEN: 123456, CHALLENGE_TYPE: 1 },
      })
      .mockResolvedValueOnce({
        STATUS: { RESULT: "SUCCESS" },
        ITEM: { AUTH_TOKEN: "fixture-auth-token" },
      });
    const client = new VizioPairingClient({
      baseUrl: "https://192.0.2.10:7345",
      deviceId: "b-list-test-device",
      deviceName: "B-List",
      transport: { get: vi.fn(), put },
    });

    const session = await client.start();
    const token = await client.complete(session, "1234");

    expect(session).toMatchObject({
      deviceId: "b-list-test-device",
      deviceName: "B-List",
      pairingRequestToken: 123456,
      challengeType: 1,
    });
    expect(token).toBe("fixture-auth-token");
    expect(put).toHaveBeenNthCalledWith(1, "/pairing/start", {
      DEVICE_ID: "b-list-test-device",
      DEVICE_NAME: "B-List",
    });
    expect(put).toHaveBeenNthCalledWith(2, "/pairing/pair", {
      DEVICE_ID: "b-list-test-device",
      CHALLENGE_TYPE: 1,
      RESPONSE_VALUE: "1234",
      PAIRING_REQ_TOKEN: 123456,
    });
  });

  it("rejects malformed PINs before sending the pairing request", async () => {
    const put = vi.fn();
    const client = new VizioPairingClient({
      baseUrl: "https://192.0.2.10:7345",
      deviceId: "b-list-test-device",
      deviceName: "B-List",
      transport: { get: vi.fn(), put },
    });
    const session = {
      deviceId: "b-list-test-device",
      deviceName: "B-List",
      pairingRequestToken: 123456,
      challengeType: 1,
    };

    await expect(client.complete(session, "12ab")).rejects.toThrow("exactly four digits");
    expect(put).not.toHaveBeenCalled();
  });
});

describe("VIZIO token plumbing", () => {
  it("supports replace and delete semantics behind the token-store interface", async () => {
    const store = new InMemoryVizioTokenStore();

    await store.set("device", "fixture-token");
    expect(await store.get("device")).toBe("fixture-token");
    await store.delete("device");
    expect(await store.get("device")).toBeUndefined();
  });
});
