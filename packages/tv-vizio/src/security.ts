import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VizioTokenStore } from "./types.js";

const execFileAsync = promisify(execFile);
const KEYCHAIN_SERVICE = "com.b-list.vizio-auth";

export interface KeychainCommandRunner {
  run(args: readonly string[]): Promise<{ stdout: string; stderr: string }>;
}

const defaultRunner: KeychainCommandRunner = {
  async run(args) {
    const result = await execFileAsync("security", [...args], { encoding: "utf8" });
    return { stdout: result.stdout, stderr: result.stderr };
  },
};

export interface KeychainTokenStoreOptions {
  service?: string;
  runner?: KeychainCommandRunner;
}

export class MacOsKeychainVizioTokenStore implements VizioTokenStore {
  private readonly service: string;
  private readonly runner: KeychainCommandRunner;

  constructor(options: KeychainTokenStoreOptions = {}) {
    this.service = options.service ?? KEYCHAIN_SERVICE;
    this.runner = options.runner ?? defaultRunner;
  }

  async get(deviceId: string): Promise<string | undefined> {
    try {
      const result = await this.runner.run([
        "find-generic-password",
        "-a",
        deviceId,
        "-s",
        this.service,
        "-w",
      ]);
      const token = result.stdout.trim();
      return token || undefined;
    } catch (error) {
      if (isMissingKeychainItem(error)) return undefined;
      throw error;
    }
  }

  async set(deviceId: string, token: string): Promise<void> {
    if (!deviceId.trim()) throw new Error("Keychain token storage requires a device ID");
    if (!token.trim()) throw new Error("Keychain token storage refuses an empty token");

    await this.runner.run([
      "add-generic-password",
      "-U",
      "-a",
      deviceId,
      "-s",
      this.service,
      "-w",
      token,
    ]);
  }

  async delete(deviceId: string): Promise<void> {
    try {
      await this.runner.run([
        "delete-generic-password",
        "-a",
        deviceId,
        "-s",
        this.service,
      ]);
    } catch (error) {
      if (!isMissingKeychainItem(error)) throw error;
    }
  }
}

function isMissingKeychainItem(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /could not be found|item not found|no such item/i.test(message);
}

export type VizioTlsPolicy =
  | { mode: "system" }
  | { mode: "pinned"; sha256: string };

export function normalizeSha256Fingerprint(value: string): string {
  const normalized = value.replaceAll(":", "").replaceAll(" ", "").toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(normalized)) {
    throw new Error("TLS SHA-256 fingerprint must contain exactly 64 hexadecimal characters");
  }
  return normalized;
}

export function assertVizioCertificateFingerprint(
  policy: VizioTlsPolicy,
  actualFingerprint: string,
): void {
  if (policy.mode === "system") return;
  const expected = normalizeSha256Fingerprint(policy.sha256);
  const actual = normalizeSha256Fingerprint(actualFingerprint);
  if (expected !== actual) throw new Error("VIZIO certificate fingerprint did not match the pinned device");
}
