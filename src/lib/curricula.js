// src/lib/curricula.js
// Single source of truth for all curriculum data.
// Import this wherever curriculum options are needed:
//   settings/page.js, StepSetup.js, AIGenerate.js

export const CURRICULA = [
  {
    value:       'uk',
    label:       'UK Curriculum',
    description: 'Year 1–13 · GCSE & A-Level',
    aiContext:   'UK curriculum (GCSE/A-Level standard)',
    classes: [
      'Year 1','Year 2','Year 3','Year 4','Year 5','Year 6',
      'Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Year 13',
    ],
  },
  {
    value:       'us',
    label:       'US Curriculum',
    description: 'Grade K–12 · Common Core',
    aiContext:   'US curriculum (Common Core standard)',
    classes: [
      'Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
      'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
    ],
  },
  {
    value:       'canadian',
    label:       'Canadian Curriculum',
    description: 'Grade K–12 · Provincial standards',
    aiContext:   'Canadian curriculum (provincial K–12 standards)',
    classes: [
      'Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
      'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
    ],
  },
  {
    value:       'nigerian',
    label:       'Nigerian Curriculum',
    description: 'JSS1–SS3 · WAEC, NECO, JAMB',
    aiContext:   'Nigerian curriculum (WAEC/NECO standard)',
    classes: ['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'],
  },
  {
    value:       'international',
    label:       'International (IB)',
    description: 'PYP, MYP & Diploma',
    aiContext:   'International Baccalaureate (IB) curriculum',
    classes: [
      'PYP 1','PYP 2','PYP 3','PYP 4','PYP 5',
      'MYP 1','MYP 2','MYP 3','MYP 4','MYP 5',
      'DP Year 1','DP Year 2',
    ],
  },
  {
    value:       'india',
    label:       'Indian Curriculum',
    description: 'Class 1–12 · CBSE / ICSE',
    aiContext:   'Indian curriculum (CBSE/ICSE standard)',
    classes: [
      'Class 1','Class 2','Class 3','Class 4','Class 5','Class 6',
      'Class 7','Class 8','Class 9','Class 10','Class 11','Class 12',
    ],
  },
  {
    value:       'other',
    label:       'Other / Custom',
    description: 'Use your own class structure',
    aiContext:   'general curriculum',
    classes: ['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6'],
  },
]

// Quick lookup maps — used by StepSetup and AIGenerate
export const CLASSES_BY_CURRICULUM = Object.fromEntries(
  CURRICULA.map((c) => [c.value, c.classes])
)

export const CURRICULUM_LABELS = Object.fromEntries(
  CURRICULA.map((c) => [c.value, `${c.label} (${c.classes[0]}–${c.classes.at(-1)})`])
)

export const CURRICULUM_AI_CONTEXT = Object.fromEntries(
  CURRICULA.map((c) => [c.value, c.aiContext])
)

export const getCurriculum = (value) =>
  CURRICULA.find((c) => c.value === value) ?? CURRICULA[0]