export const VIZIO_SSDP_ADDRESS = "239.255.255.250";
export const VIZIO_SSDP_PORT = 1900;
export const VIZIO_SSDP_TARGET = "urn:schemas-kinoma-com:device:shell:1";
export const VIZIO_DEVICE_INFO_PATH = "/state/device/deviceinfo";

export interface VizioDiscoveryCandidate {
  id: string;
  location: string;
  usn?: string;
}

export interface VizioDeviceInfo {
  model?: string;
  name?: string;
  serialNumber?: string;
  raw: VizioApiResponse;
}

export interface VizioApiResponse {
  STATUS?: {
    RESULT?: string;
    DETAIL?: string;
    [key: string]: unknown;
  };
  ITEMS?: Array<Record<string, unknown>>;
  ITEM?: Record<string, unknown>;
  URI?: string;
  TIME?: string;
  [key: string]: unknown;
}

export interface VizioHttpTransport {
  get(path: string): Promise<unknown>;
}
