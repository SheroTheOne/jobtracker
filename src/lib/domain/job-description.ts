/** Kortare annonstext än så här ger ingen meningsfull AI-analys (ofta bara en rubrik eller en länk). */
export const JOB_DESCRIPTION_MIN_LENGTH = 100;

export function canAnalyzeJobDescription(text: string | null | undefined): boolean {
  return (text?.trim().length ?? 0) >= JOB_DESCRIPTION_MIN_LENGTH;
}
