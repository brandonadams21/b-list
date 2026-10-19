import { describe, expect, it, vi } from "vitest";
import { VizioControlClient } from "./control.js";
import { FakeVizioDevice } from "./fake.js";
import { InMemoryVizioTokenStore, VizioPairingClient } from "./pairing.js";

describe("fake VIZIO device", () => {
  it("runs the pairing and confirmed control contract without a network", async () => {
    const device = new FakeVizioDevice();
    const pairing = new VizioPairingClient({
      baseUrl: "https://fake.invalid:7345",
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      transport: device,
    });
    const session = await pairing.start();
    const token = await pairing.complete(session, device.pin);
    const tokenStore = new InMemoryVizioTokenStore();
    await tokenStore.set(device.deviceId, token);

    const control = new VizioControlClient({
      transport: device,
      authToken: (await tokenStore.get(device.deviceId)) ?? "",
      confirm: vi.fn().mockResolvedValue(true),
    });
    await control.sendKeyPress("volumeUp");

    expect(device.isPaired()).toBe(true);
    expect(device.getKeyCommands()).toHaveLength(1);
  });

  it("rejects an incorrect PIN without pairing", async () => {
    const device = new FakeVizioDevice();
    const pairing = new VizioPairingClient({
      baseUrl: "https://fake.invalid:7345",
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      transport: device,
    });
    const session = await pairing.start();

    await expect(pairing.complete(session, "0000")).rejects.toThrow("CHALLENGE_INCORRECT");
    expect(device.isPaired()).toBe(false);
  });
});
