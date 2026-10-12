export type OpportunityCategory =
  | "All"
  | "Grants & Funding"
  | "Incubators & Accelerators"
  | "Hackathons & Challenges"
  | "Fellowships & Training"
  | "Scholarships";

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  county: string; // e.g., "Kiambu", "Nairobi", "Nationwide"
  grantAmount: number; // Max funding in KSh or USD equivalent
  grantAmountLabel: string; // Display label (e.g., "KSh 500,000" or "$10,000")
  deadline: string;
  description: string;
  eligibility: string[];
  tags: string[];
  featured?: boolean;
  applicationUrl?: string;
}