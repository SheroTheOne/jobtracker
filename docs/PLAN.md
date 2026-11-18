# Utvecklingsplan

Senast uppdaterad: 2026-11-18. Planen bygger på en genomgång av hela kodbasen (arkitektur, datamodell, AI-flöde, tester). Varje punkt har en motivering och ett acceptanskriterium. Prioriteten går uppifrån och ned.

## Nuläge

Kärnflödet fungerar: ansökningar med statusflöde och uppföljning, profil med CV-uppladdning, jobbsökning i Platsbanken och AI-matchning med verifierade citat och poäng som räknas i kod. Kodbasen är i gott skick: strikt TypeScript, tydliga lager, ren domänlogik med enhetstester, Zod på alla gränser (formulär, Json-kolumner, externt API, AI-svar).

### Styrkor att behålla

- **Poängen räknas i kod** och citaten verifieras mot CV:t. Modellen klassificerar, koden räknar.
- **Resultattyper i stället för kastade fel** genom AI- och action-lagret. UI:t får alltid ett begripligt meddelande.
- **Spårbarhet:** rapporter sparas med modell, promptversion, schemaversion och CV-fingeravtryck.
- **Cache Components används rätt:** `await io()` före synkrona SQLite-läsningar och Suspense runt allt dynamiskt.

### Brister som hittades i granskningen

| # | Område | Brist | Status |
| - | ------ | ----- | ------ |
| 1 | AI | Citatverifieringen godtog ordfragment ("act" i "React"), struntade i ordningen mellan delar av ett citat med ellips och föll på PDF-artefakter (ligaturer, NFD-tecken, mjuka bindestreck) och avslutande punkt. | ✅ Åtgärdad |
| 2 | AI | Ett krav som modellen lade i både `matched` och `missing`, eller upprepade, räknades flera gånger i poängen. Dubblettexter gav dessutom React-varningar om dubbla nycklar. | ✅ Åtgärdad |
| 3 | AI | Ett svar utan krav gav 0 % i stället för ett fel. | ✅ Åtgärdad |
| 4 | AI | `NoOutputGeneratedError` (trunkerat eller blockerat svar) klassades som "okänt fel". Inga omförsök vid ogiltig output, eftersom AI SDK bara försöker om vid 429/5xx. | ✅ Åtgärdad |
| 5 | AI | En annons som innehöll `</annons>` kunde bryta sig ut ur datataggen (prompt injection). | ✅ Åtgärdad |
| 6 | AI | CV-förslaget kunde bryta mot formulärets gränser (för många eller för långa kompetenser), så att användaren inte kunde spara. Hela texten från en 5 MB-fil skickades till AI:n. | ✅ Åtgärdad |
| 7 | Arkitektur | `domain/` berodde på `ai/` (kravtyperna låg i AI-schemat). Mock, timeout, omförsök och loggning var duplicerade i två AI-flöden. | ✅ Åtgärdad |
| 8 | Data | Statusändringar och profilsparning läste och skrev i separata frågor, utan transaktion. | ✅ Åtgärdad |
| 9 | Data | Profilen hämtades flera gånger per sidvisning (sidan, matchningspanelen). | ✅ Åtgärdad (React `cache`) |
| 10 | Externt API | Ett ogiltigt datum från Platsbanken kraschade hela resultatlistan. Annonslänken renderades utan kontroll av protokollet. | ✅ Åtgärdad |
| 11 | Data | Schemat påstår att man byter till PostgreSQL genom att byta `provider`, men Prisma-klienten är hårdkopplad till `better-sqlite3`-adaptern. | Fas 1 |
| 12 | Data | SQLite körde i rollback-journal-läge (inte WAL), så en läsande process (Studio, seed, bygge) kunde blockera appens skrivningar. `busy_timeout` (5 s) och `foreign_keys` var redan på via better-sqlite3:s standardvärden. | ✅ Åtgärdad |
| 13 | Data | Promptversionen var inbakad i `model`-strängen (`google:x@match-v1`) och kunde inte filtreras eller grupperas. Tokenförbrukning sparades inte. | ✅ Åtgärdad |
| 17 | Test | Datalagret (transaktioner, idempotent import, kaskadradering) saknade tester mot en riktig databas. | ✅ Åtgärdad |
| 14 | AI | Inga evals. Ändringar i prompt eller modell gick inte att jämföra objektivt. | Grund på plats, fortsätter i fas 2 |
| 15 | UX | En matchning tar ungefär 20 s i en blockerande Server Action, utan progress, och den kan startas flera gånger parallellt. | Fas 2 |
| 16 | Domän | Statushistorik saknas. Bara `lastContactAt` sparas, så tidslinje och statistik går inte att bygga. | Fas 3 |

## Fas 0: Granskning och härdning (klar)

Gjordes i samband med den här planen:

- `domain/evidence.ts`: ny citatverifiering. NFKC-normalisering, matchning på hela ord, delar av ett citat med ellips måste stå i rätt ordning, och CV:t normaliseras en gång per analys. 13 nya testfall.
- `domain/requirements.ts`: kravbegrepp (`IMPORTANCE`, `MATCH_STRENGTH`) och `reconcileRequirements` (tar bort dubbletter och krav som ligger i båda listorna). Både AI-schemat och poängen importerar härifrån.
- `ai/generate-structured.ts`: gemensam väg för strukturerad output, med testläge, timeout som gäller för alla försök, ett omförsök vid ogiltig output och felklassning. Både matchningen och CV-förslaget använder den.
- `ai/prompts/data-tags.ts`: neutraliserar data-taggar i CV och annonser.
- `ai/evals/` och `npm run eval:match`: golden set med förväntningar (krav som ska matchas eller saknas, poängintervall, andel verifierade citat).
- Datalagret: transaktioner för läs-och-skriv, `prisma-errors.ts`, `cache()` för `getProfile` och `getApplication`, `hashCv` flyttad till domänlagret.
- Validering: gemensamma formulärhjälpare (`validation/form.ts`) och `PROFILE_LIMITS`, som delas med AI-förslaget.

## Fas 1: Robust datalager (pågår – 1.2–1.4 klara)

**Mål:** Det ska vara sant att appen kan köras på PostgreSQL, och SQLite ska tåla samtidiga skrivningar.

**Klart 2026-11-18:**
- 1.2: `db/client.ts` aktiverar WAL vid start och sätter `timeout` explicit. Verifierat: `dev.db` står i `journal_mode=wal`. WAL-filerna ligger i `.gitignore`.
- 1.3: migreringen `match_report_prompt_version` lägger till `promptVersion`, `inputTokens` och `outputTokens`, och delar befintliga `model@version`-strängar (verifierat på testdata). `generateStructured` summerar tokens över alla försök, även misslyckade. Rapportens sidfot och `eval:match` visar promptversion och tokens.
- 1.4: `src/test/test-database.ts` skapar en temporär SQLite-fil och kör alla migrationer. `data-layer.integration.test.ts` täcker statusflöde, samtidiga ändringar, idempotent import (även samtidig), en enda profil, rapporter, korrupt JSON och kaskadradering. Testerna körs i `npm test`.

**Kvar:**

1. **Adapter efter miljö.** `db/client.ts` väljer `@prisma/adapter-pg` för `postgres://` och `better-sqlite3` annars. Prismas `provider` går inte att växla vid körning, så beslutet blir antingen två schemafiler (`schema.sqlite.prisma` och `schema.postgres.prisma`, genererade från en källa) eller PostgreSQL även lokalt via Docker.
   - *Motivering:* nuvarande dokumentation lovar något som inte fungerar.
   - *Acceptans:* `DATABASE_URL=postgres://… npm run build && npm start` fungerar, och CI kör migreringarna mot båda databaserna.
2. **Statistik över tokens:** en enkel sammanställning per promptversion (snittpoäng, tokens per analys) på en intern sida eller i `eval:match`. Bygger på kolumnerna från 1.3.

## Fas 2: AI-kvalitet och flöde

**Mål:** Prompt- och modelländringar ska kunna mätas, och analysen ska kännas snabb.

1. **Utöka golden set till 10–15 fall:** engelska annonser, annonser utan uttalad kravsektion, brusiga PDF-CV:n, juniora profiler mot seniora annonser och annonser med prompt injection.
   - *Acceptans:* `npm run eval:match` ≥ 90 % godkända på nuvarande modell. Resultatet sparas som JSON i `evals/results/` för jämförelse mellan versioner.
2. **Eval i CI** (manuell eller nattlig workflow med API-nyckeln som secret). Körningen misslyckas om andelen godkända fall sjunker jämfört med senaste sparade resultat.
3. **Prompt v2-kandidater**, utvärderade med evals före införande:
   - Be om sammanhängande citat utan ellips. Det ger färre overifierade belägg.
   - Be om `cvSection` från CV:ts faktiska rubriker.
   - Upptäck annonsens språk explicit, så att pitchens språk blir rätt.
4. **Hallucinationsskydd för CV-förslaget:** markera föreslagna kompetenser som inte nämns i CV:t (`mentionsSkill`), i stället för att tyst lita på dem.
5. **Progress och låsning:** visa delresultat med `streamText` och partiell output, eller kör analysen som bakgrundsjobb med status i databasen. Spärra en andra körning medan en pågår för samma ansökan.
   - *Acceptans:* användaren ser första kraven inom ungefär 5 s, och ett dubbelklick ger bara en rapport.

## Fas 3: Statusflöde och sökning

1. **Händelselogg** (`ApplicationEvent`: statusändring, kontakt, anteckning) med tidslinje på ansökningssidan. `lastContactAt` härleds från loggen eller hålls i synk i samma transaktion.
2. **Snabbval för påminnelser:** knappar för "om 3 dagar" och "om 1 vecka" och möjlighet att skjuta upp direkt från översikten.
3. **Bättre lista:** fritextsök på företag och roll, filtret "Behöver uppföljning", sortering på matchningspoäng och filtren sparade i URL:en.
4. **Jämförelse av rapporter:** vilka krav som har ändrats mellan två körningar, till exempel efter en CV-uppdatering.

## Fas 4: Export och rapporter

1. CSV-export av ansökningar (Route Handler med streamat svar).
2. Export av matchningsrapporten som Markdown eller PDF, för personligt brev och intervjuförberedelser.
3. Statistiksida: tratt (sparad → sökt → intervju → erbjudande), svarsfrekvens och tid till svar. Bygger på händelseloggen från fas 3.

## Fas 5: Produktion (om appen ska driftas publikt)

- Autentisering (en användare: passkey eller magisk länk). Alla Server Actions kontrollerar sessionen.
- PostgreSQL, säkerhetskopior, säkerhetsheaders (CSP) och rate limiting på AI-actions.
- E2E-tester med Playwright för kärnflödena: skapa ansökan, ändra status, ladda upp CV och matcha i testläge.

## Arbetsregler

- **Ändra aldrig prompt, schema eller modell utan att köra `npm run eval:match` före och efter.** Bumpa `MATCH_PROMPT_VERSION` respektive `MATCH_ANALYSIS_SCHEMA_VERSION`.
- Ny affärslogik skrivs som rena funktioner i `domain/` med tester. Övriga lager bara orkestrerar.
- Varje modul verifieras med `npm run typecheck && npm run lint && npm test && npm run build` innan den räknas som klar.
