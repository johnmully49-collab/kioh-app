import { Opportunity } from "@/server/types";

// Mock database data for now (swap with Prisma / Supabase queries later)
const mockOpportunities: Opportunity[] = [
  {
    id: "opp-1",
    type: "FELLOWSHIP",
    category: "Fellowships",
    title: "Leadership & Impact Fellowship 2027",
    organization: "KIOH Initiatives",
    deadline: "Nov 30, 2026",
    location: "Nairobi / Hybrid",
    description: "Develop your leadership, project management, and network to drive real change.",
    eligibility: ["Aged 18–28", "Based in Kenya"],
    tags: ["Leadership", "Impact"],
  },
];

export async function fetchAllOpportunities(): Promise<Opportunity[]> {
  // Simulate DB latency
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockOpportunities), 100);
  });
}