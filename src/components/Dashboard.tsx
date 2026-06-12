import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchMissions, fetchAnnouncements, fetchMembers, fetchStats, fetchPartners } from '../utils/supabase'
import {
  TargetIcon, MegaphoneIcon, UsersIcon, FileTextIcon,
  PlusIcon, ArrowRightIcon,
  HomeIcon, HeartIcon, LeafIcon,
} from './Icons'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function Dashboard() {
  const addToast = useStore(s => s.addToast)
  const missions = useStore(s => s.missions)
  const announcements = useStore(s => s.announcements)
  const members = useStore(s => s.members)
  const setMissions = useStore(s => s.setMissions)
  const setAnnouncements = useStore(s => s.setAnnouncements)
  const setMembers = useStore(s => s.setMembers)
  const setView = useStore(s => s.setView)
  const refreshTrigger = useStore(s => s.refreshTrigger)
  const triggerRefresh = useStore(s => s.triggerRefresh)

  const [liveStats, setLiveStats] = useState({ missions: '0', announcements: '0', members: '0' })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    async function load() {
      try {
        const [missionsData, announcementsData, membersData] = await Promise.allSettled([
          fetchMissions(),
          fetchAnnouncements(),
          fetchMembers(),
        ])
        if (missionsData.status === 'fulfilled') {
          const data = missionsData.value
          setMissions(data || [])
          setLiveStats(p => ({ ...p, missions: String((data || []).length) }))
        }
        if (announcementsData.status === 'fulfilled') {
          const data = announcementsData.value
          setAnnouncements(data || [])
          setLiveStats(p => ({ ...p, announcements: String((data || []).length) }))
        }
        if (membersData.status === 'fulfilled') {
          const data = membersData.value
          setMembers(data || { teachers: [], core: [], general: [], stats: { teachers: 0, core: 0, general: 0, total: 0 } })
          const total = data?.stats?.total || 0
          setLiveStats(p => ({ ...p, members: String(total) }))
        }
      } catch {
        addToast('Failed to load dashboard data', 'error')
      }
      setLastUpdated(Date.now())
      setLoading(false)
    }
    load()
  }, [refreshTrigger])

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts
    const secs = Math.floor(diff / 1000)
    if (secs < 10) return 'just now'
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ago`
  }

  const mCount = missions.length > 0 ? missions.length : liveStats.missions
  const aCount = announcements.length > 0 ? announcements.length : liveStats.announcements
  const memCount = members ? (members.stats?.total || 0) : liveStats.members

  const statCards = [
    { icon: <TargetIcon size={18} />, value: mCount, label: 'Missions', gradient: 'from-emerald-500/10 to-emerald-500/5', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { icon: <MegaphoneIcon size={18} />, value: aCount, label: 'Announcements', gradient: 'from-amber-500/10 to-amber-500/5', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
    { icon: <UsersIcon size={18} />, value: memCount, label: 'Members', gradient: 'from-blue-500/10 to-blue-500/5', iconBg: 'bg-blue-100 dark:bg-blue-500/10', iconColor: 'text-blue-600 dark:text-blue-400' },
    { icon: <LeafIcon size={18} />, value: 'Live', label: 'DB Status', gradient: 'from-purple-500/10 to-purple-500/5', iconBg: 'bg-purple-100 dark:bg-purple-500/10', iconColor: 'text-purple-600 dark:text-purple-400' },
  ]

  const quickActions = [
    { icon: <TargetIcon size={20} />, title: 'Create Mission', desc: 'Add a new mission with images, goals, timeline', view: 'missions' as const, gradient: 'from-emerald-500/10 to-transparent', iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { icon: <MegaphoneIcon size={20} />, title: 'Create Announcement', desc: 'Post a club notice or update', view: 'announcements' as const, gradient: 'from-amber-500/10 to-transparent', iconBg: 'bg-amber-100 dark:bg-amber-500/10', iconColor: 'text-amber-600 dark:text-amber-400' },
    { icon: <UsersIcon size={20} />, title: 'Edit Members', desc: 'Update teacher, core & general members', view: 'members' as const, gradient: 'from-blue-500/10 to-transparent', iconBg: 'bg-blue-100 dark:bg-blue-500/10', iconColor: 'text-blue-600 dark:text-blue-400' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border dark:border-zinc-800 dark:bg-zinc-900/50" />
        ))}
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HomeIcon size={14} className="text-zinc-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Overview</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-zinc-500">
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={() => { triggerRefresh(); addToast('Refreshing dashboard...', 'info') }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>
      </motion.div>
      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c, i) => (
          <motion.div
            key={i}
            className={`group relative overflow-hidden rounded-xl border dark:border-zinc-800/50 bg-gradient-to-br ${c.gradient} p-4`}
            whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.1)' }}
            transition={{ duration: 0.2 }}
          >
            <div className={`mb-3 inline-flex rounded-lg ${c.iconBg} p-2.5 ${c.iconColor}`}>
              {c.icon}
            </div>
            <motion.div
              className="text-2xl font-bold text-zinc-900 dark:text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              {c.value}
            </motion.div>
            <div className="mt-0.5 text-xs font-medium text-zinc-500">{c.label}</div>
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors" />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-3 flex items-center gap-2">
          <HomeIcon size={14} className="text-zinc-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((a, i) => (
            <motion.button
              key={i}
              className="group flex items-start gap-3 rounded-xl border dark:border-zinc-700/50 bg-gradient-to-br dark:from-zinc-900/50 to-transparent p-4 text-left transition-colors hover:border-zinc-300/50"
              onClick={() => setView(a.view)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className={`shrink-0 rounded-lg ${a.iconBg} p-2.5 ${a.iconColor}`}>
                {a.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium dark:text-zinc-300">{a.title}</div>
                <div className="mt-0.5 text-xs dark:text-zinc-600">{a.desc}</div>
              </div>
              <ArrowRightIcon size={14} className="mt-2 shrink-0 dark:text-zinc-700 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-400" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="group relative overflow-hidden rounded-xl border dark:border-zinc-800/50 bg-gradient-to-r dark:from-zinc-900/80 dark:via-zinc-900/50 dark:to-zinc-900/80 p-5 sm:p-6"
        whileHover={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl dark:bg-emerald-500/10">
              <LeafIcon size={20} className="dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">RU Club Motherland</div>
              <div className="mt-0.5 text-xs text-zinc-500">All changes are saved directly to the database &mdash; instantly live</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
