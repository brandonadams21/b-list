import { describe, expect, it } from "vitest";
import { buildSsdpRequest, parseDeviceInfo, parseSsdpResponse } from "./protocol.js";

describe("VIZIO protocol parsing", () => {
  it("builds the approved VIZIO SSDP discovery request", () => {
    expect(buildSsdpRequest().toString()).toContain(
      "ST: urn:schemas-kinoma-com:device:shell:1",
    );
    expect(buildSsdpRequest().toString()).toContain("HOST: 239.255.255.250:1900");
  });

  it("parses SSDP headers case-insensitively", () => {
    const candidate = parseSsdpResponse(
      [
        "HTTP/1.1 200 OK",
        "LOCATION: https://192.168.1.50:7345/",
        "USN: uuid:sample-tv",
        "",
        "",
      ].join("\r\n"),
    );

    expect(candidate).toEqual({
      id: "uuid:sample-tv",
      location: "https://192.168.1.50:7345/",
      usn: "uuid:sample-tv",
    });
  });

  it("normalizes the read-only device info response", () => {
    const info = parseDeviceInfo({
      STATUS: { RESULT: "SUCCESS", DETAIL: "Success" },
      ITEMS: [
        {
          CNAME: "deviceinfo",
          VALUE: {
            MODEL_NAME: "W4K65M-1030",
            DEVICE_NAME: "B-List TV",
            SERIAL_NUMBER: "redacted-fixture",
          },
        },
      ],
    });

    expect(info.model).toBe("W4K65M-1030");
    expect(info.name).toBe("B-List TV");
    expect(info.serialNumber).toBe("redacted-fixture");
  });
});
