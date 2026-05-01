'use client'

/**
 * useUseCaseProfile
 *
 * Fetches the current tutor's use_case_profile from the database once
 * and returns the resolved config from useCaseConfig.js.
 *
 * Usage:
 *   const { config, profile, loading } = useUseCaseProfile()
 *   config.participantsLabel  // "Students" | "Participants" | "Trainees"
 *   config.showCurriculum     // true | false
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUseCaseConfig } from '@/lib/useCaseConfig'

export function useUseCaseProfile() {
  const [profile, setProfile] = useState('k12_tutor')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { setLoading(false); return }

        const { data } = await supabase
          .from('profiles')
          .select('use_case_profile')
          .eq('id', session.user.id)
          .single()

        if (data?.use_case_profile) {
          setProfile(data.use_case_profile)
        }
      } catch (err) {
        console.warn('[useUseCaseProfile] Failed to load profile:', err.message)
      }
      setLoading(false)
    }
    load()
  }, [])

  return {
    profile,
    config:  getUseCaseConfig(profile),
    loading,
  }
}