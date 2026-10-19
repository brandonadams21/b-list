import { z } from "zod";

export const TvCapabilitySchema = z.enum(["read-device-info"]);

export const TvDiscoveryCandidateSchema = z.object({
  id: z.string().min(1),
  location: z.string().url(),
  usn: z.string().optional(),
});

export type TvCapability = z.infer<typeof TvCapabilitySchema>;
export type TvDiscoveryCandidate = z.infer<typeof TvDiscoveryCandidateSchema>;

export const MovieSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int().min(1888).max(3000).optional(),
  genres: z.array(z.string().min(1)).default([]),
  overview: z.string().optional(),
  posterUrl: z.string().url().optional(),
});

export const MovieSearchQuerySchema = z.object({
  query: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const MovieSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(MovieSummarySchema),
  provider: z.string().min(1),
});

export type MovieSummary = z.infer<typeof MovieSummarySchema>;
export type MovieSearchQuery = z.infer<typeof MovieSearchQuerySchema>;
export type MovieSearchResponse = z.infer<typeof MovieSearchResponseSchema>;
