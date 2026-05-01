'use client'

/**
 * hooks/useCredits.js
 *
 * Fetches the current tutor's credit balance from the API.
 * Provides a refresh function so components can update after generation/purchase.
 *
 * Usage:
 *   const { credits, loading, refresh } = useCredits()
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCredits() {
  const [credits,  setCredits]  = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [userId,   setUserId]   = useState(null)

  // Get user ID once
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
      else setLoading(false)
    })
  }, [])

  const fetchBalance = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res  = await fetch('/api/credits/balance')
      const data = await res.json()
      if (data.balance !== undefined) setCredits(data.balance)
    } catch (err) {
      console.warn('[useCredits] fetch failed:', err.message)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (userId) fetchBalance()
  }, [userId, fetchBalance])

  return {
    credits,
    loading,
    refresh: fetchBalance,
  }
}