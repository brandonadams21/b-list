import { z } from "zod";
import {
  VIZIO_SSDP_ADDRESS,
  VIZIO_SSDP_PORT,
  VIZIO_SSDP_TARGET,
  type VizioApiResponse,
  type VizioDeviceInfo,
  type VizioDiscoveryCandidate,
} from "./types.js";

const VizioApiResponseSchema = z
  .object({
    STATUS: z
      .object({
        RESULT: z.string().optional(),
        DETAIL: z.string().optional(),
      })
      .passthrough()
      .optional(),
    ITEMS: z.array(z.record(z.unknown())).optional(),
    ITEM: z.record(z.unknown()).optional(),
    URI: z.string().optional(),
    TIME: z.string().optional(),
  })
  .passthrough();

export function buildSsdpRequest(): Buffer {
  return Buffer.from(
    [
      "M-SEARCH * HTTP/1.1",
      `HOST: ${VIZIO_SSDP_ADDRESS}:${VIZIO_SSDP_PORT}`,
      'MAN: "ssdp:discover"',
      "MX: 1",
      `ST: ${VIZIO_SSDP_TARGET}`,
      "",
      "",
    ].join("\r\n"),
    "utf8",
  );
}

export function parseSsdpResponse(message: string): VizioDiscoveryCandidate | null {
  const lines = message.split(/\r?\n/);
  const statusLine = lines.shift()?.trim() ?? "";
  if (!/^HTTP\/1\.1\s+200\s+/i.test(statusLine)) return null;

  const headers = new Map<string, string>();
  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    headers.set(line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim());
  }

  const location = headers.get("location");
  const usn = headers.get("usn");
  if (!location) return null;

  return {
    id: usn ?? location,
    location,
    ...(usn ? { usn } : {}),
  };
}

export function parseVizioApiResponse(value: unknown): VizioApiResponse {
  return VizioApiResponseSchema.parse(value);
}

function findValue(value: unknown, keys: Set<string>): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  for (const [key, nested] of Object.entries(value)) {
    if (keys.has(key.toUpperCase()) && typeof nested === "string") return nested;
    const found = findValue(nested, keys);
    if (found) return found;
  }
  return undefined;
}

export function parseDeviceInfo(value: unknown): VizioDeviceInfo {
  const raw = parseVizioApiResponse(value);
  return {
    model: findValue(raw, new Set(["MODEL_NAME", "MODEL"])),
    name: findValue(raw, new Set(["DEVICE_NAME", "NAME"])),
    serialNumber: findValue(raw, new Set(["SERIAL_NUMBER", "SERIAL"])),
    raw,
  };
}
