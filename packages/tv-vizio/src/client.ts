import {
  assertVizioCertificateFingerprint,
  type VizioTlsPolicy,
} from "./security.js";
import {
  VIZIO_DEVICE_INFO_PATH,
  type VizioDeviceInfo,
  type VizioDiscoveryCandidate,
  type VizioHttpTransport,
  type VizioTokenStore,
} from "./types.js";
import { parseDeviceInfo } from "./protocol.js";

export interface VizioReadOnlyClientOptions {
  baseUrl: string;
  transport?: VizioHttpTransport;
  tlsPolicy?: VizioTlsPolicy;
  peerCertificateFingerprint?: () => Promise<string>;
}

export class VizioReadOnlyClient {
  protected readonly baseUrl: string;
  protected readonly transport: VizioHttpTransport;

  constructor(options: VizioReadOnlyClientOptions) {
    this.baseUrl = new URL(options.baseUrl).toString().replace(/\/$/, "");
    this.transport =
      options.transport ??
      new VizioFetchTransport(this.baseUrl, {
        tlsPolicy: options.tlsPolicy,
        peerCertificateFingerprint: options.peerCertificateFingerprint,
      });
  }

  static fromDiscovery(candidate: VizioDiscoveryCandidate, transport?: VizioHttpTransport): VizioReadOnlyClient {
    return new VizioReadOnlyClient({ baseUrl: candidate.location, transport });
  }

  async getDeviceInfo(): Promise<VizioDeviceInfo> {
    return parseDeviceInfo(await this.transport.get(VIZIO_DEVICE_INFO_PATH));
  }
}

export interface VizioAuthenticatedReadClientOptions extends VizioReadOnlyClientOptions {
  deviceId: string;
  tokenStore: VizioTokenStore;
}

/** Read-only client that retrieves the device-scoped AUTH token without exposing it to callers. */
export class VizioAuthenticatedReadClient extends VizioReadOnlyClient {
  private readonly deviceId: string;
  private readonly tokenStore: VizioTokenStore;

  constructor(options: VizioAuthenticatedReadClientOptions) {
    super(options);
    if (!options.deviceId.trim()) throw new Error("Authenticated VIZIO reads require a device ID");
    this.deviceId = options.deviceId;
    this.tokenStore = options.tokenStore;
  }

  override async getDeviceInfo(): Promise<VizioDeviceInfo> {
    const token = await this.tokenStore.get(this.deviceId);
    if (!token) throw new Error("No VIZIO auth token is stored for this device");
    return parseDeviceInfo(await this.transport.get(VIZIO_DEVICE_INFO_PATH, { AUTH: token }));
  }
}

export class VizioFetchTransport implements VizioHttpTransport {
  private readonly tlsPolicy: VizioTlsPolicy;
  private readonly peerCertificateFingerprint?: () => Promise<string>;

  constructor(
    private readonly baseUrl: string,
    options: {
      tlsPolicy?: VizioTlsPolicy;
      peerCertificateFingerprint?: () => Promise<string>;
    } = {},
  ) {
    this.tlsPolicy = options.tlsPolicy ?? { mode: "system" };
    this.peerCertificateFingerprint = options.peerCertificateFingerprint;
  }

  async get(path: string, headers: Record<string, string> = {}): Promise<unknown> {
    await this.assertTransportTrust();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: { Accept: "application/json", ...headers },
    });
    if (!response.ok) throw new Error(`VIZIO request failed with HTTP ${response.status}`);
    return response.json();
  }

  async put(path: string, body: unknown, headers: Record<string, string> = {}): Promise<unknown> {
    await this.assertTransportTrust();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`VIZIO request failed with HTTP ${response.status}`);
    return response.json();
  }

  private async assertTransportTrust(): Promise<void> {
    if (this.tlsPolicy.mode === "system") return;
    if (!this.peerCertificateFingerprint) {
      throw new Error("Pinned VIZIO TLS requires a peer certificate fingerprint verifier");
    }
    assertVizioCertificateFingerprint(this.tlsPolicy, await this.peerCertificateFingerprint());
  }
}
