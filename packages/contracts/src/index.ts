import { z } from "zod";

export const TvCapabilitySchema = z.enum(["read-device-info"]);

export const TvDiscoveryCandidateSchema = z.object({
  id: z.string().min(1),
  location: z.string().url(),
  usn: z.string().optional(),
});

export type TvCapability = z.infer<typeof TvCapabilitySchema>;
export type TvDiscoveryCandidate = z.infer<typeof TvDiscoveryCandidateSchema>;
