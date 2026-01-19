export type LinkType = "url" | "email" | "phone";

export type LinkInput = {
  type: LinkType;
  label: string;
  value: string;
};

function isValidEmail(email: string) {
  // simple + practical
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function normalizeUrl(raw: string) {
  const v = raw.trim();

  // If user typed some other scheme like ftp://, reject it (don't prefix https://)
  if (v.includes("://") && !/^https?:\/\//i.test(v)) {
    throw new Error("URL must start with http:// or https://");
  }

  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;

  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    throw new Error("Invalid URL");
  }

  // Optional but recommended: require a real public hostname
  // (allow localhost too)
  const host = u.hostname.toLowerCase();
  if (host !== "localhost" && !host.includes(".")) {
    throw new Error("URL must include a domain like example.com");
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Invalid URL protocol");
  }

  return u.toString();
}


function normalizePhone(raw: string) {
  // remove spaces/dashes
  const v = raw.trim().replace(/[\s-]/g, "");
  // E.164-ish: +8801XXXXXXXXX, +1..., etc.
  if (!/^\+?[1-9]\d{7,14}$/.test(v)) {
    throw new Error("Invalid phone number");
  }
  return v.startsWith("+") ? v : `+${v}`;
}

export function normalizeAndValidateLink(input: LinkInput) {
  const type = input.type;
  const label = (input.label ?? "").trim();
  const value = (input.value ?? "").trim();

  if (!label) throw new Error("Label is required");
  if (!value) throw new Error("Value is required");

  if (type === "url") {
    return { ...input, label, value: normalizeUrl(value) };
  }

  if (type === "email") {
    const normalized = value.toLowerCase();
    if (!isValidEmail(normalized)) throw new Error("Invalid email");
    return { ...input, label, value: normalized };
  }

  // phone
  return { ...input, label, value: normalizePhone(value) };
}
