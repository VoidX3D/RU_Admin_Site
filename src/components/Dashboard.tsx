import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, getDrafts } from '../store'
import { Storage } from '../utils/storage'
import {
  TargetIcon, MegaphoneIcon, UsersIcon, FileTextIcon,
  PlusIcon, ArrowRightIcon, GitPullRequestIcon, TrashIcon, FolderIcon, StarIcon, ActivityIcon,
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

const item2 = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
}

export function Dashboard() {
  const missions = useStore(s => s.missions)
  const announcements = useStore(s => s.announcements)
  const members = useStore(s => s.members)
  const setMissions = useStore(s => s.setMissions)
  const setAnnouncements = useStore(s => s.setAnnouncements)
  const setMembers = useStore(s => s.setMembers)
  const addToast = useStore(s => s.addToast)
  const setView = useStore(s => s.setView)
  const setPrOpen = useStore(s => s.setPrOpen)
  const setPendingDraftId = useStore(s => s.setPendingDraftId)
  const refreshTrigger = useStore(s => s.refreshTrigger)

  const drafts = getDrafts()
  const [liveStats, setLiveStats] = useState({ missions: '...', announcements: '...', members: '...' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    async function load() {
      const s = Storage.getSettings()
      const B = `https://raw.githubusercontent.com/${s.repoOwner}/${s.repoName}/${s.repoBranch}`
      try {
        const [mRes, aRes, memRes] = await Promise.allSettled([
          fetch(B + '/src/mission/list.json'),
          fetch(B + '/src/announcements/list.json'),
          fetch(B + '/src/info/members.json'),
        ])
        if (mRes.status === 'fulfilled') {
          const d = await mRes.value.json()
          setMissions(d.missions || [])
          setLiveStats(p => ({ ...p, missions: String((d.missions || []).filter((m: { show?: boolean }) => m.show !== false).length) }))
        }
        if (aRes.status === 'fulfilled') {
          const d = await aRes.value.json()
          setAnnouncements(Array.isArray(d) ? d : [])
          setLiveStats(p => ({ ...p, announcements: String((Array.isArray(d) ? d : []).filter((a: { active?: boolean }) => a.active !== false).length) }))
        }
        if (memRes.status === 'fulfilled') {
          const d = await memRes.value.json()
          setMembers(d)
          const total = d.stats?.total || (d.teachers?.length || 0) + (d.core?.length || 0) + (d.general?.length || 0)
          setLiveStats(p => ({ ...p, members: String(total) }))
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [refreshTrigger])

  const missionDrafts = drafts.filter(d => d.type === 'mission')
  const announcementDrafts = drafts.filter(d => d.type === 'announcement')
  const mCount = missions.length > 0
    ? missions.filter(m => {
        const d = missionDrafts.find(x => x.id === m.id)
        return d ? d.show !== false : m.show !== false
      }).length
    : liveStats.missions
  const aCount = announcements.length > 0
    ? announcements.filter(a => {
        const d = announcementDrafts.find(x => x.id === a.id)
        return d ? d.active !== false : a.active !== false
      }).length
    : liveStats.announcements
  const memCount = members
    ? (members.stats?.total || members.general.length + members.core.length + members.teachers.length)
    : liveStats.members

  const statCards = [
    { icon: <TargetIcon size={18} />, value: mCount, label: 'Active Missions', gradient: 'from-emerald-500/10 to-emerald-500/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { icon: <MegaphoneIcon size={18} />, value: aCount, label: 'Active Announcements', gradient: 'from-amber-500/10 to-amber-500/5', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
    { icon: <UsersIcon size={18} />, value: memCount, label: 'Total Members', gradient: 'from-blue-500/10 to-blue-500/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { icon: <FileTextIcon size={18} />, value: drafts.length, label: 'Saved Drafts', gradient: 'from-purple-500/10 to-purple-500/5', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400' },
  ]

  const quickActions = [
    { icon: <TargetIcon size={20} />, title: 'Create Mission', desc: 'Add a new mission with images', view: 'missions' as const, gradient: 'from-emerald-500/10 to-transparent', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { icon: <MegaphoneIcon size={20} />, title: 'Create Announcement', desc: 'Post a club notice or update', view: 'announcements' as const, gradient: 'from-amber-500/10 to-transparent', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
    { icon: <UsersIcon size={20} />, title: 'Edit Members', desc: 'Update teacher, core & general members', view: 'members' as const, gradient: 'from-blue-500/10 to-transparent', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50" />
        ))}
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c, i) => (
          <motion.div
            key={i}
            className={`group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-gradient-to-br ${c.gradient} p-4`}
            whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.1)' }}
            transition={{ duration: 0.2 }}
          >
            <div className={`mb-3 inline-flex rounded-lg ${c.iconBg} p-2.5 ${c.iconColor}`}>
              {c.icon}
            </div>
            <motion.div
              className="text-2xl font-bold text-white"
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
          <StarIcon size={14} className="text-zinc-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((a, i) => (
            <motion.button
              key={i}
              className="group flex items-start gap-3 rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-transparent p-4 text-left transition-colors hover:border-zinc-700/50"
              onClick={() => setView(a.view)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className={`shrink-0 rounded-lg ${a.iconBg} p-2.5 ${a.iconColor}`}>
                {a.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-200">{a.title}</div>
                <div className="mt-0.5 text-xs text-zinc-600">{a.desc}</div>
              </div>
              <ArrowRightIcon size={14} className="mt-2 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-500" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-3 flex items-center gap-2">
          <FolderIcon size={14} className="text-zinc-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Saved Drafts</h2>
          {drafts.length > 0 && (
            <span className="ml-auto rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
            </span>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/30">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <FileTextIcon size={24} className="text-zinc-700" />
              <div className="text-sm font-medium text-zinc-500">No saved drafts yet</div>
              <div className="text-xs text-zinc-700">Create content and save your progress</div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {drafts.map((d, i) => (
                <motion.div
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/30"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                >
                  <div className={`rounded-md p-1.5 ${
                    d.type === 'mission' ? 'bg-emerald-500/10 text-emerald-400' :
                    d.type === 'announcement' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {d.type === 'mission' ? <TargetIcon size={14} /> : d.type === 'announcement' ? <MegaphoneIcon size={14} /> : <UsersIcon size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-300">{d.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                      <span className="capitalize">{d.type}</span>
                      <span>&middot;</span>
                      <span>{new Date(d.updated).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    onClick={() => { setPendingDraftId(d.id); setView('draftDiff') }}
                  >
                    Open
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-zinc-700 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => { Storage.deleteDraft(d.type, d.id); addToast('Draft deleted', 'info') }}
                  >
                    <TrashIcon size={13} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        variants={item2}
        className="group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-gradient-to-r from-zinc-900/80 via-zinc-900/50 to-zinc-900/80 p-5 sm:p-6"
        whileHover={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <GitPullRequestIcon size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">GitHub Pull Request</div>
              <div className="mt-0.5 text-xs text-zinc-500">Publish your changes to the live site</div>
            </div>
          </div>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
            onClick={() => setPrOpen(true)}
          >
            <GitPullRequestIcon size={14} />
            Send Pull Request
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
