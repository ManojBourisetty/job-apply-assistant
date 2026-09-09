import { fetchGreenhouseJobs } from "./greenhouse";
import { fetchLeverJobs } from "./lever";
import { fetchAshbyJobs } from "./ashby";
import type { AtsProvider, NormalizedJob } from "./types";

export { AtsFetchError } from "./types";
export type { NormalizedJob, AtsProvider } from "./types";

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
  }
}
