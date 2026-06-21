/**
 * LeaderboardOverlay — /overlay/leaderboard/:streamerId
 * OBS Browser Source: Top 10 donatur berdasarkan total amount.
 * Background: transparent.
 * Realtime update via Supabase Realtime.
 */
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, isSupabaseReady } from '../../lib/supabase'
import { MOCK_DONATIONS, MOCK_PROFILE } from '../../lib/mockData'
import { formatRp } from '../../lib/utils'

const MEDAL_COLORS = ['#fbbf24', '#94a3b8', '#cd7c32'] // gold, silver, bronze
const MEDAL_BG     = ['rgba(251,191,36,0.12)', 'rgba(148,163,184,0.10)', 'rgba(205,124,50,0.10)']

function getLeaderboard(donations) {
  const map = {}
  donations.forEach((d) => {
    if (d.status !== 'success' || d.is_test) return
    const key = d.sender_name
    if (!map[key]) map[key] = { sender_name: key, total: 0, count: 0 }
    map[key].total += d.amount
    map[key].count += 1
  })
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

export default function LeaderboardOverlay() {
  const { streamerId } = useParams()
  const [leaderboard, setLeaderboard] = useState([])

  /* Transparent background */
  useEffect(() => {
    document.body.style.setProperty('background', 'transparent', 'important')
    document.documentElement.style.setProperty('background', 'transparent', 'important')
    return () => {
      document.body.style.background = ''
      document.documentElement.style.background = ''
    }
  }, [])

  /* Fetch + compute leaderboard */
  const computeLeaderboard = useCallback(async () => {
    if (!isSupabaseReady || !supabase || !streamerId) {
      setLeaderboard(getLeaderboard(MOCK_DONATIONS))
      return
    }
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('sender_name,amount,status,is_test')
        .eq('streamer_id', streamerId)
        .eq('status', 'success')
        .eq('is_test', false)
      if (error) throw error
      setLeaderboard(getLeaderboard(data || []))
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setLeaderboard(getLeaderboard(MOCK_DONATIONS))
    }
  }, [streamerId])

  useEffect(() => {
    computeLeaderboard()
  }, [computeLeaderboard])

  /* Realtime subscription */
  useEffect(() => {
    if (!isSupabaseReady || !supabase || !streamerId) return

    const channel = supabase
      .channel(`leaderboard-${streamerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'donations',
        filter: `streamer_id=eq.${streamerId}`,
      }, () => computeLeaderboard())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [streamerId, computeLeaderboard])

  if (!leaderboard.length) return null

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 280,
      background: 'rgba(9,9,11,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(63,63,70,0.4)',
      borderRadius: 12,
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(63,63,70,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8m-4-4v4m-2.5-8.5L12 7l4.5 5.5M6 12l6-4.5L18 12" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#fafafa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Top Donatur
        </span>
      </div>

      {/* List */}
      <div style={{ padding: '6px 0' }}>
        {leaderboard.map((d, i) => (
          <div key={d.sender_name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: i < 3 ? MEDAL_BG[i] : 'transparent',
          }}>
            {/* Rank */}
            <span style={{
              width: 18,
              fontSize: 10,
              fontWeight: 800,
              color: i < 3 ? MEDAL_COLORS[i] : '#52525b',
              textAlign: 'center',
              fontFamily: 'Outfit, sans-serif',
              flexShrink: 0,
            }}>
              {i + 1}
            </span>

            {/* Name */}
            <span style={{
              flex: 1,
              fontSize: 11,
              fontWeight: 600,
              color: '#e4e4e7',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {d.sender_name}
            </span>

            {/* Amount */}
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: i < 3 ? MEDAL_COLORS[i] : '#a78bfa',
              fontFamily: 'Outfit, sans-serif',
              flexShrink: 0,
            }}>
              {formatRp(d.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
