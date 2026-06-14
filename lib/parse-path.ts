// Parse different notations for hierarchical paths
// Examples:
// - "mente do nicolau > trabalho > projetos"
// - "mente do nicolau, trabalho, projetos"
// - "mente do nicolau depois trabalho depois projetos"
// - "mente do nicolu after trablahro after projetos"

export function parseNotionPath(input: string): string[] | null {
  if (!input) return null;

  // Normalize the input
  let normalized = input.toLowerCase().trim();

  // Replace various separators with "|"
  normalized = normalized
    .replace(/\s*>\s*/g, '|') // ">" separator
    .replace(/\s*,\s*/g, '|') // "," separator
    .replace(/\s+(depois|then|after|puis|depois de)\s+/g, '|') // natural language separators
    .replace(/\s+>\s+/g, '|'); // "> " separator with spaces

  // Split by our unified separator
  const parts = normalized.split('|').map((p) => p.trim()).filter((p) => p.length > 0);

  if (parts.length === 0) return null;

  return parts;
}

// Check if input contains a hierarchical path pattern
export function containsPathPattern(input: string): boolean {
  const pathPatterns = [
    /\s*>\s*/, // ">"
    /\s*,\s*/, // ","
    /\s+(depois|then|after|puis|em seguida)\s+/i, // natural language
  ];

  return pathPatterns.some((pattern) => pattern.test(input));
}

// Extract path from a sentence
// Example: "add the sales meeting to mente do nicolau > trabalho > projetos"
// Returns: ["mente do nicolau", "trabalho", "projetos"]
export function extractPathFromText(text: string): string[] | null {
  // Look for patterns like "to ...", "in ...", "at ...", etc.
  const pathStart = [
    /(?:to|in|at|em|dentro de|a)\s+(.+?)(?:\s+(?:the|do|da|as|os|a|um|uma)|$)/i,
    /(?:mente do nicolau.+)/i, // Likely to be at end
  ];

  for (const pattern of pathStart) {
    const match = text.match(pattern);
    if (match) {
      const extracted = match[1] || match[0];
      const path = parseNotionPath(extracted);
      if (path && path.length > 1) {
        return path;
      }
    }
  }

  // If no pattern found, try to parse the whole text
  if (containsPathPattern(text)) {
    return parseNotionPath(text);
  }

  return null;
}
