import { describe, expect, it } from "vitest";
import { TvDiscoveryCandidateSchema } from "./index.js";

describe("shared contracts", () => {
  it("validates a discovered TV candidate", () => {
    expect(
      TvDiscoveryCandidateSchema.parse({
        id: "uuid:sample-tv",
        location: "https://192.168.1.50:7345",
      }),
    ).toEqual({
      id: "uuid:sample-tv",
      location: "https://192.168.1.50:7345",
    });
  });
});
