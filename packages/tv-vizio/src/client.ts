import { VIZIO_DEVICE_INFO_PATH, type VizioDeviceInfo, type VizioDiscoveryCandidate, type VizioHttpTransport } from "./types.js";
import { parseDeviceInfo } from "./protocol.js";

export interface VizioReadOnlyClientOptions {
  baseUrl: string;
  transport?: VizioHttpTransport;
}

export class VizioReadOnlyClient {
  private readonly baseUrl: string;
  private readonly transport: VizioHttpTransport;

  constructor(options: VizioReadOnlyClientOptions) {
    this.baseUrl = new URL(options.baseUrl).toString().replace(/\/$/, "");
    this.transport = options.transport ?? new FetchTransport(this.baseUrl);
  }

  static fromDiscovery(candidate: VizioDiscoveryCandidate, transport?: VizioHttpTransport): VizioReadOnlyClient {
    return new VizioReadOnlyClient({ baseUrl: candidate.location, transport });
  }

  async getDeviceInfo(): Promise<VizioDeviceInfo> {
    return parseDeviceInfo(await this.transport.get(VIZIO_DEVICE_INFO_PATH));
  }
}

class FetchTransport implements VizioHttpTransport {
  constructor(private readonly baseUrl: string) {}

  async get(path: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`VIZIO request failed with HTTP ${response.status}`);
    return response.json();
  }
}
