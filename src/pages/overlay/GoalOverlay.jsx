/**
 * GoalOverlay — /overlay/goal/:streamerId
 * OBS Browser Source: Progress bar donasi target.
 * Background: transparent.
 * Realtime update via Supabase Realtime.
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { MOCK_DONATIONS, MOCK_PROFILE } from '../../lib/mockData'
import { formatRp } from '../../lib/utils'

export default function GoalOverlay() {
  const { streamerId } = useParams()
  const [current, setCurrent] = useState(0)
  const [target, setTarget]     = useState(0)

  /* Transparent background */
  useEffect(() => {
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  /* Fetch goal data */
  const fetchGoal = useCallback(async () => {
    if (!isSupabaseReady || !supabase || !streamerId) {
      setCurrent(MOCK_PROFILE.donation_goal_current ?? 0)
      setTarget(MOCK_PROFILE.donation_target ?? 1000000)
      return
    }
    try {
      const { data: profileRes, error: profileErr } = await supabase
        .from('profiles')
        .select('donation_target, donation_goal_current')
        .eq('id', streamerId)
        .single()
      if (profileErr) throw profileErr
      setTarget(profileRes?.donation_target ?? 0)
      setCurrent(profileRes?.donation_goal_current ?? 0)
    } catch (err) {
      console.error('Error fetching goal:', err)
    }
  }, [streamerId])

  useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  /* Realtime: listen to donations AND profiles changes */
  useEffect(() => {
    if (!isSupabaseReady || !supabase || !streamerId) return

    const channel = supabase
      .channel(`goal-${streamerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'donations',
        filter: `streamer_id=eq.${streamerId}`,
      }, () => fetchGoal())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${streamerId}`,
      }, () => fetchGoal())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [streamerId, fetchGoal])

  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const isGoalReached = target > 0 && current >= target

  return (
    <div style={{
      position: 'absolute',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 420,
      maxWidth: '90vw',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Goal card */}
      <div style={{
        background: 'rgba(9,9,11,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(63,63,70,0.4)',
        borderRadius: 10,
        padding: '14px 16px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {isGoalReached ? '🎯 Target Tercapai!' : 'Target Donasi'}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: isGoalReached ? '#4ade80' : '#a78bfa',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {Math.round(pct)}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: 8,
          background: 'rgba(63,63,70,0.3)',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 10,
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: isGoalReached
              ? 'linear-gradient(90deg, #22c55e, #4ade80)'
              : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            borderRadius: 4,
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>

        {/* Amounts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{
            fontSize: 18, fontWeight: 800, color: '#fafafa',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {formatRp(current)}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#52525b',
            fontFamily: 'Outfit, sans-serif',
          }}>
            / {formatRp(target)}
          </span>
        </div>
      </div>
    </div>
  )
}
