'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import MathRenderer from '@/components/ui/MathRenderer'
import { Copy, CheckCheck, Sparkles, ArrowRight, Save, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── MCQ extraction prompt ──────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are a question extractor for an educational assessment platform.

Your ONLY job is to convert the provided content into multiple choice questions (MCQ).

ABSOLUTE RULES — break none of these:
1. EVERY question MUST be multiple choice — no exceptions
2. EVERY question MUST have EXACTLY 4 options labeled A, B, C, and D
3. EVERY question MUST have exactly one correct answer
4. Do NOT produce open-ended, fill-in-the-blank, essay, or theory questions
5. Return ONLY a valid JSON array — nothing before it, nothing after it, no markdown

MATH AND SCIENCE FORMATTING:
- Wrap all math in LaTeX: use $...$ for inline (e.g. $x^{2}$, $\\frac{1}{2}$, $\\lambda$)
- Use $$...$$ for standalone equations
- Never write Greek letter names as words — use LaTeX (\\lambda not "lambda")

RETURN EXACTLY THIS JSON STRUCTURE:
[
  {
    "question": "Full question text here",
    "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
    "answer": "B",
    "hint": "A short helpful hint (optional)",
    "explanation": "Step-by-step explanation of why the answer is correct"
  }
]

- The "answer" field: single letter only — A, B, C, or D
- Shuffle the correct answer across different positions — do not always use A
- Options must start with: "A. ", "B. ", "C. ", "D. "
- Extract EVERY question from the content
- Return ONLY the JSON array`

const DIAGRAM_TIP = `💡 If your content includes diagrams, shapes, or graphs — Claude (claude.ai) handles these best. Describe the shape, dimensions, labels, and measurements specifically.`

const SUBJECTS = [
  { value: '',            label: 'Select subject...'  },
  { value: 'mathematics', label: 'Mathematics'        },
  { value: 'english',     label: 'English Language'   },
  { value: 'biology',     label: 'Biology'            },
  { value: 'chemistry',   label: 'Chemistry'          },
  { value: 'physics',     label: 'Physics'            },
  { value: 'government',  label: 'Government'         },
  { value: 'economics',   label: 'Economics'          },
  { value: 'literature',  label: 'Literature'         },
  { value: 'geography',   label: 'Geography'          },
  { value: 'history',     label: 'History'            },
]

const CLASSES = [
  { value: '',        label: 'Select class...' },
  { value: 'year7',   label: 'Year 7'          },
  { value: 'year8',   label: 'Year 8'          },
  { value: 'year9',   label: 'Year 9'          },
  { value: 'year10',  label: 'Year 10'         },
  { value: 'year11',  label: 'Year 11'         },
  { value: 'year12',  label: 'Year 12'         },
  { value: 'year13',  label: 'Year 13'         },
  { value: 'jss1',    label: 'JSS 1'           },
  { value: 'jss2',    label: 'JSS 2'           },
  { value: 'jss3',    label: 'JSS 3'           },
  { value: 'ss1',     label: 'SS 1'            },
  { value: 'ss2',     label: 'SS 2'            },
  { value: 'ss3',     label: 'SS 3'            },
  { value: 'grade8',  label: 'Grade 8'         },
  { value: 'grade9',  label: 'Grade 9'         },
  { value: 'grade10', label: 'Grade 10'        },
  { value: 'grade11', label: 'Grade 11'        },
  { value: 'grade12', label: 'Grade 12'        },
]

const STEPS = [
  { number: 1, label: 'Prepare'  },
  { number: 2, label: 'Copy'     },
  { number: 3, label: 'Paste'    },
  { number: 4, label: 'Save'     },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.number} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              current === s.number  ? 'bg-brand-800 text-white scale-110' :
              current > s.number   ? 'bg-success text-white'              : 'bg-border text-ink-4'
            )}>
              {current > s.number ? '✓' : s.number}
            </div>
            <span className={cn(
              'text-[10px] font-semibold whitespace-nowrap hidden sm:block',
              current === s.number ? 'text-brand-700' : 'text-ink-4'
            )}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-3 mb-5',
              current > s.number ? 'bg-success' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Same robust parser from AIGenerate ────────────────────────────────────
function parseAIResponse(raw) {
  if (!raw || typeof raw !== 'string') {
    return { data: null, error: 'Nothing to parse — the input is empty.' }
  }

  let cleaned = raw
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u00AB\u00BB]/g, '"')
    .trim()

  cleaned = cleaned
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/,      '')
    .replace(/\s*```$/,      '')
    .trim()

  const arrayStart = cleaned.indexOf('[')
  const arrayEnd   = cleaned.lastIndexOf(']')

  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
    return {
      data:  null,
      error: "No JSON array found. The response should start with [ and end with ]. Make sure you copied the entire response.",
    }
  }

  let jsonString = cleaned.slice(arrayStart, arrayEnd + 1)
  jsonString = jsonString.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}')

  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch (firstErr) {
    const lastComplete = jsonString.lastIndexOf('},')
    if (lastComplete > 0) {
      try {
        parsed = JSON.parse(jsonString.slice(0, lastComplete + 1) + ']')
        return {
          data:    parsed,
          warning: 'The response looked incomplete — we recovered what was there.',
        }
      } catch { /* fall through */ }
    }
    return {
      data:  null,
      error: `We couldn't read the pasted content. Please make sure you copied the full response from the AI and try again.\n\nDetail: ${firstErr.message}`,
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { data: null, error: 'No questions found in the response.' }
  }

  return { data: parsed, warning: null, error: null }
}

function validateAndNormalise(rawQuestions) {
  const valid   = []
  const invalid = []

  for (const q of rawQuestions) {
    const text    = (q.question || q.text || '').trim()
    const options = Array.isArray(q.options) ? q.options : []
    const answer  = (q.answer || q.correct_answer || '').trim().toUpperCase().charAt(0)

    if (text && options.length === 4 && /^[A-D]$/.test(answer)) {
      valid.push({
        type:        'mcq',
        text,
        options,
        answer,
        hint:        q.hint        || '',
        explanation: q.explanation || '',
      })
    } else {
      invalid.push(q)
    }
  }

  return { valid, invalid }
}

export default function ImportQuestions() {
  const router    = useRouter()
  const { toast } = useToast()

  const [step,       setStep]       = useState(1)
  const [copied,     setCopied]     = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [questions,  setQuestions]  = useState([])
  const [parseError, setParseError] = useState('')
  const [parseWarn,  setParseWarn]  = useState('')
  const [subject,    setSubject]    = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [topic,      setTopic]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  const copyPrompt = () => {
    navigator.clipboard.writeText(EXTRACTION_PROMPT)
    setCopied(true)
    toast({ message: 'Prompt copied! Paste it into your AI tool.', type: 'success' })
    setTimeout(() => setCopied(false), 3000)
  }

  const handleParse = () => {
    setParseError('')
    setParseWarn('')

    const { data: rawParsed, error, warning } = parseAIResponse(aiResponse)

    if (error) {
      setParseError(error)
      return
    }

    if (warning) setParseWarn(warning)

    const { valid, invalid } = validateAndNormalise(rawParsed)

    if (invalid.length > 0) {
      setParseWarn(
        (warning ? warning + ' — ' : '') +
        `${invalid.length} question${invalid.length !== 1 ? 's' : ''} didn't have exactly 4 options and ${invalid.length !== 1 ? 'were' : 'was'} removed.`
      )
    }

    if (valid.length === 0) {
      setParseError(
        'No valid MCQ questions found. Every question needs exactly 4 options (A, B, C, D) and a single-letter answer. Try copying the prompt again and re-running the AI.'
      )
      return
    }

    setQuestions(valid)
    setStep(4)
    toast({ message: `${valid.length} MCQ question${valid.length !== 1 ? 's' : ''} extracted!`, type: 'success' })
  }

  const handleSave = async () => {
    if (!subject || !classLevel || !topic.trim()) {
      toast({ message: 'Please fill in subject, class, and topic.', type: 'warning' })
      return
    }
    setSaving(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      toast({ message: 'You must be logged in.', type: 'error' })
      router.push('/login')
      return
    }

    const rows = questions.map((q, i) => ({
      assessment_id: null,
      teacher_id:    session.user.id,
      type:          'mcq',
      text:          q.text,
      options:       q.options,
      answer:        q.answer,
      hint:          q.hint        || '',
      explanation:   q.explanation || '',
      order_index:   i,
      subject,
      class_level:   classLevel,
      topic,
    }))

    const { error } = await supabase.from('questions').insert(rows)

    if (error) {
      toast({ message: `Failed to save: ${error.message}`, type: 'error' })
    } else {
      setSaved(true)
      toast({ message: `${questions.length} questions saved to Question Bank!`, type: 'success' })
      setTimeout(() => router.push('/dashboard/questions'), 1800)
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">

      <StepIndicator current={step} />

      {/* STEP 1 */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-900 mb-1">
                Import Questions as MCQ
              </h2>
              <p className="text-sm text-brand-700 leading-relaxed">
                Turn any worksheet, exam paper, or textbook into properly formatted
                multiple choice questions — in under 2 minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: '📄', title: 'Get your content',    desc: 'Screenshot, PDF, or copy text from your worksheet or past exam paper.' },
                { icon: '🤖', title: 'Open any AI tool',    desc: 'ChatGPT, Gemini, or Claude. Upload your content then paste the prompt.' },
                { icon: '📋', title: 'Paste AI response',   desc: 'AI returns MCQ questions with exactly 4 options and a correct answer.' },
                { icon: '✅', title: 'Validate and save',   desc: 'GradeMee checks every question has 4 options before saving.' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-brand-200 flex items-center justify-center text-lg flex-shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-800">{s.title}</p>
                    <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-light border border-amber/30 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
            <p className="text-sm text-amber leading-relaxed">{DIAGRAM_TIP}</p>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setStep(2)}>
              Show me the prompt <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-1">
                Copy this prompt
              </h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                In your AI tool, paste or upload your content first, then paste this prompt
                at the end and send it. It forces MCQ format with 4 options every time.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                'Open ChatGPT, Gemini, or Claude in a new tab',
                'Upload your image / PDF — OR — paste your worksheet text',
                'Paste the prompt below at the very end and send',
                'Copy the entire JSON response it returns',
              ].map((inst, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed">{inst}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-4">
                  MCQ extraction prompt
                </p>
                <Button
                  variant={copied ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={copyPrompt}
                >
                  {copied
                    ? <><CheckCheck size={13} className="text-success" /> Copied!</>
                    : <><Copy size={13} /> Copy Prompt</>
                  }
                </Button>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 text-xs font-mono text-ink-3 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                {EXTRACTION_PROMPT}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              I have the response <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-1">
                Paste the AI response
              </h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                Copy the full response from the AI and paste it below. Only valid MCQ
                questions with exactly 4 options will be saved.
              </p>
            </div>

            <textarea
              value={aiResponse}
              onChange={(e) => {
                setAiResponse(e.target.value)
                setParseError('')
                setParseWarn('')
              }}
              placeholder={'[\n  {\n    "question": "What is...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "B"\n  }\n]'}
              rows={14}
              className="w-full px-4 py-3 text-sm font-mono bg-white border-2 border-border rounded-xl outline-none focus:border-brand-500 resize-none placeholder:text-ink-4"
            />

            {parseWarn && !parseError && (
              <div className="bg-amber-light border border-amber/30 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber leading-relaxed">{parseWarn}</p>
              </div>
            )}

            {parseError && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-danger mb-1">Couldn't read the response</p>
                  <p className="text-xs text-danger/80 leading-relaxed whitespace-pre-line">{parseError}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
            <Button
              variant="primary"
              onClick={handleParse}
              disabled={!aiResponse.trim()}
            >
              <Sparkles size={15} /> Extract MCQ Questions
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div className="bg-success-light border border-success/20 rounded-2xl px-5 py-4 flex items-center gap-3">
            <Check size={18} className="text-success flex-shrink-0" />
            <div>
              <p className="font-semibold text-success">
                {questions.length} MCQ question{questions.length !== 1 ? 's' : ''} validated
              </p>
              <p className="text-xs text-success/80 mt-0.5">
                All questions have 4 options (A, B, C, D) with a correct answer marked.
              </p>
            </div>
          </div>

          {parseWarn && (
            <div className="bg-amber-light border border-amber/30 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber leading-relaxed">{parseWarn}</p>
            </div>
          )}

          {/* Classify */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
            <h3 className="font-display text-lg font-bold text-ink">
              Classify these questions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Subject"
                options={SUBJECTS}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Select
                label="Class"
                options={CLASSES}
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
              />
              <Input
                label="Topic"
                placeholder="e.g. Quadratic Equations"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="px-5 py-4 bg-surface border-b border-border flex items-center justify-between">
              <p className="font-semibold text-sm text-ink">
                Preview — {questions.length} question{questions.length !== 1 ? 's' : ''}
              </p>
              <button
                type="button"
                onClick={() => { setStep(3); setQuestions([]) }}
                className="text-xs text-brand-500 font-semibold hover:text-brand-400"
              >
                Re-paste response
              </button>
            </div>
            {questions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-none hover:bg-surface/50"
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <p className="text-sm font-medium text-ink leading-relaxed">
                    <MathRenderer text={q.text} />
                  </p>
                  {q.options?.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {q.options.map((opt, oi) => {
                        const letter   = opt.charAt(0)
                        const isAnswer = letter === q.answer
                        return (
                          <p key={oi} className={cn(
                            'text-xs px-2.5 py-1.5 rounded-lg',
                            isAnswer
                              ? 'bg-success-light text-success font-semibold'
                              : 'text-ink-4'
                          )}>
                            <MathRenderer text={opt} /> {isAnswer && '✓'}
                          </p>
                        )
                      })}
                    </div>
                  )}
                  {q.hint && (
                    <p className="text-xs text-amber bg-amber-light px-2.5 py-1.5 rounded-lg">
                      💡 {q.hint}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {saved && (
            <div className="bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success font-semibold">
              ✓ {questions.length} questions saved! Redirecting to Question Bank…
            </div>
          )}

          <div className="flex items-center justify-between pb-6">
            <Button variant="ghost" onClick={() => { setStep(3); setQuestions([]) }}>
              ← Edit response
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!subject || !classLevel || !topic.trim() || saved}
            >
              <Save size={15} />
              Save {questions.length} Questions to Bank
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}