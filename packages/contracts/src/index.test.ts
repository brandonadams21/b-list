import { describe, expect, it } from "vitest";
import {
  MovieSearchQuerySchema,
  MovieSearchResponseSchema,
  TvDiscoveryCandidateSchema,
} from "./index.js";

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

  it("normalizes movie search input and output", () => {
    expect(MovieSearchQuerySchema.parse({ query: "  dune ", limit: "5" })).toEqual({
      query: "dune",
      limit: 5,
    });
    expect(
      MovieSearchResponseSchema.parse({
        query: "dune",
        provider: "fixture",
        results: [{ id: "dune-2021", title: "Dune", genres: ["Sci-Fi"] }],
      }).results[0]?.title,
    ).toBe("Dune");
  });
});
