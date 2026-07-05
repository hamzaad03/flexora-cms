import "server-only";
import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "./settings";
import {
  HONEYPOT_FIELD,
  TIMESTAMP_FIELD,
  TURNSTILE_FIELD,
  type FormField,
  type FormSettings,
} from "@/lib/forms";
import type { FormInput } from "@/lib/validations/forms";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FILL_MS = 2000; // submissions faster than this are bots
const MAX_AGE_MS = 60 * 60 * 1000; // forms older than an hour are stale

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

export async function listForms() {
  return db.form.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
}

export async function getForm(id: string) {
  return db.form.findUnique({ where: { id } });
}

export async function getFormBySlug(slug: string) {
  return db.form.findUnique({ where: { slug } });
}

export async function createForm(input: FormInput) {
  const slug = await uniqueSlug(
    input.slug || input.name,
    async (s) => (await db.form.count({ where: { slug: s } })) > 0,
  );
  return db.form.create({
    data: {
      slug,
      name: input.name,
      isActive: input.isActive,
      fields: input.fields as object,
      settings: input.settings as object,
    },
  });
}

export async function updateForm(id: string, input: FormInput) {
  return db.form.update({
    where: { id },
    data: {
      name: input.name,
      isActive: input.isActive,
      fields: input.fields as object,
      settings: input.settings as object,
    },
  });
}

export async function deleteForm(id: string) {
  await db.form.delete({ where: { id } });
}

export async function listSubmissions(formId: string) {
  return db.formSubmission.findMany({
    where: { formId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const settings = await getSettings();
  const secret = settings["forms.turnstile.secret"];
  if (typeof secret !== "string" || !secret) return true; // not configured → skip
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export type SubmitResult = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

/** Validate + securely store a public form submission. */
export async function handleSubmission(
  slug: string,
  raw: Record<string, string>,
  meta: { ip: string; ua: string },
): Promise<SubmitResult> {
  // Per-IP rate limit (10 / minute).
  if (!rateLimit(`form:${meta.ip}`, 10, 60_000).ok) {
    return { ok: false, errors: { _form: "Too many submissions. Try later." } };
  }

  const form = await db.form.findUnique({ where: { slug } });
  if (!form || !form.isActive) {
    return { ok: false, errors: { _form: "Form not found." } };
  }
  const fields = (form.fields as FormField[]) ?? [];
  const settings = (form.settings as FormSettings) ?? {};

  const ipHash = createHash("sha256")
    .update(`${meta.ip}|${new Date().toISOString().slice(0, 10)}`)
    .digest("hex")
    .slice(0, 32);

  // --- Bot traps: honeypot + time-trap. Accept silently but flag as spam. ---
  const tooFast =
    !raw[TIMESTAMP_FIELD] ||
    Date.now() - Number(raw[TIMESTAMP_FIELD]) < MIN_FILL_MS;
  const tooOld =
    raw[TIMESTAMP_FIELD] &&
    Date.now() - Number(raw[TIMESTAMP_FIELD]) > MAX_AGE_MS;
  if (raw[HONEYPOT_FIELD] || tooFast || tooOld) {
    await db.formSubmission.create({
      data: {
        formId: form.id,
        data: {},
        ipHash,
        userAgent: meta.ua.slice(0, 500),
        spam: true,
      },
    });
    return { ok: true, message: settings.successMessage || "Thanks!" };
  }

  // --- CAPTCHA (optional, per-form) ---
  if (settings.requireCaptcha) {
    const ok = await verifyTurnstile(raw[TURNSTILE_FIELD] ?? "", meta.ip);
    if (!ok)
      return { ok: false, errors: { _form: "Captcha verification failed." } };
  }

  // --- Field validation + sanitization ---
  const errors: Record<string, string> = {};
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "hidden") continue;
    const value = stripTags(String(raw[field.name] ?? ""));
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (value) {
      if (field.type === "email" && !EMAIL_RE.test(value))
        errors[field.name] = "Enter a valid email.";
      if (field.type === "number" && Number.isNaN(Number(value)))
        errors[field.name] = "Enter a number.";
      if (
        (field.type === "select" || field.type === "radio") &&
        field.options &&
        !field.options.includes(value)
      )
        errors[field.name] = "Invalid choice.";
    }
    data[field.name] = value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  await db.formSubmission.create({
    data: {
      formId: form.id,
      data: data as object,
      ipHash,
      userAgent: meta.ua.slice(0, 500),
      spam: false,
    },
  });

  return {
    ok: true,
    message: settings.successMessage || "Thank you — your message was sent.",
  };
}
