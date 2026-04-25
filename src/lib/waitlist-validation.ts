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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/;

function asCleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

  if (!EMAIL_PATTERN.test(email) || email.length > 320) {
    return { error: "Please provide a valid email address." };
  }

  if (companyName.length > 160) {
    return { error: "Company name is too long." };
  }

  if (phoneNumber && (!PHONE_PATTERN.test(phoneNumber) || phoneNumber.length > 40)) {
    return { error: "Please provide a valid phone number." };
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
