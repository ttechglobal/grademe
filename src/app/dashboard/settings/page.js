'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import {
  Settings, LogOut, Save, Lock, Globe,
  Pencil, X, BookOpen, Plus, Trash2, Users,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { cn } from '@/lib/utils'

const DEFAULT_SUBJECTS = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry',
  'Physics', 'Government', 'Economics', 'Literature',
  'Geography', 'History', 'Further Mathematics', 'Agricultural Science',
  'Computer Science', 'French', 'Music', 'Physical Education',
  'Religious Studies', 'Business Studies', 'Accounting', 'Art',
]

// PASTE THIS INTO src/app/dashboard/settings/page.js
// Replace the existing CURRICULA array (the one starting with 'const CURRICULA = [')
// with this version — Canadian curriculum has been added between US and Nigerian.

const CURRICULA = [
  {
    value:   'uk',
    label:   'UK Curriculum',
    description: 'Year 1–13 · GCSE & A-Level',
    classes: [
      'Year 1','Year 2','Year 3','Year 4','Year 5','Year 6',
      'Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Year 13',
    ],
  },
  {
    value:   'us',
    label:   'US Curriculum',
    description: 'Grade K–12 · Common Core',
    classes: [
      'Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
      'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
    ],
  },
  // ── NEW: Canadian Curriculum ───────────────────────────────────────────
  {
    value:   'canadian',
    label:   'Canadian Curriculum',
    description: 'Grade K–12 · Provincial standards',
    classes: [
      'Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
      'Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12',
    ],
  },
  // ──────────────────────────────────────────────────────────────────────
  {
    value:   'nigerian',
    label:   'Nigerian Curriculum',
    description: 'JSS1–SS3 · WAEC, NECO, JAMB',
    classes: ['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'],
  },
  {
    value:   'international',
    label:   'International (IB)',
    description: 'PYP, MYP & Diploma',
    classes: [
      'PYP 1','PYP 2','PYP 3','PYP 4','PYP 5',
      'MYP 1','MYP 2','MYP 3','MYP 4','MYP 5',
      'DP Year 1','DP Year 2',
    ],
  },
  {
    value:   'india',
    label:   'Indian Curriculum',
    description: 'Class 1–12 · CBSE / ICSE',
    classes: [
      'Class 1','Class 2','Class 3','Class 4','Class 5','Class 6',
      'Class 7','Class 8','Class 9','Class 10','Class 11','Class 12',
    ],
  },
  {
    value:   'other',
    label:   'Other / Custom',
    description: 'Use your own class structure',
    classes: ['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6'],
  },
]

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-none">
      <span className="text-sm text-ink-4 font-medium">{label}</span>
      <span className="text-sm text-ink font-semibold">{value || '—'}</span>
    </div>
  )
}

// Chip component for subject/class tags
function Chip({ label, onRemove }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-full text-sm font-medium text-brand-800">
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-brand-400 hover:text-danger transition-colors ml-0.5"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

// Subject selector with custom add
function SubjectSelector({ selected, onChange }) {
  const [showAll,   setShowAll]   = useState(false)
  const [custom,    setCustom]    = useState('')
  const inputRef = useRef(null)

  const allSubjects = [
    ...DEFAULT_SUBJECTS,
    ...selected.filter((s) => !DEFAULT_SUBJECTS.includes(s)),
  ]

  const toggle = (subject) => {
    if (selected.includes(subject)) {
      onChange(selected.filter((s) => s !== subject))
    } else {
      onChange([...selected, subject])
    }
  }

  const addCustom = () => {
    const trimmed = custom.trim()
    if (!trimmed) return
    // Capitalise first letter
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    if (!selected.includes(formatted)) {
      onChange([...selected, formatted])
    }
    setCustom('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink-2">
          Subjects I teach
        </label>
        <span className="text-xs text-ink-4">
          {selected.length} selected
        </span>
      </div>

      {/* Selected subjects as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <Chip
              key={s}
              label={s}
              onRemove={() => toggle(s)}
            />
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-amber">
          ⚠️ No subjects selected — all subjects will show when creating assessments
        </p>
      )}

      {/* Add custom subject */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addCustom() }}
          placeholder="Add a custom subject (e.g. Coding, Drama)…"
          className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white"
        />
        <button
          onClick={addCustom}
          disabled={!custom.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Predefined subjects toggle */}
      <div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-brand-500 font-semibold hover:text-brand-400 transition-colors"
        >
          {showAll ? '▲ Hide subject list' : '▼ Pick from common subjects'}
        </button>

        {showAll && (
          <div className="flex flex-wrap gap-2 mt-3">
            {allSubjects.map((subject) => {
              const isSelected = selected.includes(subject)
              return (
                <button
                  key={subject}
                  onClick={() => toggle(subject)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                    isSelected
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-border bg-white text-ink-3 hover:border-brand-300'
                  )}
                >
                  {isSelected && <span className="text-brand-600 text-xs">✓</span>}
                  {subject}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Class selector with custom add
function ClassSelector({ selected, onChange, curriculumClasses }) {
  const [custom, setCustom] = useState('')

  const allClasses = [
    ...curriculumClasses,
    ...selected.filter((c) => !curriculumClasses.includes(c)),
  ]

  const toggle = (cls) => {
    if (selected.includes(cls)) {
      onChange(selected.filter((c) => c !== cls))
    } else {
      onChange([...selected, cls])
    }
  }

  const addCustom = () => {
    const trimmed = custom.trim()
    if (!trimmed) return
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed])
    }
    setCustom('')
  }

  const selectAll = () => onChange([...curriculumClasses])
  const clearAll  = () => onChange([])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink-2">
          Classes / Grades I teach
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="text-xs text-brand-500 font-semibold hover:text-brand-400"
          >
            Select all
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-ink-4 font-semibold hover:text-danger"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Selected classes as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((c) => (
            <Chip
              key={c}
              label={c}
              onRemove={() => toggle(c)}
            />
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-amber">
          ⚠️ No classes selected — all classes will show when creating assessments
        </p>
      )}

      {/* Curriculum classes grid */}
      <div className="flex flex-wrap gap-2">
        {allClasses.map((cls) => {
          const isSelected = selected.includes(cls)
          return (
            <button
              key={cls}
              onClick={() => toggle(cls)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                isSelected
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-border bg-white text-ink-3 hover:border-brand-300'
              )}
            >
              {isSelected && <span className="text-brand-600 text-xs mr-1">✓</span>}
              {cls}
            </button>
          )
        })}
      </div>

      {/* Add custom class */}
      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addCustom() }}
          placeholder="Add a custom class (e.g. Form 3, A-Level)…"
          className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-white"
        />
        <button
          onClick={addCustom}
          disabled={!custom.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  )
}

// ── CourseSelector — for University / Lecturer profile ────────────────────
// Courses are free-form entries with an optional course code.
// Stored as [{ name, code }] in teaching_courses JSONB column.
function CourseSelector({ courses, onChange }) {
  const [name, setName]   = useState('')
  const [code, setCode]   = useState('')

  const add = () => {
    const trimName = name.trim()
    if (!trimName) return
    const updated = [...(courses ?? []), { name: trimName, code: code.trim() }]
    onChange(updated)
    setName('')
    setCode('')
  }

  const remove = (idx) => {
    onChange(courses.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-ink-2 mb-0.5">Courses I Teach</p>
        <p className="text-xs text-ink-4">
          Add all the courses you teach. These appear when creating assessments.
        </p>
      </div>

      {/* Course list */}
      {(courses ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          {courses.map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                {c.code && (
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-lg flex-shrink-0">
                    {c.code}
                  </span>
                )}
                <span className="text-sm text-ink font-medium truncate">{c.name}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-ink-4 hover:text-danger transition-colors flex-shrink-0 ml-2"
                aria-label="Remove course"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(courses ?? []).length === 0 && (
        <p className="text-xs text-amber">
          ⚠️ No courses added — add at least one course to filter assessments
        </p>
      )}

      {/* Add course form */}
      <div className="flex flex-col gap-2 p-4 bg-surface border border-border rounded-xl">
        <p className="text-xs font-semibold text-ink-3 mb-0.5">Add a course</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Course name — e.g. Introduction to Biochemistry"
          className="w-full px-4 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-white"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder="Course code (optional) — e.g. CSCD 201"
            className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-white"
          />
          <button
            type="button"
            onClick={add}
            disabled={!name.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

import { USE_CASE_OPTIONS, getUseCaseConfig } from '@/lib/useCaseConfig'
import UseCaseProfileGrid, { UseCaseProfileBadge } from '@/components/ui/UseCaseProfileGrid'

export default function SettingsPage() {
  const router    = useRouter()
  const { toast } = useToast()

  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState({
    full_name: '', school: '', curriculum: 'uk',
    teaching_subjects: [], teaching_classes: [], teaching_courses: [],
    use_case_profile: 'k12_tutor',
  })
  const [loading,   setLoading]   = useState(true)
  const [editMode,  setEditMode]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [newPw,     setNewPw]     = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwError,   setPwError]   = useState('')
  const [pwEdit,    setPwEdit]    = useState(false)
  // Separate state for editing the use case profile — doesn't affect global profile until saved
  const [editingProfile,    setEditingProfile]    = useState(false)
  const [draftProfile,      setDraftProfile]      = useState('')
  const [editingPrefs,      setEditingPrefs]      = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, school, curriculum, teaching_subjects, teaching_classes, teaching_courses, use_case_profile')
        .eq('id', user.id)
        .single()

      if (p) setProfile((prev) => ({
        ...prev,
        ...p,
        teaching_subjects: p.teaching_subjects ?? [],
        teaching_classes:  p.teaching_classes  ?? [],
        teaching_courses:  p.teaching_courses  ?? [],
        use_case_profile:  p.use_case_profile  ?? 'k12_tutor',
      }))
      // Pre-select the current profile in the grid
      setDraftProfile(p?.use_case_profile ?? 'k12_tutor')
      setLoading(false)
    }
    load()
  }, [])

  const selectedCurriculum = CURRICULA.find((c) => c.value === profile.curriculum) ?? CURRICULA[0]

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:         profile.full_name,
        school:            profile.school,
        curriculum:        profile.curriculum,
        teaching_subjects: profile.teaching_subjects,
        teaching_classes:  profile.teaching_classes,
        teaching_courses:  profile.teaching_courses,
        use_case_profile:  profile.use_case_profile,
      })
      .eq('id', user.id)

    if (error) {
      toast({ message: 'Failed to save.', type: 'error' })
    } else {
      toast({ message: 'Settings saved!', type: 'success' })
      setEditMode(false)
    }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (newPw.length < 8) { setPwError('Min. 8 characters'); return }
    setPwSaving(true)
    setPwError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwError(error.message)
      toast({ message: 'Failed to update password.', type: 'error' })
    } else {
      setNewPw('')
      setPwEdit(false)
      toast({ message: 'Password updated!', type: 'success' })
    }
    setPwSaving(false)
  }

  // Saves ONLY the use_case_profile field — nothing else is touched
  const handleSaveProfile = async () => {
    if (!draftProfile || draftProfile === profile.use_case_profile) {
      setEditingProfile(false)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ use_case_profile: draftProfile })
      .eq('id', user.id)

    if (error) {
      toast({ message: 'Failed to update profile. Please try again.', type: 'error' })
    } else {
      // Update local profile state so the page reflects the change immediately
      setProfile((p) => ({ ...p, use_case_profile: draftProfile }))
      toast({ message: 'Profile updated successfully.', type: 'success' })
      setEditingProfile(false)
    }
    setSaving(false)
  }

  const handleCancelProfile = () => {
    setDraftProfile(profile.use_case_profile)
    setEditingProfile(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-ink-4 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      <div className="flex items-center gap-2">
        <Settings size={22} className="text-brand-500" />
        <h1 className="font-display text-3xl font-bold text-ink">Settings</h1>
      </div>

      {/* ── Profile ── */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={profile.full_name || user?.email} size="lg" />
            <div>
              <p className="font-display text-lg font-bold text-ink">
                {profile.full_name || 'Your Name'}
              </p>
              <p className="text-sm text-ink-4">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-500 transition-colors"
          >
            {editMode ? <><X size={15} /> Cancel</> : <><Pencil size={15} /> Edit</>}
          </button>
        </div>

        {!editMode ? (
          <div>
            <InfoRow label="Full Name" value={profile.full_name} />
            <InfoRow label="School"    value={profile.school} />
            <InfoRow label="Email"     value={user?.email} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label="Full Name"
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="e.g. Adaeze Obi"
            />
            <Input
              label="School"
              value={profile.school ?? ''}
              onChange={(e) => setProfile((p) => ({ ...p, school: e.target.value }))}
              placeholder="e.g. Kings College Lagos"
            />
            <Input
              label="Email"
              value={user?.email ?? ''}
              disabled
              hint="Contact support to change your email"
            />
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              className="self-start"
            >
              <Save size={15} />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* ── Use Case Profile ── */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-500" />
          <p className="font-display text-base font-bold text-ink">How I Use GradeMee</p>
        </div>
        <p className="text-xs text-ink-4 -mt-1 leading-relaxed">
          This configures labels and features across the platform to match how you work.
        </p>

        {/* Always-visible two-card grid — no Edit needed to see options */}
        <UseCaseProfileGrid
          selected={draftProfile || profile.use_case_profile}
          onChange={(val) => {
            setDraftProfile(val)
            setEditingProfile(true)
          }}
        />

        {/* Warning + save/cancel — only shown when a change is pending */}
        {editingProfile && draftProfile && draftProfile !== profile.use_case_profile && (
          <>
            <div className="bg-amber-light border border-amber/25 rounded-xl px-4 py-3 text-xs text-amber leading-relaxed">
              Changing your profile updates how GradeMee is set up for new assessments.
              Your existing assessments and student data are not affected.
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelProfile}
                className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Teaching Preferences ── */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-brand-500" />
            <p className="font-display text-base font-bold text-ink">Teaching Preferences</p>
          </div>
          {!editingPrefs && (
            <button
              type="button"
              onClick={() => setEditingPrefs(true)}
              className="text-xs font-bold text-brand-600 hover:text-brand-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50"
            >
              Edit
            </button>
          )}
        </div>

        {/* University — courses view */}
        {profile.use_case_profile === 'university' ? (
          !editingPrefs ? (
            /* Collapsed: show courses as chips */
            <div className="flex flex-col gap-2">
              {(profile.teaching_courses ?? []).length === 0 ? (
                <p className="text-xs text-amber">No courses added yet. Click Edit to add your courses.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.teaching_courses ?? []).slice(0, 4).map((c, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-lg text-xs font-semibold text-brand-700">
                      {c.code && <span className="text-brand-400">{c.code}</span>}
                      {c.name}
                    </span>
                  ))}
                  {(profile.teaching_courses ?? []).length > 4 && (
                    <span className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink-4">
                      +{profile.teaching_courses.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Expanded: course editor */
            <div className="flex flex-col gap-4">
              <CourseSelector
                courses={profile.teaching_courses ?? []}
                onChange={(courses) => setProfile((p) => ({ ...p, teaching_courses: courses }))}
              />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingPrefs(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
                  Cancel
                </button>
                <Button variant="primary" onClick={async () => { await handleSave(); setEditingPrefs(false) }} loading={saving} className="flex-1">
                  <Save size={15} /> Save
                </Button>
              </div>
            </div>
          )
        ) : (
          /* K-12 / Tutor profile */
          !editingPrefs ? (
            /* Collapsed: show selected subjects + classes as chips */
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold text-ink-4 uppercase tracking-widest mb-2">Subjects</p>
                {(profile.teaching_subjects ?? []).length === 0 ? (
                  <p className="text-xs text-amber">No subjects selected — all subjects will show when creating assessments.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile.teaching_subjects ?? []).slice(0, 5).map((s) => (
                      <span key={s} className="px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-lg text-xs font-semibold text-brand-700">{s}</span>
                    ))}
                    {(profile.teaching_subjects ?? []).length > 5 && (
                      <span className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink-4">
                        +{profile.teaching_subjects.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-4 uppercase tracking-widest mb-2">Classes</p>
                {(profile.teaching_classes ?? []).length === 0 ? (
                  <p className="text-xs text-amber">No classes selected — all classes will show when creating assessments.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile.teaching_classes ?? []).slice(0, 5).map((c) => (
                      <span key={c} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-ink">{c}</span>
                    ))}
                    {(profile.teaching_classes ?? []).length > 5 && (
                      <span className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink-4">
                        +{profile.teaching_classes.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Expanded: full subject + class selectors */
            <div className="flex flex-col gap-5">
              <SubjectSelector
                selected={profile.teaching_subjects ?? []}
                onChange={(subjects) => setProfile((p) => ({ ...p, teaching_subjects: subjects }))}
              />
              <div className="h-px bg-border" />
              <ClassSelector
                selected={profile.teaching_classes ?? []}
                onChange={(classes) => setProfile((p) => ({ ...p, teaching_classes: classes }))}
                curriculumClasses={selectedCurriculum.classes}
              />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingPrefs(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
                  Cancel
                </button>
                <Button variant="primary" onClick={async () => { await handleSave(); setEditingPrefs(false) }} loading={saving} className="flex-1">
                  <Save size={15} /> Save
                </Button>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Curriculum — only shown for K-12 / Tutor profiles ── */}
      {profile.use_case_profile !== 'university' && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-brand-500" />
              <p className="font-display text-base font-bold text-ink">Curriculum</p>
            </div>
            {!editingCurriculum && (
              <button
                type="button"
                onClick={() => setEditingCurriculum(true)}
                className="text-xs font-bold text-brand-600 hover:text-brand-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50"
              >
                Edit
              </button>
            )}
          </div>

          {!editingCurriculum ? (
            /* Collapsed: show active curriculum + 1-2 others as dim pills */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-800">{selectedCurriculum.label}</p>
                  <p className="text-xs text-brand-600 mt-0.5">{selectedCurriculum.short}</p>
                </div>
                <span className="text-xs font-bold text-brand-500 bg-brand-100 px-2.5 py-1 rounded-full flex-shrink-0">Active</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {CURRICULA.filter((c) => c.value !== profile.curriculum).slice(0, 2).map((c) => (
                  <span key={c.value} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink-4 font-medium">
                    {c.label}
                  </span>
                ))}
                {CURRICULA.filter((c) => c.value !== profile.curriculum).length > 2 && (
                  <span className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink-4">
                    +{CURRICULA.filter((c) => c.value !== profile.curriculum).length - 2} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Expanded: full curriculum grid */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CURRICULA.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setProfile((p) => ({
                      ...p,
                      curriculum:       c.value,
                      teaching_classes: [],
                    }))}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      profile.curriculum === c.value
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-border bg-white hover:border-brand-200'
                    )}
                  >
                    <p className="font-semibold text-sm text-ink">{c.label}</p>
                    <p className="text-xs text-ink-4 mt-0.5">{c.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.classes.slice(0, 3).map((cl) => (
                        <span key={cl} className="text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 text-ink-3">{cl}</span>
                      ))}
                      {c.classes.length > 3 && (
                        <span className="text-[10px] text-ink-4 px-1 py-0.5">+{c.classes.length - 3} more</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingCurriculum(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
                  Cancel
                </button>
                <Button variant="primary" onClick={async () => { await handleSave(); setEditingCurriculum(false) }} loading={saving} className="flex-1">
                  <Save size={15} /> Save
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Password ── */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-brand-500" />
            <p className="font-display text-base font-bold text-ink">Password</p>
          </div>
          {!pwEdit && (
            <button
              onClick={() => setPwEdit(true)}
              className="text-sm font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1.5"
            >
              <Pencil size={14} /> Change
            </button>
          )}
        </div>

        {!pwEdit && <p className="text-sm text-ink-4">••••••••••••</p>}

        {pwEdit && (
          <div className="flex flex-col gap-3">
            {pwError && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                {pwError}
              </div>
            )}
            <Input
              label="New Password"
              type="password"
              placeholder="Min. 8 characters"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => { setPwEdit(false); setNewPw(''); setPwError('') }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePasswordChange}
                loading={pwSaving}
                disabled={!newPw}
                className="flex-1"
              >
                Update Password
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sign out ── */}
      <div className="bg-white border border-danger/20 rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <p className="font-display text-base font-bold text-danger">Sign Out</p>
        <p className="text-sm text-ink-3">
          You&apos;ll need your email and password to sign back in.
        </p>
        <Button
          variant="danger"
          onClick={handleSignOut}
          className="self-start"
        >
          <LogOut size={15} />
          Sign Out
        </Button>
      </div>

    </div>
  )
}