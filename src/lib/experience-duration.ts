// Deterministic (non-AI) total-years-of-experience calculator. The AI resume
// parser is explicitly forbidden from computing this — it's a numeric
// derivation, not something "extracted" from text — but every experience
// entry already carries start/end dates once parsed, so we can compute it
// ourselves from those, the same way technology-extraction.ts scans text
// instead of asking the AI to guess. Overlapping/concurrent roles are
// merged so they aren't double-counted.

type DatedExperience = {
  start_date: string;
  end_date: string;
  is_current: boolean;
};

// Accepts "YYYY-MM" or "YYYY" (the two formats the resume parser emits).
// Returns an absolute month index (year * 12 + monthIndex), or null if the
// string doesn't parse. `endOfYear` controls whether a year-only value
// resolves to January (start of range) or December (end of range).
function parseToMonthIndex(value: string, endOfYear: boolean): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fullMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (fullMatch) {
    const year = Number(fullMatch[1]);
    const month = Number(fullMatch[2]);
    if (month < 1 || month > 12) return null;
    return year * 12 + (month - 1);
  }

  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return year * 12 + (endOfYear ? 11 : 0);
  }

  return null;
}

function mergeIntervals(intervals: [number, number][]): [number, number][] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/**
 * Computes total years of experience from a list of experience entries by
 * merging their date ranges (so concurrent/overlapping roles count once)
 * and summing the resulting months. Returns null if no entry has a
 * parseable start date.
 */
export function calculateYearsExperience(experience: DatedExperience[]): number | null {
  const now = new Date();
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();

  const intervals: [number, number][] = [];
  for (const exp of experience) {
    const start = parseToMonthIndex(exp.start_date, false);
    if (start === null) continue;

    const end = exp.is_current
      ? currentMonthIndex
      : parseToMonthIndex(exp.end_date, true);
    if (end === null || end < start) continue;

    intervals.push([start, end]);
  }

  if (intervals.length === 0) return null;

  const totalMonths = mergeIntervals(intervals).reduce(
    (sum, [start, end]) => sum + (end - start + 1),
    0
  );

  return Math.round((totalMonths / 12) * 2) / 2;
}
