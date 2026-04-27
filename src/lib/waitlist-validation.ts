const VALID_ROLES = new Set(["student", "researcher", "engineer", "founder", "other"]);

export type WaitlistPayload = {
  name?: unknown;
  fullName?: unknown;
  email?: unknown;
  companyName?: unknown;
  phoneNumber?: unknown;
  role?: unknown;
  focus?: unknown;
};

export type ValidWaitlistInput = {
  fullName: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  role: string;
  focus: string;
};

const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const ALGERIA_MOBILE_PHONE_PATTERN = /^(?:\+213|0)(?:5|6|7)\d{8}$/;

function asCleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  if (!EMAIL_PATTERN.test(email)) {
    return false;
  }

  if (email.length > 320) {
    return false;
  }

  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return false;
  }

  if (localPart.length > 64 || localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return false;
  }

  const domainLabels = domainPart.split(".");
  if (domainLabels.some((label) => !label || label.startsWith("-") || label.endsWith("-"))) {
    return false;
  }

  return true;
}

export function validateWaitlistPayload(payload: WaitlistPayload): { value?: ValidWaitlistInput; error?: string } {
  const fullName = asCleanString(payload.fullName);
  const email = asCleanString(payload.email).toLowerCase();
  const companyName = asCleanString(payload.companyName);
  const phoneNumber = asCleanString(payload.phoneNumber);
  const role = asCleanString(payload.role) || "other";
  const focus = asCleanString(payload.focus);

  if (fullName.length < 2 || fullName.length > 120) {
    return { error: "Please provide a valid name." };
  }

  if (!isValidEmail(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (companyName.length > 160) {
    return { error: "Company name is too long." };
  }

  if (phoneNumber && !ALGERIA_MOBILE_PHONE_PATTERN.test(phoneNumber)) {
    return { error: "Please provide a valid Algerian phone number." };
  }

  if (!VALID_ROLES.has(role)) {
    return { error: "Please provide a valid role." };
  }

  if (focus.length > 220) {
    return { error: "Research focus is too long." };
  }

  return {
    value: {
      fullName,
      email,
      companyName,
      phoneNumber,
      role,
      focus,
    },
  };
}
