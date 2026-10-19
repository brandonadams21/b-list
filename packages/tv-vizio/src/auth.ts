import { VizioPairingClient, type VizioPairingClientOptions, type VizioPairingSession } from "./pairing.js";
import type { VizioTokenStore } from "./types.js";

export interface VizioPairingManagerOptions extends VizioPairingClientOptions {
  tokenStore: VizioTokenStore;
}

export interface VizioPairedDevice {
  deviceId: string;
  deviceName: string;
}

/** Coordinates pairing with the protected token-store boundary. The token never leaves this class. */
export class VizioPairingManager {
  private readonly client: VizioPairingClient;
  private readonly tokenStore: VizioTokenStore;
  private readonly deviceId: string;

  constructor(options: VizioPairingManagerOptions) {
    this.client = new VizioPairingClient(options);
    this.tokenStore = options.tokenStore;
    this.deviceId = options.deviceId;
  }

  start(): Promise<VizioPairingSession> {
    return this.client.start();
  }

  async complete(session: VizioPairingSession, pin: string): Promise<VizioPairedDevice> {
    const token = await this.client.complete(session, pin);
    await this.tokenStore.set(session.deviceId, token);
    return { deviceId: session.deviceId, deviceName: session.deviceName };
  }

  getToken(): Promise<string | undefined> {
    return this.tokenStore.get(this.deviceId);
  }

  async deleteToken(): Promise<void> {
    await this.tokenStore.delete(this.deviceId);
  }
}
