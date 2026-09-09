const ENTITY_MAP: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
  "&amp;": "&",
};

export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";

  // Some ATS APIs (e.g. Greenhouse) return this field HTML-entity-encoded —
  // decode entities BEFORE stripping tags, or encoded "&lt;div&gt;" never
  // matches the tag-stripping regex and leaks into the output.
  let text = html.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  Object.entries(ENTITY_MAP).forEach(([entity, char]) => {
    text = text.split(entity).join(char);
  });

  text = text
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "");

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, idx, arr) => line !== "" || arr[idx - 1] !== "")
    .join("\n")
    .trim();
}
