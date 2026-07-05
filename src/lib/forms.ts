// Shared form-builder types (client builder + server renderer/validator).

export const FORM_FIELD_TYPES = [
  "text",
  "email",
  "textarea",
  "tel",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "consent",
  "hidden",
] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export type FormField = {
  id: string;
  type: FormFieldType;
  name: string; // machine name → submission data key
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // select / radio
  width?: "full" | "half";
};

export type FormSettings = {
  successMessage?: string;
  submitLabel?: string;
  requireCaptcha?: boolean;
};

export function newFieldId(): string {
  return `f_${Math.random().toString(36).slice(2, 9)}`;
}

// Honeypot + timestamp field names (must match the renderer + validator).
export const HONEYPOT_FIELD = "_hp_email";
export const TIMESTAMP_FIELD = "_ts";
export const TURNSTILE_FIELD = "cf-turnstile-response";
