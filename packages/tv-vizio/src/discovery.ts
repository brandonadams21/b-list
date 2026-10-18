import dgram from "node:dgram";
import { parseSsdpResponse } from "./protocol.js";
import {
  VIZIO_SSDP_ADDRESS,
  VIZIO_SSDP_PORT,
  type VizioDiscoveryCandidate,
} from "./types.js";

export interface DiscoveryOptions {
  timeoutMs?: number;
}

export function discoverVizioDevices({ timeoutMs = 1500 }: DiscoveryOptions = {}): Promise<VizioDiscoveryCandidate[]> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    const discovered = new Map<string, VizioDiscoveryCandidate>();
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.close();
      if (error) reject(error);
      else resolve([...discovered.values()]);
    };

    const timeout = setTimeout(() => finish(), timeoutMs);

    socket.on("message", (message) => {
      const candidate = parseSsdpResponse(message.toString("utf8"));
      if (candidate) discovered.set(candidate.id, candidate);
    });
    socket.once("error", (error) => finish(error));
    socket.bind(() => {
      socket.send(buildRequest(), VIZIO_SSDP_PORT, VIZIO_SSDP_ADDRESS);
    });
  });
}

function buildRequest(): Buffer {
  return Buffer.from(
    [
      "M-SEARCH * HTTP/1.1",
      `HOST: ${VIZIO_SSDP_ADDRESS}:${VIZIO_SSDP_PORT}`,
      'MAN: "ssdp:discover"',
      "MX: 1",
      "ST: urn:schemas-kinoma-com:device:shell:1",
      "",
      "",
    ].join("\r\n"),
    "utf8",
  );
}
