export interface MonthlyEngagement {
  month: string;
  label: string;
  members: number | null;
  applications: number | null;
  ventures: number | null;
}

export interface CountyFundingListings {
  county: string;
  count: number;
}

export interface CountyMemberCount {
  county: string;
  count: number;
}

export interface VentureSectorCount {
  sector: string;
  count: number;
}

export interface EcosystemAnalytics {
  generatedAt: string;
  totals: {
    members: number;
    opportunityApplications: number;
    activeFundingListings: number;
    approvedVentures: number;
    mentorApplications: number;
  };
  monthlyEngagement: MonthlyEngagement[];
  fundingByCounty: CountyFundingListings[];
  membersByCounty: CountyMemberCount[];
  venturesBySector: VentureSectorCount[];
  suppressedCountyCounts: number;
}
