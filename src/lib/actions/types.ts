/** Resultat från enkla Server Actions som anropas utanför formulär (knappar, select). */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Tillstånd för formulär som använder useActionState. */
export type FormState<Field extends string> =
  | { status: "idle" }
  | { status: "success"; message: string; savedAt: number }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<Field, string[]>>;
      /** Inskickade värden, så att formuläret kan återfyllas (React nollställer det efter submit). */
      values: Record<Field, string>;
    };
