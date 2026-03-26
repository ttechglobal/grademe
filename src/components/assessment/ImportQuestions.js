'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
  Copy, CheckCheck, Sparkles,
  ArrowRight, Save, AlertCircle,
  Clock, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const EXTRACTION_PROMPT = `You are an expert question extractor and educator. Your job is to extract questions from the content I give you and return them in a specific JSON format.

INSTRUCTIONS:
1. Extract EVERY question you find — do not skip any
2. For each question, provide the correct answer
3. Write a hint that gives a helpful nudge without giving away the answer
4. Write a clear step-by-step explanation of the solution — explain it simply, like you are teaching a 10-year-old who has never seen this before. Use short sentences. Be encouraging.
5. For mathematics: clearly write out equations, formulas, and working step by step. Use plain text for math (e.g. write "x^2 + 3x + 2 = 0" not symbols). Explain what each step means in plain English.
6. Return ONLY the JSON array below — no introduction, no explanation, no markdown code blocks, no extra text whatsoever.

OUTPUT FORMAT (return only this, nothing else):
[
  {
    "question": "Full question text, exactly as written",
    "type": "mcq",
    "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
    "answer": "A",
    "hint": "A short helpful nudge that does not give away the answer",
    "explanation": "Step 1: ... Step 2: ... Step 3: ... Therefore the answer is ..."
  }
]

RULES:
- "type" must be exactly one of: "mcq", "fill", or "truefalse"
- For MCQ questions: options must be an array of 4 strings, each starting with A. B. C. D. and "answer" must be the correct letter only (A, B, C, or D)
- For fill-in-the-blank: options should be [] and "answer" should be the exact correct answer
- For true/false: options should be ["True", "False"] and "answer" should be "True" or "False"
- If you cannot determine the correct answer from the content, make your best educated guess based on the subject
- The explanation must always be written in simple, plain English — short sentences, friendly tone
- For maths explanations: always show the working, explain each step, and state the final answer clearly
- Do NOT include any text before or after the JSON array
- Do NOT wrap the JSON in markdown code blocks

Now extract all questions from the following content:`

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
  { value: '',       label: 'Select class...' },
  { value: 'year7',  label: 'Year 7'          },
  { value: 'year8',  label: 'Year 8'          },
  { value: 'year9',  label: 'Year 9'          },
  { value: 'year10', label: 'Year 10'         },
  { value: 'year11', label: 'Year 11'         },
  { value: 'year12', label: 'Year 12'         },
  { value: 'year13', label: 'Year 13'         },
  { value: 'jss1',   label: 'JSS 1'           },
  { value: 'jss2',   label: 'JSS 2'           },
  { value: 'jss3',   label: 'JSS 3'           },
  { value: 'ss1',    label: 'SS 1'            },
  { value: 'ss2',    label: 'SS 2'            },
  { value: 'ss3',    label: 'SS 3'            },
  { value: 'kinder',  label: 'Kindergarten'   },
  { value: 'grade1',  label: 'Grade 1'        },
  { value: 'grade2',  label: 'Grade 2'        },
  { value: 'grade3',  label: 'Grade 3'        },
  { value: 'grade4',  label: 'Grade 4'        },
  { value: 'grade5',  label: 'Grade 5'        },
  { value: 'grade6',  label: 'Grade 6'        },
  { value: 'grade7',  label: 'Grade 7'        },
  { value: 'grade8',  label: 'Grade 8'        },
  { value: 'grade9',  label: 'Grade 9'        },
  { value: 'grade10', label: 'Grade 10'       },
  { value: 'grade11', label: 'Grade 11'       },
  { value: 'grade12', label: 'Grade 12'       },
]

const AI_TOOLS = [
  {
    name:  'ChatGPT',
    url:   'https://chat.openai.com',
    icon:  '🤖',
    note:  'Best for text. Can also read images if you have GPT-4o.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    name:  'Gemini',
    url:   'https://gemini.google.com',
    icon:  '✨',
    note:  'Excellent for images, PDFs and worksheets.',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    name:  'Claude',
    url:   'https://claude.ai',
    icon:  '🔮',
    note:  'Great for long documents and detailed explanations.',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
]

const STEPS = [
  { number: 1, label: 'Prepare content'  },
  { number: 2, label: 'Copy prompt'      },
  { number: 3, label: 'Paste response'   },
  { number: 4, label: 'Review & save'    },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.number} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200',
              current === s.number
                ? 'bg-brand-800 text-white shadow-card scale-110'
                : current > s.number
                ? 'bg-success text-white'
                : 'bg-border text-ink-4'
            )}>
              {current > s.number ? '✓' : s.number}
            </div>
            <span className={cn(
              'text-[10px] font-semibold whitespace-nowrap hidden sm:block transition-colors',
              current === s.number ? 'text-brand-700' : 'text-ink-4'
            )}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-3 mb-5 transition-colors duration-300',
              current > s.number ? 'bg-success' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ImportQuestions() {
  const router    = useRouter()
  const { toast } = useToast()

  const [step,       setStep]       = useState(1)
  const [copied,     setCopied]     = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [questions,  setQuestions]  = useState([])
  const [parseError, setParseError] = useState('')
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
    try {
      const clean = aiResponse
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      const match = clean.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array found')

      const parsed = JSON.parse(match[0])
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Empty or invalid array')
      }

      const mapped = parsed
        .map((q) => ({
          type:        q.type        || 'mcq',
          text:        q.question    || q.text || '',
          options:     Array.isArray(q.options) ? q.options : [],
          answer:      q.answer      || '',
          hint:        q.hint        || '',
          explanation: q.explanation || '',
        }))
        .filter((q) => q.text.trim().length > 0)

      if (mapped.length === 0) throw new Error('No valid questions found')

      setQuestions(mapped)
      setStep(4)
      toast({
        message: `${mapped.length} questions extracted successfully!`,
        type:    'success',
      })
    } catch (err) {
      setParseError(
        'Could not extract questions from the AI response. ' +
        'Make sure you copied the full response and it starts with [ and ends with ].'
      )
      toast({ message: 'Could not parse the response.', type: 'error' })
    }
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

    const teacherId = session.user.id

    const rows = questions.map((q, i) => ({
      assessment_id: null,
      teacher_id:    teacherId,
      type:          q.type,
      text:          q.text,
      options:       Array.isArray(q.options) ? q.options : [],
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
      console.error('Insert error:', error)
      toast({ message: `Failed to save: ${error.message}`, type: 'error' })
    } else {
      setSaved(true)
      toast({
        message: `${questions.length} questions saved to your Question Bank!`,
        type:    'success',
      })
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
                How Import Questions works
              </h2>
              <p className="text-sm text-brand-700 leading-relaxed">
                Turn any worksheet, textbook screenshot, or PDF into structured
                questions in your bank — in under 2 minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: '📸', title: 'Get your content ready', desc: 'Take a screenshot, export a PDF, or copy text from your worksheet, past exam paper, or textbook page.' },
                { icon: '🤖', title: 'Open any AI tool',       desc: 'Go to ChatGPT, Gemini, or Claude. Upload your image or paste your text, then add our special prompt.' },
                { icon: '📋', title: 'Paste the AI response',  desc: 'The AI returns a structured list of questions with answers, hints, and explanations. Paste it below.' },
                { icon: '✅', title: 'Review and save',        desc: 'GradeMe extracts everything automatically. Review, classify, and save to your Question Bank.' },
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

          <div className="bg-white border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">
            <p className="font-display text-base font-bold text-ink">Recommended AI tools</p>
            <div className="flex flex-col gap-2">
              {AI_TOOLS.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm', tool.color)}
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{tool.name}</p>
                    <p className="text-xs opacity-80 mt-0.5">{tool.note}</p>
                  </div>
                  <ChevronRight size={15} className="opacity-60 flex-shrink-0" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border bg-surface">
              <div className="w-9 h-9 rounded-xl bg-border flex items-center justify-center text-lg flex-shrink-0 opacity-50">📎</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-3">Direct file upload</p>
                  <span className="inline-flex items-center gap-1 bg-amber-light text-amber text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Clock size={10} /> Coming Soon
                  </span>
                </div>
                <p className="text-xs text-ink-4 mt-0.5">Upload PDFs and images directly — no AI tool needed</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setStep(2)}>
              I&apos;m ready — show me the prompt <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-1">Copy this prompt</h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                Copy the prompt below. Then in your AI tool, paste it <strong>after</strong> your questions content.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {[
                'Open ChatGPT, Gemini, or Claude in a new tab',
                'Upload your image / PDF  OR  paste your worksheet text',
                'Then paste the prompt below at the end of your message',
                'Send it and wait for the JSON response',
              ].map((inst, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-ink-2 leading-relaxed">{inst}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-4">Your extraction prompt</p>
                <Button variant={copied ? 'secondary' : 'primary'} size="sm" onClick={copyPrompt}>
                  {copied ? <><CheckCheck size={13} className="text-success" /> Copied!</> : <><Copy size={13} /> Copy Prompt</>}
                </Button>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 text-xs font-mono text-ink-3 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                {EXTRACTION_PROMPT}
              </div>
            </div>
            <div className="bg-amber-light border border-amber/30 rounded-xl px-4 py-3 flex items-start gap-2">
              <span className="text-lg flex-shrink-0">💡</span>
              <div className="text-xs text-amber leading-relaxed">
                <strong>Tip for maths:</strong> If your content has diagrams or shapes, describe them in text before pasting.
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Done — I have the response <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-1">Paste the AI response</h2>
              <p className="text-sm text-ink-3 leading-relaxed">
                Copy the full response from the AI and paste it below. GradeMe will automatically extract all the questions.
              </p>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-brand-700">What the AI response should look like:</p>
              <div className="font-mono text-xs text-brand-600 leading-relaxed">
                <p>[</p>
                <p className="ml-4">{'{'} &quot;question&quot;: &quot;What is 2 + 2?&quot;,</p>
                <p className="ml-6">&quot;type&quot;: &quot;mcq&quot;,</p>
                <p className="ml-6">&quot;options&quot;: [&quot;A. 3&quot;, &quot;B. 4&quot;, &quot;C. 5&quot;, &quot;D. 6&quot;],</p>
                <p className="ml-6">&quot;answer&quot;: &quot;B&quot;,</p>
                <p className="ml-6">&quot;hint&quot;: &quot;Count fingers&quot;,</p>
                <p className="ml-6">&quot;explanation&quot;: &quot;Step 1: ...&quot; {'}'}</p>
                <p>]</p>
              </div>
            </div>
            <textarea
              value={aiResponse}
              onChange={(e) => { setAiResponse(e.target.value); setParseError('') }}
              placeholder="Paste the full AI response here..."
              rows={14}
              className="w-full px-4 py-3 text-sm font-mono bg-white border border-border rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none placeholder:text-ink-4"
            />
            {parseError && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Could not extract questions</p>
                  <p className="text-xs leading-relaxed">{parseError}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="primary" onClick={handleParse} disabled={!aiResponse.trim()}>
              <Sparkles size={15} /> Extract Questions
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div className="bg-success-light border border-success/20 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-semibold text-success">
                {questions.length} question{questions.length !== 1 ? 's' : ''} extracted!
              </p>
              <p className="text-xs text-success/80 mt-0.5">Classify them below and save to your Question Bank.</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
            <h3 className="font-display text-lg font-bold text-ink">Classify these questions</h3>
            <p className="text-sm text-ink-3 -mt-2">This organises your Question Bank by Subject → Class → Topic</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Subject" options={SUBJECTS} value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Select label="Class"   options={CLASSES}   value={classLevel} onChange={(e) => setClassLevel(e.target.value)} />
              <Input  label="Topic"   placeholder="e.g. Quadratic Equations" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="px-5 py-4 bg-surface border-b border-border flex items-center justify-between">
              <p className="font-semibold text-sm text-ink">
                Preview — {questions.length} question{questions.length !== 1 ? 's' : ''}
              </p>
              <button onClick={() => setStep(3)} className="text-xs text-brand-500 font-semibold hover:text-brand-400">
                Re-paste response
              </button>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-none hover:bg-surface/50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <p className="text-sm font-medium text-ink leading-relaxed">{q.text}</p>
                  {q.options?.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {q.options.map((opt, oi) => {
                        const letter   = opt.charAt(0)
                        const isAnswer = letter === q.answer
                        return (
                          <p key={oi} className={cn('text-xs px-2.5 py-1.5 rounded-lg', isAnswer ? 'bg-success-light text-success font-semibold' : 'text-ink-4')}>
                            {opt} {isAnswer && '✓'}
                          </p>
                        )
                      })}
                    </div>
                  )}
                  {q.type !== 'mcq' && q.answer && (
                    <p className="text-xs text-ink-4">Answer: <span className="font-semibold text-success">{q.answer}</span></p>
                  )}
                  {q.hint && <p className="text-xs text-amber bg-amber-light px-2.5 py-1.5 rounded-lg">💡 {q.hint}</p>}
                  {q.explanation && <p className="text-xs text-brand-700 bg-brand-50 px-2.5 py-1.5 rounded-lg leading-relaxed">📖 {q.explanation}</p>}
                </div>
                <span className="text-[10px] bg-surface border border-border rounded px-2 py-1 text-ink-4 flex-shrink-0">{q.type}</span>
              </div>
            ))}
          </div>

          {saved && (
            <div className="bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success font-semibold">
              ✓ {questions.length} questions saved! Redirecting to Question Bank…
            </div>
          )}

          <div className="flex items-center justify-between pb-6">
            <Button variant="ghost" onClick={() => setStep(3)}>← Edit response</Button>
            <Button
              variant="amber"
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