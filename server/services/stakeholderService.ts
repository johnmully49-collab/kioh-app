import { StakeholderPartner } from "@/server/types";

const mockStakeholders: StakeholderPartner[] = [
  {
    id: "donors",
    title: "Donors & Sponsors",
    badge: "FUND THE FUTURE",
    icon: "💎",
    tagline: "Fuel youth innovation and sponsor regional problem labs.",
    description: "Support emerging talent by funding micro-grants, hackathons, and fellowships.",
    benefits: ["Transparent impact tracking", "Direct event exposure", "Named grant programs"],
    cta: "Partner as a Funder",
    roleType: "donor",
  },
  {
    id: "mentors",
    title: "Industry Mentors",
    badge: "SHARE KNOWLEDGE",
    icon: "🧠",
    tagline: "Guide motivated students and young developers.",
    description: "Dedicate 1-2 hours a month to provide 1-on-1 code reviews and career guidance.",
    benefits: ["Access to technical talent", "Flexible remote scheduling", "Exclusive network access"],
    cta: "Apply as a Mentor",
    roleType: "mentor",
  },
];

export async function fetchAllStakeholders(): Promise<StakeholderPartner[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockStakeholders), 100));
}