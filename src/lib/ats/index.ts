import { fetchGreenhouseJobs } from "./greenhouse";
import { fetchLeverJobs } from "./lever";
import { fetchAshbyJobs } from "./ashby";
import { fetchWorkdayJobs } from "./workday";
import type { AtsProvider, NormalizedJob } from "./types";

export { AtsFetchError } from "./types";
export type { NormalizedJob, AtsProvider, AggregatorProvider } from "./types";
export { fetchAdzunaJobs, isAdzunaConfigured, isAdzunaCountry } from "./adzuna";
export type { AdzunaCountry } from "./adzuna";

export async function fetchFromProvider(
  provider: AtsProvider,
  boardToken: string
): Promise<NormalizedJob[]> {
  switch (provider) {
    case "greenhouse":
      return fetchGreenhouseJobs(boardToken);
    case "lever":
      return fetchLeverJobs(boardToken);
    case "ashby":
      return fetchAshbyJobs(boardToken);
    case "workday":
      return fetchWorkdayJobs(boardToken);
  }
}
