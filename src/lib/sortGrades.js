/**
 * src/lib/sortGrades.js
 *
 * Sorts a list of class/grade strings in logical curriculum order.
 *
 * Priority:
 *   Nursery → KG/Kindergarten → Primary → JSS → SS → Year/Grade/Class
 *   (numeric within each band) → University/Tertiary → Other
 *
 * Falls back to natural sort (numeric-aware) for any unrecognised format.
 */

// ── Known prefix order — lower index = earlier in list ───────────────────
const PREFIX_ORDER = [
  /^nursery/i,
  /^kg$|^kindergarten/i,
  /^primary/i,
  /^jss/i,
  /^ss\s*\d/i,
  /^year/i,
  /^grade/i,
  /^class/i,
  /^form/i,
  /^level/i,
  /^pyp/i,
  /^myp/i,
  /^dp/i,
  /^university|^tertiary|^undergraduate|^degree|^foundation/i,
  /^other/i,
]

function prefixRank(str) {
  const s = str.trim()
  for (let i = 0; i < PREFIX_ORDER.length; i++) {
    if (PREFIX_ORDER[i].test(s)) return i
  }
  return PREFIX_ORDER.length  // unknown → after all known
}

/**
 * Extract a numeric value from a string like "JSS 2", "Grade 10", "Year 3".
 * Returns 0 if no number found.
 */
function extractNum(str) {
  const match = str.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

/**
 * Sort an array of grade/class label strings in logical curriculum order.
 * Does not mutate the original array.
 *
 * @param {string[]} grades
 * @returns {string[]}
 */
export function sortGrades(grades) {
  if (!Array.isArray(grades)) return grades
  return [...grades].sort((a, b) => {
    const ra = prefixRank(a)
    const rb = prefixRank(b)
    if (ra !== rb) return ra - rb
    // Same prefix band — sort by the embedded number
    const na = extractNum(a)
    const nb = extractNum(b)
    if (na !== nb) return na - nb
    // Same number — natural sort as tiebreaker
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  })
}

/**
 * Sort an array of { value, label } option objects by their label.
 *
 * @param {{ value: string, label: string }[]} options
 * @returns {{ value: string, label: string }[]}
 */
export function sortGradeOptions(options) {
  if (!Array.isArray(options)) return options
  const labels  = options.map((o) => o.label)
  const sorted  = sortGrades(labels)
  return sorted.map((label) => options.find((o) => o.label === label)).filter(Boolean)
}