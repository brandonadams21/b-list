import { describe, expect, it, vi } from "vitest";
import { buildAllowedKeyPress, VizioControlClient } from "./control.js";

describe("VIZIO control allowlist", () => {
  it("builds one confirmed KEYPRESS command", () => {
    expect(buildAllowedKeyPress("volumeUp")).toEqual({
      KEYLIST: [{ CODESET: 5, CODE: 1, ACTION: "KEYPRESS" }],
    });
  });

  it("requires confirmation and sends the token only as AUTH", async () => {
    const put = vi.fn().mockResolvedValue({ STATUS: { RESULT: "SUCCESS" } });
    const confirm = vi.fn().mockResolvedValue(true);
    const client = new VizioControlClient({
      transport: { get: vi.fn(), put },
      authToken: "fixture-auth-token",
      confirm,
    });

    await client.sendKeyPress("cycleInput");

    expect(confirm).toHaveBeenCalledWith("cycleInput");
    expect(put).toHaveBeenCalledWith(
      "/key_command/",
      { KEYLIST: [{ CODESET: 7, CODE: 1, ACTION: "KEYPRESS" }] },
      { AUTH: "fixture-auth-token" },
    );
  });

  it("does not send an unconfirmed command", async () => {
    const put = vi.fn();
    const client = new VizioControlClient({
      transport: { get: vi.fn(), put },
      authToken: "fixture-auth-token",
      confirm: vi.fn().mockResolvedValue(false),
    });

    await expect(client.sendKeyPress("powerOff")).rejects.toThrow("not confirmed");
    expect(put).not.toHaveBeenCalled();
  });
});
