import { describe, expect, it, vi } from "vitest";
import {
  assertVizioCertificateFingerprint,
  MacOsKeychainVizioTokenStore,
  normalizeSha256Fingerprint,
} from "./security.js";

describe("VIZIO security plumbing", () => {
  it("normalizes and validates certificate fingerprints", () => {
    const fingerprint = "aa:bb:cc:dd:ee:ff:" + "11:".repeat(25) + "22";
    const normalized = normalizeSha256Fingerprint(fingerprint);

    expect(normalized).toHaveLength(64);
    expect(() => assertVizioCertificateFingerprint({ mode: "pinned", sha256: normalized }, normalized)).not.toThrow();
    expect(() => assertVizioCertificateFingerprint({ mode: "pinned", sha256: normalized }, "00".repeat(32))).toThrow(
      "did not match",
    );
  });

  it("uses the macOS keychain command boundary without logging credentials", async () => {
    const calls: string[][] = [];
    const runner = {
      run: vi.fn(async (args: readonly string[]) => {
        calls.push([...args]);
        if (args[0] === "find-generic-password") return { stdout: "fixture-token\n", stderr: "" };
        return { stdout: "", stderr: "" };
      }),
    };
    const store = new MacOsKeychainVizioTokenStore({ service: "test-service", runner });

    await store.set("device-id", "fixture-token");
    expect(await store.get("device-id")).toBe("fixture-token");
    await store.delete("device-id");

    expect(calls).toEqual([
      ["add-generic-password", "-U", "-a", "device-id", "-s", "test-service", "-w", "fixture-token"],
      ["find-generic-password", "-a", "device-id", "-s", "test-service", "-w"],
      ["delete-generic-password", "-a", "device-id", "-s", "test-service"],
    ]);
  });
});
