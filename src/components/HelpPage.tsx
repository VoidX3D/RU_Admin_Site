import { motion } from 'framer-motion'
import { useStore } from '../store'
import {
  HelpCircleIcon, TargetIcon, MegaphoneIcon, UsersIcon,
  SettingsIcon, GitPullRequestIcon, KeyboardIcon
} from './Icons'

const SHORTCUTS: { label: string; desc: string }[] = [
  { label: 'Ctrl+S', desc: 'Save current draft' },
  { label: 'Ctrl+Shift+P', desc: 'Open publish dialog' },
  { label: 'Esc', desc: 'Cancel / close' },
  { label: 'Ctrl+1', desc: 'Create new mission' },
  { label: 'Ctrl+2', desc: 'Create new announcement' },
  { label: 'Ctrl+D', desc: 'Go to Dashboard' },
  { label: 'Ctrl+M', desc: 'Go to Missions' },
  { label: 'Ctrl+A', desc: 'Go to Announcements' },
  { label: 'Ctrl+U', desc: 'Go to Members' },
  { label: 'Ctrl+Shift+S', desc: 'Go to Settings' },
]

const SECTIONS = [
  {
    icon: <HelpCircleIcon size={16} />,
    title: 'Keyboard Shortcuts',
    items: SHORTCUTS.map(s => ({ keys: s.label, desc: s.desc })),
  },
  {
    icon: <TargetIcon size={16} />,
    title: 'Missions',
    items: [
      { keys: null, desc: 'Create and edit mission posts with unlimited images' },
      { keys: null, desc: 'Fields: Title, Tag, Date, Description, Full Story, Stats, Partners' },
      { keys: null, desc: 'Images can be drag-and-drop reordered' },
      { keys: null, desc: 'Drafts auto-save to localStorage' },
    ],
  },
  {
    icon: <MegaphoneIcon size={16} />,
    title: 'Announcements',
    items: [
      { keys: null, desc: 'Create club notices with optional single image' },
      { keys: null, desc: 'Fields: Title, Tag, Status, Date, Time, Location, Summary, Description' },
      { keys: null, desc: 'Includes visibility toggle for show/hide' },
    ],
  },
  {
    icon: <UsersIcon size={16} />,
    title: 'Members',
    items: [
      { keys: null, desc: 'Manage Teachers, Core Team, and General Members' },
      { keys: null, desc: 'Each member has Name, Class, Role, and Type fields' },
      { keys: null, desc: 'Stats auto-calculated for all sections' },
    ],
  },
  {
    icon: <GitPullRequestIcon size={16} />,
    title: 'Publishing',
    items: [
      { keys: null, desc: 'All changes go through a Pull Request — never directly to main' },
      { keys: null, desc: 'Only content files (JSON, images) are committed — code is blocked' },
    ],
  },
  {
    icon: <SettingsIcon size={16} />,
    title: 'Settings',
    items: [
      { keys: null, desc: 'Login credentials are read-only from .env' },
      { keys: null, desc: 'Repository settings (owner, name, branch) are configurable' },
      { keys: null, desc: 'Export/Import full backup as JSON' },
      { keys: null, desc: 'GitHub token status shown (never revealed)' },
    ],
  },
]

export function HelpPage() {
  const theme = useStore(s => s.theme)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">Help & Guide</h2>
        <p className="mt-0.5 text-xs text-zinc-600">How to use the RU Club Motherland Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b border-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">{section.icon}</span>
              <h3 className="text-xs font-semibold text-zinc-300">{section.title}</h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs leading-relaxed">
                    {item.keys ? (
                      <span className="flex shrink-0 flex-wrap gap-1">
                        {item.keys.split('+').map((k, ki) => (
                          <span key={ki}
                            className="inline-block rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400 shadow-sm shadow-black/20"
                          >
                            {k}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="mt-1 shrink-0 text-zinc-600">&#8226;</span>
                    )}
                    <span className="text-zinc-500">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800/50 bg-gradient-to-br from-emerald-500/5 to-transparent px-4 py-6 text-center">
        <p className="text-xs leading-relaxed text-zinc-600">
          RU Club Motherland Admin Panel &middot; Built by <strong className="font-semibold text-zinc-400">Sincee Bhattarai</strong>
          <br />
          <span className="text-[10px]">Edition for RU Club Site &middot; Content management system</span>
        </p>
      </div>
    </motion.div>
  )
}
