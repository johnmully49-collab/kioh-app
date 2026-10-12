import { RoadmapMilestone } from "@/server/types";

const mockRoadmap: RoadmapMilestone[] = [
  {
    phase: "Phase 01",
    title: "Ecosystem Foundation",
    year: "2024 - 2026",
    summary: "Establish KIOH hub nodes across universities and community centers.",
    details: [
      "Launch Opportunity Board & Mentorship Directory",
      "Reach 50,000 active students and builders",
      "Form strategic partnerships with local labs",
    ],
  },
  {
    phase: "Phase 02",
    title: "Regional Acceleration",
    year: "2027 - 2030",
    summary: "Expand physical problem labs and provide seed micro-grants.",
    details: [
      "Establish 10 regional community research labs",
      "Deploy AI skill academies across Kenya",
      "Fund top 100 youth-led innovation projects",
    ],
  },
];

export async function fetchRoadmapMilestones(): Promise<RoadmapMilestone[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockRoadmap), 100));
}