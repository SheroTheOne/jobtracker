import "server-only";
import { z } from "zod";

/**
 * Klient för Arbetsförmedlingens öppna JobSearch-API (JobTech Dev) – samma annonser som Platsbanken.
 * Ingen nyckel krävs. https://jobsearch.api.jobtechdev.se
 *
 * Svaren valideras med Zod: externa API:er ändras, och vi vill hellre visa ett tydligt fel
 * än krascha på ett oväntat fält. Bara fälten vi använder parsas.
 */

const BASE_URL = "https://jobsearch.api.jobtechdev.se";
const TIMEOUT_MS = 15_000;
export const PLATSBANKEN_SOURCE = "platsbanken";
export const PAGE_SIZE = 20;

const adSchema = z.object({
  id: z.string(),
  headline: z.string(),
  webpage_url: z.string().nullable(),
  publication_date: z.string(),
  application_deadline: z.string().nullable(),
  employer: z.object({ name: z.string().nullable() }).nullable(),
  workplace_address: z.object({ municipality: z.string().nullable(), region: z.string().nullable() }).nullable(),
  description: z.object({ text: z.string().nullable() }).nullable(),
  employment_type: z.object({ label: z.string().nullable() }).nullable(),
});

const searchResponseSchema = z.object({
  total: z.object({ value: z.number() }),
  hits: z.array(adSchema),
});

export interface JobAd {
  id: string;
  title: string;
  employer: string;
  location: string | null;
  url: string;
  description: string;
  employmentType: string | null;
  publishedAt: Date;
  deadline: Date | null;
}

export interface JobSearchResult {
  total: number;
  ads: JobAd[];
}

export class JobSourceError extends Error {
  override name = "JobSourceError";
}

function toJobAd(raw: z.infer<typeof adSchema>): JobAd {
  return {
    id: raw.id,
    title: raw.headline,
    employer: raw.employer?.name?.trim() || "Okänd arbetsgivare",
    location: raw.workplace_address?.municipality ?? raw.workplace_address?.region ?? null,
    url: raw.webpage_url ?? `https://arbetsformedlingen.se/platsbanken/annonser/${raw.id}`,
    description: raw.description?.text?.trim() ?? "",
    employmentType: raw.employment_type?.label ?? null,
    publishedAt: new Date(raw.publication_date),
    deadline: raw.application_deadline ? new Date(raw.application_deadline) : null,
  };
}

async function request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[jobs/platsbanken] network", error);
    throw new JobSourceError("Kunde inte nå Arbetsförmedlingen. Kontrollera din uppkoppling.");
  }

  if (response.status === 404) throw new JobSourceError("Annonsen finns inte längre i Platsbanken.");
  if (!response.ok) throw new JobSourceError(`Arbetsförmedlingen svarade med fel (${response.status}). Försök igen.`);

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("[jobs/platsbanken] unexpected response", z.prettifyError(parsed.error));
    throw new JobSourceError("Oväntat svar från Arbetsförmedlingen.");
  }
  return parsed.data;
}

export async function searchJobs(query: string, offset = 0): Promise<JobSearchResult> {
  const params = new URLSearchParams({ q: query.trim(), limit: String(PAGE_SIZE), offset: String(offset) });
  const data = await request(`/search?${params}`, searchResponseSchema);
  return { total: data.total.value, ads: data.hits.map(toJobAd) };
}

export async function getJobAd(id: string): Promise<JobAd> {
  return toJobAd(await request(`/ad/${encodeURIComponent(id)}`, adSchema));
}
