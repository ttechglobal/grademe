/**
 * src/lib/featureFlags.js
 *
 * Feature flags for GradeMee.
 * Set a flag to true to enable a feature for all users.
 * Set to false to disable it without removing any code.
 *
 * Usage:
 *   import { FLAGS } from '@/lib/featureFlags'
 *   if (FLAGS.TRUE_FALSE_QUESTIONS) { ... }
 */

export const FLAGS = {
  // ── Live features ──────────────────────────────────────────────────────
  MCQ_QUESTIONS:         true,    // Multiple choice — always on
  TIMER:                 true,    // Assessment timer
  AI_GENERATE:           true,    // AI question generation (copy-paste)
  AI_IMPORT:             true,    // AI-assisted worksheet import
  STUDENT_PROFILES:      true,    // Auto-created student profiles
  MERGE_STUDENTS:        true,    // Merge duplicate student names
  EXPLANATION_RENDERER:  true,    // Rich explanation formatting

  // ── Coming soon — flip to true when ready ─────────────────────────────
  TRUE_FALSE_QUESTIONS:  true,    // True/False question type
  SHORT_ANSWER:          false,   // Short answer question type
  STEPWISE_QUESTIONS:    false,   // Stepwise worked-solution questions
  IN_APP_AI:             false,   // Direct AI generation (no copy-paste)
  SCHOOL_ACCOUNTS:       false,   // Multi-tutor school plans
  PAYMENTS:              false,   // Subscription billing
  ANALYTICS_ADVANCED:    false,   // Advanced class analytics
  QUESTION_BANK_SHARE:   false,   // Share question banks between tutors
  PARENT_REPORTS:        false,   // Email reports to parents
}

/**
 * Check if a feature is enabled.
 * Returns false for any unknown flag (safe default).
 */
export function isEnabled(flag) {
  return FLAGS[flag] === true
}