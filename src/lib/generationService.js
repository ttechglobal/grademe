// src/lib/generationService.js
// Server-only — never import this in client components.
// Generation order: validate → generate → deduct (never changes)

import { validateCredits, deductCredits } from './creditService';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const STEM_SUBJECTS = [
  'math', 'maths', 'mathematics', 'physics', 'chemistry',
  'biology', 'statistics', 'computer science', 'accounting', 'economics',
];

function isStem(subject = '') {
  return STEM_SUBJECTS.some((s) => subject.toLowerCase().includes(s));
}

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildMCQPrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle }) {
  const stemInstructions = isStem(subject)
    ? 'For each explanation, provide numbered step-by-step working with the formula first, then show full working.'
    : 'For each explanation, write a paragraph explaining WHY the answer is correct.';

  const profileBlock =
    useCase === 'university'
      ? buildUniversityBlock(academicStyle)
      : buildK12Block(classLevel, curriculum);

  return `You are an expert assessment creator.
${profileBlock}

Generate exactly ${count} multiple choice question${count > 1 ? 's' : ''} about "${topic}" in the subject "${subject}".

Rules:
- Each question must have exactly 4 options labelled A, B, C, D
- Only one option is correct
- correct_answer must be exactly one of: A, B, C, D
- ${stemInstructions}
- Always include a hint (one sentence, gives a clue without revealing the answer)
- Questions must be clear, unambiguous, and appropriate for the level

Return ONLY a valid JSON array. No preamble, no markdown fences.

[
  {
    "question": "Question text here?",
    "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
    "correct_answer": "A",
    "explanation": "Detailed explanation here",
    "hint": "Hint text here"
  }
]`;
}

function buildTrueFalsePrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle }) {
  const profileBlock =
    useCase === 'university'
      ? buildUniversityBlock(academicStyle)
      : buildK12Block(classLevel, curriculum);

  return `You are an expert assessment creator.
${profileBlock}

Generate exactly ${count} true/false question${count > 1 ? 's' : ''} about "${topic}" in the subject "${subject}".

Rules:
- Each question must be a clear, unambiguous factual statement
- correct_answer must be exactly "True" or "False" (capitalised, no other values)
- Explanation should clearly state WHY the statement is true or false
- Always include a hint (one sentence hint)
- Avoid trick questions or double negatives

Return ONLY a valid JSON array. No preamble, no markdown fences.

[
  {
    "question": "Statement here.",
    "correct_answer": "True",
    "explanation": "Explanation here",
    "hint": "Hint here"
  }
]`;
}

function buildCalculationPrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle }) {
  const profileBlock =
    useCase === 'university'
      ? buildUniversityBlock(academicStyle)
      : buildK12Block(classLevel, curriculum);

  return `You are an expert mathematics and science assessment creator.
${profileBlock}

Generate exactly ${count} calculation question${count > 1 ? 's' : ''} about "${topic}" in the subject "${subject}".

These are NOT multiple choice questions. Students fill in structured answer boxes.

For each question you must:
1. Write a clear calculation problem appropriate for the level
2. Detect the answer TYPE from the list below and structure the answer_template accordingly
3. Provide full step-by-step working in the explanation
4. Provide a one-sentence hint

Answer template types — pick the one that matches the answer:
- "number"       → single numerical answer, one box
- "decimal"      → single decimal answer, one box (e.g. 3.14)
- "fraction"     → answer is a fraction: numerator box and denominator box
- "power"        → answer expressed as base to a power: base box and exponent box
- "simultaneous" → two variable values (e.g. x and y), two labeled boxes
- "coordinates"  → answer is a coordinate pair (x, y): two boxes
- "percentage"   → answer is a percentage: one box followed by %
- "ratio"        → answer is a ratio a:b: two boxes
- "angle"        → answer is an angle in degrees: one box followed by °
- "scientific"   → scientific notation a × 10^n: coefficient box and exponent box
- "surd"         → answer in surd form a√b: coefficient box and radicand box
- "two_roots"    → quadratic with two roots x₁ and x₂: two labeled boxes
- "units"        → numerical answer with a unit label (provide the unit string)

IMPORTANT:
- accepted[] must include all valid string representations of the correct answer
  e.g. if answer is 3, accepted should be ["3", "3.0"]
  if answer is 0.5, accepted should be ["0.5", ".5", "1/2"] if fraction form also valid
- Never add MCQ options
- Always show full working in explanation
- Questions must be solvable with clear numeric answers at the given level

Return ONLY a valid JSON array. No preamble, no markdown fences.

[
  {
    "question": "Solve: 2x + y = 7 and x - y = 2",
    "answer_template": {
      "type": "simultaneous",
      "structure": [
        { "id": "x", "label": "x", "answer": "3", "accepted": ["3", "3.0"] },
        { "id": "y", "label": "y", "answer": "1", "accepted": ["1", "1.0"] }
      ]
    },
    "explanation": "Step 1: Add both equations: 3x = 9, so x = 3. Step 2: Substitute x = 3 into x - y = 2: 3 - y = 2, so y = 1.",
    "hint": "Try adding both equations together to eliminate y"
  }
]

More examples of answer_template structures:

fraction: { "type": "fraction", "structure": [{ "id": "num", "label": "numerator", "answer": "3", "accepted": ["3"] }, { "id": "den", "label": "denominator", "answer": "4", "accepted": ["4"] }] }
number: { "type": "number", "structure": [{ "id": "ans", "label": "Answer", "answer": "42", "accepted": ["42", "42.0"] }] }
coordinates: { "type": "coordinates", "structure": [{ "id": "x", "label": "x", "answer": "2", "accepted": ["2", "2.0"] }, { "id": "y", "label": "y", "answer": "-3", "accepted": ["-3", "-3.0"] }] }
units: { "type": "units", "unit": "m/s", "structure": [{ "id": "ans", "label": "Speed", "answer": "15", "accepted": ["15", "15.0"] }] }
`;
}

function buildK12Block(classLevel, curriculum) {
  return `Target audience: K-12 students${classLevel ? ` at ${classLevel} level` : ''}.
Curriculum: ${curriculum || 'general'}.
Use grade-appropriate vocabulary and clear, simple language.`;
}

function buildUniversityBlock(academicStyle) {
  const styleInstructions = {
    cambridge: 'Use an analytical, scenario-based approach with structured reasoning.',
    oxford: 'Emphasise critical thinking, evaluation, and depth over breadth.',
    harvard: 'Use case-based, practical application with real-world contexts.',
    professional: 'Use precise technical terminology in certification style.',
  };
  const styleNote = styleInstructions[academicStyle] || '';
  return `Target audience: University / higher education students.
Maintain academic rigour appropriate for tertiary level.${styleNote ? `\n${styleNote}` : ''}`;
}

// ─── RESPONSE PARSERS ─────────────────────────────────────────────────────────

function parseGenerationResponse(text, questionType) {
  // Strip markdown fences
  let cleaned = text.replace(/```json|```/gi, '').trim();
  // Replace smart quotes
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  // Extract array
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found in response');
  const jsonStr = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(jsonStr);

  if (questionType === 'calculation') {
    return parsed.map((q) => normaliseCalculationQuestion(q));
  }
  return parsed.map((q) => normaliseQuestion(q, questionType));
}

function normaliseQuestion(q, questionType) {
  let correctAnswer = q.correct_answer || q.answer || '';
  if (questionType === 'mcq') {
    correctAnswer = correctAnswer.trim()[0]?.toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) correctAnswer = 'A';
  } else if (questionType === 'true_false') {
    correctAnswer = /^true/i.test(correctAnswer) ? 'True' : 'False';
  }
  return {
    question: q.question || q.question_text || '',
    question_type: questionType,
    type: questionType === 'true_false' ? 'truefalse' : questionType,
    options: q.options || [],
    answer: correctAnswer,
    correct_answer: correctAnswer,
    explanation: q.explanation || '',
    hint: q.hint || '',
  };
}

function normaliseCalculationQuestion(q) {
  return {
    question: q.question || q.question_text || '',
    question_type: 'calculation',
    type: 'calculation',
    options: [],
    answer: null,
    correct_answer: null,
    answer_template: q.answer_template || null,
    explanation: q.explanation || '',
    hint: q.hint || '',
  };
}

// ─── MOCK QUESTIONS ───────────────────────────────────────────────────────────

function getMockQuestions(questionType, count) {
  if (questionType === 'calculation') {
    return Array.from({ length: count }, (_, i) => ({
      question: `[MOCK] Solve: ${i + 2}x + ${i + 1} = ${3 * (i + 2) + (i + 1)}`,
      question_type: 'calculation',
      type: 'calculation',
      options: [],
      answer: null,
      correct_answer: null,
      answer_template: {
        type: 'number',
        structure: [
          {
            id: 'ans',
            label: 'x',
            answer: '3',
            accepted: ['3', '3.0'],
          },
        ],
      },
      explanation: `[MOCK] Step 1: Subtract ${i + 1} from both sides to get ${i + 2}x = ${3 * (i + 2)}. Step 2: Divide both sides by ${i + 2} to get x = 3.`,
      hint: '[MOCK] Isolate x by moving constants to the other side.',
    }));
  }

  if (questionType === 'true_false') {
    return Array.from({ length: count }, (_, i) => ({
      question: `[MOCK] True/False Question ${i + 1}: The sun rises in the east.`,
      question_type: 'true_false',
      type: 'truefalse',
      options: [],
      answer: 'True',
      correct_answer: 'True',
      explanation: '[MOCK] The sun rises in the east due to Earth\'s rotation from west to east.',
      hint: '[MOCK] Think about which direction the sun appears each morning.',
    }));
  }

  // Default MCQ mock
  return Array.from({ length: count }, (_, i) => ({
    question: `[MOCK] Sample MCQ Question ${i + 1}: Which of the following is correct?`,
    question_type: 'mcq',
    type: 'mcq',
    options: ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
    answer: 'A',
    correct_answer: 'A',
    explanation: '[MOCK] Option A is the correct answer for this sample question.',
    hint: '[MOCK] Consider the most fundamental principle.',
  }));
}

// ─── CREDIT COSTS ─────────────────────────────────────────────────────────────

function getCreditCost(questionType, count) {
  // 1 credit per question for all types
  return count;
}

function getCreditAction(questionType) {
  const actionMap = {
    mcq: 'mcq_generation',
    true_false: 'true_false_generation',
    calculation: 'calculation_generation',
  };
  return actionMap[questionType] || 'mcq_generation';
}

// ─── MAIN GENERATION FUNCTION ─────────────────────────────────────────────────

/**
 * generateQuestions — validates credits, calls Gemini, deducts credits.
 * @param {object} params
 * @param {string} params.tutorId
 * @param {string} params.subject
 * @param {string} params.topic
 * @param {string} params.classLevel
 * @param {string} params.questionType  'mcq' | 'true_false' | 'calculation'
 * @param {number} params.count
 * @param {string} [params.curriculum]
 * @param {string} [params.useCase]      'k12_tutor' | 'university'
 * @param {string} [params.academicStyle]
 */
export async function generateQuestions(params) {
  const {
    tutorId,
    subject,
    topic,
    classLevel,
    questionType = 'mcq',
    count = 5,
    curriculum,
    useCase = 'k12_tutor',
    academicStyle,
  } = params;

  const creditCost = getCreditCost(questionType, count);
  const creditAction = getCreditAction(questionType);

  // ── 1. Validate credits ────────────────────────────────────────────────────
  const validation = await validateCredits(tutorId, creditCost);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Insufficient credits',
      questions: [],
    };
  }

  // ── 2. Mock mode (no API key) ─────────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    const mockQuestions = getMockQuestions(questionType, count);
    return { success: true, questions: mockQuestions, creditsUsed: creditCost };
  }

  // ── 3. Build prompt ────────────────────────────────────────────────────────
  let prompt;
  if (questionType === 'calculation') {
    prompt = buildCalculationPrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle });
  } else if (questionType === 'true_false') {
    prompt = buildTrueFalsePrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle });
  } else {
    prompt = buildMCQPrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle });
  }

  // ── 4. Call Gemini ─────────────────────────────────────────────────────────
  let rawText;
  try {
    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const status = errData?.error?.status || '';
      if (status === 'RESOURCE_EXHAUSTED') {
        return { success: false, error: 'Generation limit reached. Try again in a moment.', questions: [] };
      }
      if (status === 'INVALID_ARGUMENT') {
        return { success: false, error: 'Could not generate for this topic. Try a different description.', questions: [] };
      }
      if (status === 'INTERNAL') {
        return { success: false, error: 'Generation temporarily unavailable. Try again.', questions: [] };
      }
      return { success: false, error: `Generation failed (${response.status})`, questions: [] };
    }

    const data = await response.json();
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) {
      return { success: false, error: 'No content returned from AI. Try again.', questions: [] };
    }
  } catch (fetchErr) {
    console.error('[generationService] Gemini fetch error:', fetchErr);
    return { success: false, error: 'Network error reaching AI service. Try again.', questions: [] };
  }

  // ── 5. Parse response ──────────────────────────────────────────────────────
  let questions;
  try {
    questions = parseGenerationResponse(rawText, questionType);
  } catch (parseErr) {
    console.error('[generationService] Parse error:', parseErr, '\nRaw:', rawText);
    return { success: false, error: 'Could not parse AI response. Try generating again.', questions: [] };
  }

  // ── 6. Deduct credits (ONLY after successful parse) ────────────────────────
  try {
    await deductCredits(
      tutorId,
      creditCost,
      `Generated ${count} ${questionType} question${count > 1 ? 's' : ''}`,
      creditAction
    );
  } catch (deductErr) {
    // Log but DO NOT fail — return questions anyway
    console.error('[generationService] Credit deduction failed after successful generation:', deductErr);
  }

  return { success: true, questions, creditsUsed: creditCost };
}