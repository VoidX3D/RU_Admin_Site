import { motion } from 'framer-motion'
import {
  HelpCircleIcon, TargetIcon, MegaphoneIcon, UsersIcon,
  SettingsIcon, EyeIcon, FileTextIcon,
} from './Icons'

const SHORTCUTS: { label: string; desc: string }[] = [
  { label: 'Ctrl+1', desc: 'Create new mission' },
  { label: 'Ctrl+2', desc: 'Create new announcement' },
  { label: 'Ctrl+D', desc: 'Go to Dashboard' },
  { label: 'Ctrl+M', desc: 'Go to Missions' },
  { label: 'Ctrl+A', desc: 'Go to Announcements' },
  { label: 'Ctrl+U', desc: 'Go to Members' },
  { label: 'Ctrl+C', desc: 'Go to Contact Submissions' },
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
      { keys: null, desc: 'Create and edit mission posts with images, stats, goals, timeline, participants, and budget' },
      { keys: null, desc: 'All changes are saved directly to the database — instantly live' },
      { keys: null, desc: 'Use the Preview button on the Full Story field to see how formatted text will appear' },
      { keys: null, desc: 'Separate paragraphs with blank lines for proper formatting' },
    ],
  },
  {
    icon: <MegaphoneIcon size={16} />,
    title: 'Announcements',
    items: [
      { keys: null, desc: 'Create club notices with status, deadline, importance, and optional image' },
      { keys: null, desc: 'Includes visibility toggle for show/hide' },
      { keys: null, desc: 'Preview buttons available on Description, Why It Matters, and Instructions fields' },
      { keys: null, desc: 'Add tags to categorize announcements for easier filtering' },
    ],
  },
  {
    icon: <UsersIcon size={16} />,
    title: 'Members',
    items: [
      { keys: null, desc: 'Manage Teachers, Core Team, and General Members in separate tabs' },
      { keys: null, desc: 'Each member has Name, Class, and Role fields' },
    ],
  },
  {
    icon: <FileTextIcon size={16} />,
    title: 'Text Formatting',
    items: [
      { keys: null, desc: 'Long text fields support multi-paragraph formatting using blank lines' },
      { keys: null, desc: 'Separate paragraphs with an empty line between them' },
      { keys: null, desc: 'The Preview button shows how your text will look on the main website' },
      { keys: null, desc: 'Text is automatically trimmed — no need to worry about leading/trailing spaces' },
    ],
  },
  {
    icon: <EyeIcon size={16} />,
    title: 'Preview Feature',
    items: [
      { keys: null, desc: 'While editing a mission or announcement, click the "Preview" button next to any text area' },
      { keys: null, desc: 'A modal will show your text formatted with proper paragraph breaks' },
      { keys: null, desc: 'This preview matches how the content will appear on the public website' },
      { keys: null, desc: 'Close the preview to continue editing — your changes are not saved until you click "Save to Database"' },
    ],
  },
  {
    icon: <SettingsIcon size={16} />,
    title: 'Data & Settings',
    items: [
      { keys: null, desc: 'All data goes directly to Supabase database — no draft/publish workflow' },
      { keys: null, desc: 'Changes are immediately visible on the website after saving' },
      { keys: null, desc: 'Export/Import full backup as JSON from Settings page' },
      { keys: null, desc: 'Session expires after 30 minutes of inactivity for security' },
    ],
  },
]

export function HelpPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto"
      style={{ maxWidth: 720 }}
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Help & Guide</h2>
        <p className="mt-0.5 text-xs dark:text-zinc-600">How to use the RU Club Motherland Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, i) => (
          <div key={i} className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3">
              <span className="dark:text-zinc-400">{section.icon}</span>
              <h3 className="text-xs font-semibold dark:text-zinc-300">{section.title}</h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs leading-relaxed">
                    {item.keys ? (
                      <span className="flex shrink-0 flex-wrap gap-1">
                        {item.keys.split('+').map((k, ki) => (
                          <span key={ki}
                            className="inline-block rounded border dark:border-zinc-800 dark:bg-zinc-900 px-1.5 py-0.5 text-[9px] font-semibold dark:text-zinc-400 shadow-sm shadow-black/20"
                          >
                            {k}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="mt-1 shrink-0 dark:text-zinc-600">&#8226;</span>
                    )}
                    <span className="dark:text-zinc-500">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border dark:border-zinc-800/50 bg-gradient-to-br from-emerald-500/5 to-transparent px-4 py-6 text-center">
        <p className="text-xs leading-relaxed dark:text-zinc-600">
          RU Club Motherland Admin Panel &middot; <a href="https://github.com/VoidX3D" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">VoidX3D</a>
          <br />
          <span className="text-[10px]">Direct DB editing &mdash; changes are instantly live</span>
        </p>
      </div>
    </motion.div>
  )
}
