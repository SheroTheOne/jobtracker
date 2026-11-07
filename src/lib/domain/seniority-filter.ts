/**
 * Känner igen seniora roller utifrån annonsens TITEL.
 *
 * Filtreringen görs lokalt i stället för med minusord mot sök-API:t: minusord matchar hela
 * annonstexten och slår då bort just de junior-vänliga annonserna ("stöd av seniora kollegor").
 */
/** Fristående ord: "Senior utvecklare", "Tech Lead", "Head of Engineering". */
const SENIOR_WORD = /(?<![\p{L}\p{N}])(senior|sr\.?|lead|principal|staff|architect|head of|manager)(?![\p{L}\p{N}])/iu;

/** Svenska sammansättningar som slutar på -chef/-arkitekt: "Utvecklingschef", "Lösningsarkitekt". */
const SENIOR_COMPOUND_SUFFIX = /(chef|arkitekt)(?![\p{L}\p{N}])/iu;

export function isSeniorTitle(title: string): boolean {
  return SENIOR_WORD.test(title) || SENIOR_COMPOUND_SUFFIX.test(title);
}
