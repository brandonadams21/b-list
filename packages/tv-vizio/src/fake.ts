import type { VizioHttpTransport } from "./types.js";

export interface FakeVizioDeviceOptions {
  deviceId?: string;
  deviceName?: string;
  pin?: string;
  authToken?: string;
}

export interface FakeVizioKeyCommand {
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

/**
 * An in-memory SmartCast-shaped device for contract and UI tests.
 * It has no sockets, timers, filesystem access, or real-TV side effects.
 */
export class FakeVizioDevice implements VizioHttpTransport {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly pin: string;
  private readonly authToken: string;
  private readonly pairingRequestToken = 2468;
  private paired = false;
  private readonly keyCommands: FakeVizioKeyCommand[] = [];

  constructor(options: FakeVizioDeviceOptions = {}) {
    this.deviceId = options.deviceId ?? "fake-vizio-device";
    this.deviceName = options.deviceName ?? "B-List Simulator TV";
    this.pin = options.pin ?? "1234";
    this.authToken = options.authToken ?? "fake-vizio-auth-token";
    if (!/^\d{4}$/.test(this.pin)) throw new Error("Fake VIZIO PIN must be exactly four digits");
  }

  async get(path: string): Promise<unknown> {
    if (path !== "/state/device/deviceinfo") {
      throw new Error(`Fake VIZIO does not implement GET ${path}`);
    }
    return {
      STATUS: { RESULT: "SUCCESS" },
      ITEM: { MODEL_NAME: "FAKE-2025", DEVICE_NAME: this.deviceName, SERIAL_NUMBER: "SIMULATOR" },
    };
  }

  async put(path: string, body: unknown, headers: Record<string, string> = {}): Promise<unknown> {
    if (path === "/pairing/start") {
      return {
        STATUS: { RESULT: "SUCCESS" },
        ITEM: { PAIRING_REQ_TOKEN: this.pairingRequestToken, CHALLENGE_TYPE: 1 },
      };
    }

    if (path === "/pairing/pair") {
      const request = body as Record<string, unknown>;
      if (request.RESPONSE_VALUE !== this.pin) {
        return { STATUS: { RESULT: "FAILURE", DETAIL: "CHALLENGE_INCORRECT" } };
      }
      this.paired = true;
      return { STATUS: { RESULT: "SUCCESS" }, ITEM: { AUTH_TOKEN: this.authToken } };
    }

    if (path === "/key_command/") {
      if (!this.paired || headers.AUTH !== this.authToken) {
        return { STATUS: { RESULT: "FAILURE", DETAIL: "AUTHENTICATION_FAILED" } };
      }
      this.keyCommands.push({ path, body, headers: { ...headers } });
      return { STATUS: { RESULT: "SUCCESS" } };
    }

    throw new Error(`Fake VIZIO does not implement PUT ${path}`);
  }

  isPaired(): boolean {
    return this.paired;
  }

  getKeyCommands(): readonly FakeVizioKeyCommand[] {
    return this.keyCommands.map((command) => ({ ...command, headers: { ...command.headers } }));
  }
}
