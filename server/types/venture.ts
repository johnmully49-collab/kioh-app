export const VENTURE_DOMAINS = [
  "AgriTech",
  "Climate & CleanTech",
  "Education",
  "Finance & FinTech",
  "Health",
  "Software & AI",
  "Creative Industries",
  "Community & Social Impact",
  "Other",
] as const;

export const VENTURE_STAGES = [
  "Idea",
  "Prototype",
  "Early traction",
  "Growing",
] as const;

export type VentureDomain = (typeof VENTURE_DOMAINS)[number];
export type VentureStage = (typeof VENTURE_STAGES)[number];
export type VentureReviewStatus = "Under Review" | "Approved" | "Rejected";

export interface Venture {
  id: string;
  name: string;
  tagline: string;
  description: string;
  domain: VentureDomain;
  county: string;
  stage: VentureStage;
  websiteUrl: string | null;
  publicEmail: string;
  linkedinUrl: string | null;
  founderName: string;
  founderOrganization: string | null;
  createdAt: string;
  reviewStatus?: VentureReviewStatus;
}
