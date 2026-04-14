import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert string to title case for display.
 * - Capitalizes first letter of each word
 * - Lowercases articles/prepositions in the middle (and, of, the, in, for, a, an)
 * - Preserves known all-caps acronyms (COBRA, ULAN, etc.)
 * - Handles empty/null values gracefully
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str || str.trim() === "") return ""

  const allCapsAcronyms = new Set(["COBRA", "ULAN", "AIC", "IIIF", "API", "URL", "NSS", "WWI", "WWII"])
  const lowercaseWords = new Set(["and", "of", "the", "in", "for", "a", "an", "on", "to", "with", "by"])

  return str
    .split(/\s+/)
    .map((word, index) => {
      const upper = word.toUpperCase()
      if (allCapsAcronyms.has(upper)) return upper

      const lower = word.toLowerCase()
      // First word or last word always capitalized; middle words skip articles/prepositions
      if (index === 0 || index === str.split(/\s+/).length - 1 || !lowercaseWords.has(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1)
      }
      return lower
    })
    .join(" ")
}

/**
 * Format a display value, handling null/empty/placeholder strings.
 * - Null/undefined/empty → "—" (em dash)
 * - "No X listed" placeholders → "—"
 * - Otherwise → toTitleCase() for movement/gender, or original for names/dates
 */
export function formatDisplayValue(
  value: string | null | undefined,
  options?: { isName?: boolean; isMovement?: boolean; isGender?: boolean }
): string {
  if (!value || value.trim() === "") return "—"

  // Handle pipeline null-fill strings
  const nullFillPatterns = [
    /^no\s+\w+\s+listed$/i,
    /^unknown$/i,
    /^none$/i,
    /^n\/a$/i,
  ]
  if (nullFillPatterns.some((pattern) => pattern.test(value))) {
    return "—"
  }

  if (options?.isName || options?.isGender) {
    return toTitleCase(value)
  }

  if (options?.isMovement) {
    return toTitleCase(value)
  }

  return value
}

/**
 * Gender display map for respectful, consistent formatting.
 * Maps raw Wikidata gender strings to display format.
 */
const GENDER_DISPLAY_MAP: Record<string, string> = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  genderfluid: "Genderfluid",
  "trans man": "Trans Man",
  "trans woman": "Trans Woman",
  "gender non-conforming": "Gender Non-conforming",
}

export function formatGender(gender: string | null | undefined): string {
  if (!gender) return "—"
  const normalized = gender.toLowerCase().trim()
  return GENDER_DISPLAY_MAP[normalized] || toTitleCase(gender)
}
