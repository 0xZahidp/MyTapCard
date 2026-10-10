export interface VCardContact {
  name: string;
  username?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  url?: string | null;
  notes?: string | null;
}

/**
 * Builds a standardized vCard 3.0 string for iOS, Android, and desktop Contacts.
 */
export function generateVCard(contact: VCardContact): string {
  const name = contact.name.trim();
  const nameParts = name.split(" ");
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : name;

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(name)}`,
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
  ];

  if (contact.phone) {
    const cleanPhone = contact.phone.replace(/[^\d+]/g, "");
    lines.push(`TEL;TYPE=CELL,VOICE:${cleanPhone || contact.phone}`);
  }

  if (contact.email) {
    lines.push(`EMAIL;TYPE=INTERNET,PREF:${contact.email.trim()}`);
  }

  if (contact.url) {
    lines.push(`URL;TYPE=WORK:${contact.url.trim()}`);
  }

  if (contact.bio) {
    // Strip markdown formatting symbols for clean plain text note
    const cleanBio = contact.bio.replace(/[#*_`~[\]()>]/g, "").trim();
    lines.push(`NOTE:${escapeVCard(cleanBio)}`);
  }

  if (contact.avatarUrl) {
    lines.push(`PHOTO;VALUE=URI:${contact.avatarUrl.trim()}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function escapeVCard(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates and triggers download of a .vcf contact card.
 */
export function downloadVCard(contact: VCardContact) {
  const vcardString = generateVCard(contact);
  const blob = new Blob([vcardString], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileName = (contact.username || contact.name || "contact")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  link.download = `${fileName}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
