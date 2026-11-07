# jobtracker

En webbapp för att hålla koll på jobbansökningar och få AI-hjälp att jämföra jobbannonser med sitt CV.

> **Status:** Under utveckling. Ansökningar, profil och AI-matchning fungerar.

## Idén

När man söker många jobb blir det snabbt svårt att minnas var man har sökt, vad som hänt och när det är dags att följa upp. Samtidigt tar det tid att läsa varje annons och avgöra hur väl den matchar den egna bakgrunden.

jobtracker samlar ansökningarna på ett ställe och använder AI för att ta fram kraven i en annons och jämföra dem med CV:t.

Jag bygger appen för att använda den i mitt eget jobbsökande. Projektet är också en del av min portfolio och visar hur jag arbetar med AI som utvecklingsverktyg.

## Funktioner

### Grundfunktioner

- [x] Lägga till, redigera och ta bort ansökningar
- [x] Spara företag, roll, länk till annons, datum och anteckningar
- [x] Följa status: sparad, sökt, intervju, erbjudande eller avslag
- [x] Filtrera och sortera ansökningar
- [x] Se vilka ansökningar som behöver följas upp
- [x] Profil med CV, kärnkompetenser, senioritet och roller jag söker
- [x] Ladda upp CV som PDF, Word, Markdown eller text – profilen fylls i automatiskt med AI
- [x] Sök annonser i Arbetsförmedlingens Platsbanken med gratis snabbmatchning mot mina kompetenser
- [x] Spara en annons som ansökan med ett klick, med eller utan AI-matchning
- [x] Dölja seniora roller i sökningen (standard för juniora profiler)
- [x] Hämta en annons genom att klistra in en Platsbanken-länk
- [x] Ladda upp annonstext som PDF, Word eller text

### AI-funktioner

- [x] Klistra in en jobbannons och få ut krav, tech-stack och nyckelord
- [x] Jämföra annonsens krav med CV:t, med hänvisning till var i CV:t kravet syns
- [x] Visa vad som saknas, uppdelat i kritiska och meriterande krav
- [x] Matchningspoäng (0–100 %) och ett utkast till pitch för personligt brev eller intervju

AI:n ger underlag och förslag. Det är alltid användaren som bedömer resultatet och bestämmer vad som ska göras.

### Så fungerar matchningen

- **Typad output:** Modellen tvingas svara enligt ett Zod-schema ([`match-analysis.ts`](src/lib/ai/schemas/match-analysis.ts)) via AI SDK:s `Output.object`, och svaret valideras igen innan det sparas.
- **Verifierade belägg:** Varje matchat krav måste citera CV:t ordagrant. Citatet kontrolleras i kod; overifierade citat markeras och ger lägre poäng.
- **Poängen räknas i kod, inte av AI:n:** krav väger 3, meriterande 1; starkt uppfyllt ger full vikt, delvis eller overifierat halv ([`match-scoring.ts`](src/lib/domain/match-scoring.ts)).
- **Spårbarhet:** Varje rapport sparas med modell, promptversion och ett fingeravtryck av CV:t, så appen kan säga till när CV:t ändrats sedan analysen.
- **Testläge:** Med `AI_PROVIDER="mock"` returneras ett exempelsvar – hela flödet kan utvecklas utan nyckel eller kostnad.

### Jobbsökning

Annonser hämtas från Arbetsförmedlingens öppna [JobSearch-API](https://jobsearch.api.jobtechdev.se) (samma annonser som Platsbanken, ingen nyckel krävs). Varje annons får en **snabbmatchning** – hur många av profilens kompetenser som nämns – som räknas lokalt utan AI-anrop. Seniora roller filtreras på titeln lokalt – inte med minusord mot API:t, eftersom de matchar hela annonstexten och då slår bort junior-vänliga annonser som nämner "seniora kollegor". Indeed och liknande saknar öppna API:er och tillåter inte skrapning, så de stöds inte.

### Uppföljningslogik

En ansökan flaggas för uppföljning när den har status _Sökt_ eller _Intervju_ och

- en manuellt satt påminnelse har passerats, eller
- det saknas påminnelse och det har gått **mer än 7 dagar** sedan senaste kontakt (eller ansökningsdatum om ingen kontakt loggats).

Statusändringar räknas som kontakt. Reglerna är rena funktioner i [`src/lib/domain/follow-up.ts`](src/lib/domain/follow-up.ts) och täcks av enhetstester.

## Teknik

| Del            | Val                                                              |
| -------------- | ---------------------------------------------------------------- |
| Ramverk        | Next.js 16 (App Router, Server Actions, Cache Components)        |
| Språk          | TypeScript (strict)                                              |
| UI             | Tailwind CSS v4, shadcn/ui (Base UI), Lucide-ikoner              |
| Databas        | Prisma 7 – SQLite lokalt, PostgreSQL i produktion                |
| Validering     | Zod 4                                                            |
| AI             | Vercel AI SDK med Google Gemini (gratisnivå) och Zod-scheman för typad JSON |
| Tester         | Vitest                                                           |

### Arkitektur

```
src/
├── app/                # Routes – tunna sidor som komponerar komponenter
├── components/         # UI, uppdelat per domän (applications/, profile/, layout/, ui/)
└── lib/
    ├── actions/        # Server Actions: validera → anropa data/ → revalidera
    ├── data/           # All databasåtkomst (enda lagret som pratar med Prisma)
    ├── domain/         # Ren affärslogik utan beroenden – enhetstestad
    ├── validation/     # Zod-scheman för formulär och Json-kolumner
    ├── ai/             # AI-anrop, prompter, scheman, felhantering och testläge
    └── db/             # Prisma-klient
```

UI anropar bara `actions/`. Bara `data/` når databasen. `ai/` vet ingenting om databasen.

## Kom igång

Kräver Node.js 22+.

```bash
npm install
cp .env.example .env      # AI_PROVIDER="mock" fungerar direkt; för Gemini: lägg in nyckel och sätt "google"
npx prisma migrate dev    # skapar den lokala SQLite-databasen
npm run db:seed           # (valfritt) exempelansökningar – körs bara om databasen är tom
npm run dev               # http://localhost:3000
```

| Script              | Gör                                   |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Startar utvecklingsservern            |
| `npm test`          | Kör enhetstester                      |
| `npm run typecheck` | TypeScript-kontroll                   |
| `npm run lint`      | ESLint                                |
| `npm run db:studio` | Öppnar Prisma Studio för att se datan |

## Så används AI i projektet

Jag använder AI som stöd under utvecklingen och dokumenterar här hur det går till. Avsnittet uppdateras allt eftersom projektet växer.

- **Verktyg:** Claude Code
- **Arbetssätt:** Projektet byggs modul för modul. För varje modul presenterar AI:n en plan, skriver koden och verifierar den (typkontroll, tester, bygge) innan jag granskar och godkänner nästa steg.
