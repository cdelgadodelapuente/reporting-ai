export function normalizeBaseUrl(input: string) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    // If user pasted without protocol, try to fix
    try {
      const url = new URL(`https://${raw}`);
      return url.origin;
    } catch {
      return raw.replace(/\/$/, "");
    }
  }
}

