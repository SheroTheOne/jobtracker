"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  changeApplicationStatus,
  createApplication,
  deleteApplication,
  isRecordNotFound,
  logApplicationContact,
  updateApplication,
} from "@/lib/data/applications";
import { APPLICATION_STATUSES } from "@/lib/domain/application-status";
import {
  applicationFormSchema,
  readApplicationFormValues,
  type ApplicationFormField,
} from "@/lib/validation/application";
import type { ActionResult, FormState } from "./types";

export type ApplicationFormState = FormState<ApplicationFormField>;

const idSchema = z.cuid();
const statusSchema = z.enum(APPLICATION_STATUSES);

const NOT_FOUND = "Ansökan finns inte längre.";
const UNEXPECTED = "Något gick fel. Försök igen.";

function revalidateApplications(id?: string): void {
  revalidatePath("/");
  revalidatePath("/applications");
  if (id) revalidatePath(`/applications/${id}`);
}

function failure(error: unknown, context: string): ActionResult {
  if (isRecordNotFound(error)) return { ok: false, error: NOT_FOUND };
  console.error(`[actions/applications] ${context}`, error);
  return { ok: false, error: UNEXPECTED };
}

async function saveApplication(
  formData: FormData,
  persist: (input: z.output<typeof applicationFormSchema>) => Promise<{ id: string }>,
  context: string,
): Promise<ApplicationFormState> {
  const values = readApplicationFormValues(formData);
  const parsed = applicationFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Kontrollera de markerade fälten.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  let id: string;
  try {
    ({ id } = await persist(parsed.data));
  } catch (error) {
    const result = failure(error, context);
    return { status: "error", message: result.ok ? UNEXPECTED : result.error, fieldErrors: {}, values };
  }

  revalidateApplications(id);
  redirect(`/applications/${id}`); // kastar – måste ligga utanför try/catch
}

export async function createApplicationAction(
  _prev: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  return saveApplication(formData, createApplication, "create");
}

/** Bind id i klienten: `updateApplicationAction.bind(null, id)`. */
export async function updateApplicationAction(
  id: string,
  _prev: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  if (!idSchema.safeParse(id).success) {
    return { status: "error", message: NOT_FOUND, fieldErrors: {}, values: readApplicationFormValues(formData) };
  }
  return saveApplication(formData, (input) => updateApplication(id, input), "update");
}

export async function changeStatusAction(id: string, status: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return { ok: false, error: "Ogiltig förfrågan." };

  try {
    await changeApplicationStatus(parsedId.data, parsedStatus.data);
  } catch (error) {
    return failure(error, "changeStatus");
  }
  revalidateApplications(parsedId.data);
  return { ok: true };
}

export async function logContactAction(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Ogiltig förfrågan." };

  try {
    await logApplicationContact(parsedId.data);
  } catch (error) {
    return failure(error, "logContact");
  }
  revalidateApplications(parsedId.data);
  return { ok: true };
}

export async function deleteApplicationAction(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Ogiltig förfrågan." };

  try {
    await deleteApplication(parsedId.data);
  } catch (error) {
    return failure(error, "delete");
  }
  revalidateApplications();
  redirect("/applications");
}
