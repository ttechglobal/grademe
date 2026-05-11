/**
 * src/lib/featureFlags.js
 *
 * Feature flags for GradeMee.
 * Set a flag to true to enable a feature for all users.
 * Set to false to disable it without removing any code.
 */

export const FLAGS = {
  // ── Live features ──────────────────────────────────────────────────────
  MCQ_QUESTIONS:         true,
  TIMER:                 true,
  AI_GENERATE:           true,
  AI_IMPORT:             true,
  STUDENT_PROFILES:      true,
  MERGE_STUDENTS:        true,
  EXPLANATION_RENDERER:  true,

  // ── Question types ─────────────────────────────────────────────────────
  TRUE_FALSE_QUESTIONS:  true,
  SHORT_ANSWER:          false,
  STEPWISE_QUESTIONS:    true,    // ← enabled: Stepwise worked-solution questions
  IN_APP_AI:             true,
  CREDITS_COMING_SOON_UI: true,
  SCHOOL_ACCOUNTS:       false,
  PAYMENTS:              false,
  ANALYTICS_ADVANCED:    false,
  QUESTION_BANK_SHARE:   false,
  PARENT_REPORTS:        false,
}

/**
 * Check if a feature is enabled.
 * Returns false for any unknown flag (safe default).
 */
export function isEnabled(flag) {
  return FLAGS[flag] === true
}