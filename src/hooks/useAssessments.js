'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAssessments() {
  const [assessments, setAssessments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id,
          title,
          subject,
          class_level,
          topic,
          slug,
          created_at,
          submissions (count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setAssessments(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return { assessments, loading, error }
}