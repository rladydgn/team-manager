export const MATCH_NOTE_MAX_LENGTH = 10_000;

export type MatchNotePart = { text: string; href?: string };

// Notes remain plain text; only complete HTTP(S) addresses become links.
export function splitMatchNote(content: string): MatchNotePart[] {
  const parts: MatchNotePart[] = [];
  const pattern = /https?:\/\/[^\s<>"']+/gi;
  let offset = 0;

  for (const match of content.matchAll(pattern)) {
    const start = match.index!;
    const address = match[0].replace(/[.,!;:?)\]}]+$/, "");
    if (start > offset) parts.push({ text: content.slice(offset, start) });
    try {
      const url = new URL(address);
      const safe = ["http:", "https:"].includes(url.protocol) &&
        Boolean(url.hostname) && !url.username && !url.password;
      parts.push(safe ? { text: address, href: url.href } : { text: address });
    } catch {
      parts.push({ text: address });
    }
    offset = start + address.length;
  }
  if (offset < content.length) parts.push({ text: content.slice(offset) });
  return parts;
}
