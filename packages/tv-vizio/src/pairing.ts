import {
  parsePairingCompleteResponse,
  parsePairingStartResponse,
  type VizioPairingChallenge,
} from "./protocol.js";
import {
  VIZIO_PAIRING_PAIR_PATH,
  VIZIO_PAIRING_START_PATH,
  type VizioHttpTransport,
  type VizioTokenStore,
} from "./types.js";
import { VizioFetchTransport } from "./client.js";

export interface VizioPairingClientOptions {
  baseUrl: string;
  deviceId: string;
  deviceName: string;
  transport?: VizioHttpTransport;
}

export interface VizioPairingSession extends VizioPairingChallenge {
  deviceId: string;
  deviceName: string;
}

export class VizioPairingClient {
  private readonly deviceId: string;
  private readonly deviceName: string;
  private readonly transport: VizioHttpTransport;

  constructor(options: VizioPairingClientOptions) {
    if (!options.deviceId.trim()) throw new Error("VIZIO pairing requires a stable device ID");
    if (!options.deviceName.trim()) throw new Error("VIZIO pairing requires a device name");

    const baseUrl = new URL(options.baseUrl).toString().replace(/\/$/, "");
    this.deviceId = options.deviceId;
    this.deviceName = options.deviceName;
    this.transport = options.transport ?? new VizioFetchTransport(baseUrl);
  }

  async start(): Promise<VizioPairingSession> {
    const response = await this.put(VIZIO_PAIRING_START_PATH, {
      DEVICE_ID: this.deviceId,
      DEVICE_NAME: this.deviceName,
    });
    const challenge = parsePairingStartResponse(response);
    return { ...challenge, deviceId: this.deviceId, deviceName: this.deviceName };
  }

  async complete(session: VizioPairingSession, pin: string): Promise<string> {
    if (session.deviceId !== this.deviceId) throw new Error("Pairing session belongs to another device ID");
    if (!/^\d{4}$/.test(pin)) throw new Error("VIZIO pairing PIN must be exactly four digits");

    const response = await this.put(VIZIO_PAIRING_PAIR_PATH, {
      DEVICE_ID: session.deviceId,
      CHALLENGE_TYPE: session.challengeType,
      RESPONSE_VALUE: pin,
      PAIRING_REQ_TOKEN: session.pairingRequestToken,
    });
    return parsePairingCompleteResponse(response);
  }

  private async put(path: string, body: unknown): Promise<unknown> {
    if (!this.transport.put) throw new Error("VIZIO pairing requires a PUT-capable transport");
    return this.transport.put(path, body);
  }
}

/** In-memory storage for tests and local plumbing only; never use for production credentials. */
export class InMemoryVizioTokenStore implements VizioTokenStore {
  private readonly tokens = new Map<string, string>();

  async get(deviceId: string): Promise<string | undefined> {
    return this.tokens.get(deviceId);
  }

  async set(deviceId: string, token: string): Promise<void> {
    this.tokens.set(deviceId, token);
  }

  async delete(deviceId: string): Promise<void> {
    this.tokens.delete(deviceId);
  }
}
