/**
 * src/lib/gradeAnswer.js
 *
 * Centralized answer grading utility branched by question type.
 * Each type has its own isolated grader — the MCQ logic is never
 * touched when a new type is added.
 *
 * Usage:
 *   import { gradeAnswer } from '@/lib/gradeAnswer'
 *   const isCorrect = gradeAnswer('True', 'True', 'true_false')  // → true
 *   const isCorrect = gradeAnswer('B',    'B',    'mcq')         // → true
 */

// ── Individual graders ────────────────────────────────────────────────────

function gradeMCQ(studentAns, correctAnswer) {
  if (!studentAns || !correctAnswer) return false
  return studentAns.trim().toUpperCase() === correctAnswer.trim().toUpperCase()
}

function gradeTrueFalse(studentAns, correctAnswer) {
  if (!studentAns || !correctAnswer) return false
  return studentAns.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}

// ── Branching dispatcher ──────────────────────────────────────────────────

/**
 * @param {string} studentAns    - What the student answered
 * @param {string} correctAnswer - The correct answer stored on the question
 * @param {string} questionType  - 'mcq' | 'true_false' | 'fill' | 'truefalse'
 * @returns {boolean}
 */
export function gradeAnswer(studentAns, correctAnswer, questionType) {
  switch (questionType) {
    case 'mcq':
      return gradeMCQ(studentAns, correctAnswer)

    case 'true_false':
    case 'truefalse':        // legacy type value from QuestionEditor
      return gradeTrueFalse(studentAns, correctAnswer)

    // Future types slot in here
    // case 'short_answer':
    //   return gradeShortAnswer(studentAns, correctAnswer)

    default:
      return gradeMCQ(studentAns, correctAnswer)
  }
}