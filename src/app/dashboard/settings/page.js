'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { Settings, LogOut, Save, Lock, Globe } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

const CURRICULA = [
  {
    value:       'uk',
    label:       'UK Curriculum',
    description: 'Year 1–13 · GCSE & A-Level grading',
    classes:     ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'],
  },
  {
    value:       'us',
    label:       'US Curriculum',
    description: 'Grade K–12 · GPA grading system',
    classes:     ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  },
  {
    value:       'nigerian',
    label:       'Nigerian Curriculum',
    description: 'JSS1–JSS3, SS1–SS3 · WAEC, NECO, JAMB, BECE grading',
    classes:     ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'],
  },
  {
    value:       'international',
    label:       'International (IB)',
    description: 'IB Primary, Middle & Diploma grading',
    classes:     ['PYP 1', 'PYP 2', 'MYP 1', 'MYP 2', 'MYP 3', 'DP Year 1', 'DP Year 2'],
  },
]

export default function SettingsPage() {
  const router     = useRouter()
  const { toast }  = useToast()

  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState({
    full_name: '', school: '', role: '', curriculum: 'uk', country: 'United Kingdom',
  })
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [newPw,     setNewPw]     = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwError,   setPwError]   = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, school, role, curriculum, country')
        .eq('id', user.id)
        .single()

      if (p) setProfile((prev) => ({ ...prev, ...p }))
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name:  profile.full_name,
        school:     profile.school,
        role:       profile.role,
        curriculum: profile.curriculum,
        country:    profile.country,
      })
      .eq('id', user.id)

    if (error) {
      toast({ message: 'Failed to save profile. Try again.', type: 'error' })
    } else {
      toast({ message: 'Profile updated successfully!', type: 'success' })
    }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    setPwSaving(true)
    setPwError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwError(error.message)
      toast({ message: 'Failed to update password.', type: 'error' })
    } else {
      setNewPw('')
      toast({ message: 'Password updated successfully!', type: 'success' })
    }
    setPwSaving(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const selectedCurriculum = CURRICULA.find((c) => c.value === profile.curriculum) ?? CURRICULA[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-ink-4 text-sm">Loading settings…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings size={22} className="text-brand-500" />
        <h1 className="font-display text-3xl font-bold text-ink">Settings</h1>
      </div>

      {/* Profile */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
        <div className="flex items-center gap-4 pb-5 border-b border-border">
          <Avatar name={profile.full_name || user?.email} size="lg" />
          <div>
            <p className="font-semibold text-ink">{profile.full_name || 'Teacher'}</p>
            <p className="text-sm text-ink-4">{user?.email}</p>
          </div>
        </div>

        <p className="font-display text-base font-bold text-ink">
          Profile Information
        </p>

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
            label="Role / Title"
            value={profile.role ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
            placeholder="e.g. Mathematics Teacher"
          />
          <Input
            label="Email address"
            value={user?.email ?? ''}
            disabled
            hint="Contact support to change your email"
          />
        </div>

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

      {/* Curriculum selector */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-brand-500" />
          <p className="font-display text-base font-bold text-ink">
            Curriculum & Grading System
          </p>
        </div>
        <p className="text-sm text-ink-3 -mt-2">
          This controls class names and grading conventions across GradeMe.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CURRICULA.map((c) => (
            <button
              key={c.value}
              onClick={() => setProfile((p) => ({ ...p, curriculum: c.value }))}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                profile.curriculum === c.value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-white hover:border-brand-200'
              }`}
            >
              <p className="font-semibold text-sm text-ink">{c.label}</p>
              <p className="text-xs text-ink-4 mt-1 leading-relaxed">
                {c.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {c.classes.slice(0, 3).map((cl) => (
                  <span
                    key={cl}
                    className="text-[10px] font-medium bg-surface border border-border rounded px-1.5 py-0.5 text-ink-3"
                  >
                    {cl}
                  </span>
                ))}
                {c.classes.length > 3 && (
                  <span className="text-[10px] text-ink-4 px-1 py-0.5">
                    +{c.classes.length - 3} more
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700">
          <strong>Active:</strong> {selectedCurriculum.label} —{' '}
          Classes: {selectedCurriculum.classes.join(', ')}
        </div>

        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          className="self-start"
        >
          <Save size={15} />
          Save Curriculum
        </Button>
      </div>

      {/* Password */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-brand-500" />
          <p className="font-display text-base font-bold text-ink">
            Change Password
          </p>
        </div>

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

        <Button
          variant="secondary"
          onClick={handlePasswordChange}
          loading={pwSaving}
          disabled={!newPw}
          className="self-start"
        >
          Update Password
        </Button>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-danger/20 rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <p className="font-display text-base font-bold text-danger">
          Danger Zone
        </p>
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