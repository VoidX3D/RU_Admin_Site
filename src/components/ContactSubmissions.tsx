import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { fetchContactSubmissions, deleteContactSubmission } from '../utils/supabase'
import { validateEmail } from '../utils/validation'
import { MailIcon, RefreshIcon, TrashIcon, SearchIcon } from './Icons'
import { ConfirmModal } from './ConfirmModal'
import { PageErrorBoundary } from './PageErrorBoundary'

interface ContactEntry {
  id: number
  name: string
  email: string
  subject: string
  message: string
  created_at: string
}

const PAGE_SIZE = 50

export function ContactSubmissions() {
  const addToast = useStore(s => s.addToast)
  const [submissions, setSubmissions] = useState<ContactEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ContactEntry | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchContactSubmissions()
      setSubmissions(data || [])
    } catch (e) {
      console.error('[ContactSubmissions] Load failed:', e)
      setSubmissions([])
      addToast('Failed to load submissions', 'error')
    }
    setLoading(false)
  }

  async function handleDelete(id: number) {
    setConfirmDeleteId(id)
  }

  async function executeDelete(id: number) {
    setConfirmDeleteId(null)
    try {
      const { error } = await deleteContactSubmission(id)
      if (error) { addToast('Delete failed: ' + error.message, 'error'); return }
      addToast('Submission deleted', 'success')
      if (selected?.id === id) setSelected(null)
      load()
    } catch (e) {
      console.error('[ContactSubmissions] Delete failed:', e)
      addToast('Delete failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error')
    }
  }

  const filtered = useMemo(() => {
    if (!search) return submissions
    const q = search.toLowerCase()
    return submissions.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.message.toLowerCase().includes(q)
    )
  }, [submissions, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1)
  }, [totalPages, page])

  return (
    <PageErrorBoundary name="Contact Submissions">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Contact Submissions</h2>
          <p className="mt-0.5 text-xs dark:text-zinc-600">Messages from the contact form</p>
        </div>
        <button className="flex min-h-[44px] sm:h-8 items-center gap-1.5 rounded-lg border dark:border-zinc-800 px-3 text-xs font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:text-zinc-200" onClick={load}>
          <RefreshIcon size={13} /> Refresh
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border dark:border-zinc-800/50 dark:bg-zinc-900/30 px-3 py-2">
        <SearchIcon size={14} className="dark:text-zinc-600" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search submissions..."
          className="flex-1 bg-transparent text-sm dark:text-white outline-none placeholder:text-zinc-400"
        />
        <span className="text-[10px] text-zinc-500">{submissions.length} total</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* List */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl border dark:border-zinc-800/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b dark:border-zinc-800/50 dark:bg-zinc-900/50">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">From</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                    <th className="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">Date</th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded dark:bg-zinc-800/50" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center">
                        <MailIcon size={24} className="mx-auto dark:text-zinc-700" />
                        <div className="mt-2 text-sm font-medium text-zinc-500">No submissions yet</div>
                        <div className="text-xs dark:text-zinc-700">Messages from the contact form will appear here</div>
                      </td>
                    </tr>
                  ) : (
                    paged.map(s => (
                      <tr
                        key={s.id}
                        className={`cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/20 ${selected?.id === s.id ? 'bg-emerald-500/5 dark:bg-emerald-500/5' : ''}`}
                        onClick={() => setSelected(s)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium dark:text-white">{s.name}</div>
                          <div className="flex items-center gap-1 text-[10px] dark:text-zinc-600">
                            {s.email}
                            {validateEmail(s.email) && (
                              <span className="rounded bg-red-500/10 px-1 text-[8px] text-red-500" title="Invalid email format">!</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 dark:text-white">{s.subject}</td>
                        <td className="hidden px-4 py-3 text-[10px] dark:text-zinc-600 sm:table-cell">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button title="Delete submission"
                            className="rounded-lg p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 dark:text-zinc-700 hover:bg-red-100 dark:bg-red-500/10 hover:text-red-600"
                            onClick={e => { e.stopPropagation(); handleDelete(s.id) }}
                          >
                            <TrashIcon size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                className="rounded-lg border dark:border-zinc-800 px-2.5 py-1 min-h-[44px] sm:min-h-0 text-[10px] font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-[10px] dark:text-zinc-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="rounded-lg border dark:border-zinc-800 px-2.5 py-1 min-h-[44px] sm:min-h-0 text-[10px] font-medium dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full shrink-0 lg:w-96"
          >
            <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between border-b dark:border-zinc-800/50 px-4 py-3">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Message Details</h3>
                <button
                  className="rounded p-1 text-zinc-500 hover:text-red-600"
                  onClick={() => handleDelete(selected.id)}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-zinc-500">Name</label>
                  <p className="text-sm font-medium dark:text-white">{selected.name}</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-zinc-500">Email</label>
                  <div className="flex items-center gap-1">
                    <a href={`mailto:${selected.email}`} className="text-sm text-emerald-500 hover:underline">{selected.email}</a>
                    {validateEmail(selected.email) && (
                      <span className="rounded bg-red-500/10 px-1 text-[9px] text-red-500">Invalid</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-zinc-500">Subject</label>
                  <p className="text-sm dark:text-white">{selected.subject}</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-zinc-500">Message</label>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed dark:text-white">{selected.message}</p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-zinc-500">Submitted</label>
                  <p className="text-xs dark:text-zinc-600">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Delete Submission"
        message="Are you sure you want to delete this submission? This action cannot be undone."
        confirmLabel="Delete Permanently"
        onConfirm={() => confirmDeleteId !== null && executeDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </motion.div>
    </PageErrorBoundary>
  )
}
