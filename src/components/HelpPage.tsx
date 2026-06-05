import { useStore } from '../store'
import { SHORTCUTS } from '../utils/shortcuts'
import {
  HelpCircleIcon, TargetIcon, MegaphoneIcon, UsersIcon,
  SettingsIcon, GitPullRequestIcon
} from './Icons'

const SHORTCUT_DESC: Record<string, string> = {
  'Ctrl+S': 'Save current draft',
  'Ctrl+Shift+P': 'Open publish dialog',
  'Esc': 'Cancel / close',
  'Ctrl+1': 'Create new mission',
  'Ctrl+2': 'Create new announcement',
  'Ctrl+D': 'Go to Dashboard',
  'Ctrl+M': 'Go to Missions',
  'Ctrl+A': 'Go to Announcements',
  'Ctrl+U': 'Go to Members',
  'Ctrl+Shift+S': 'Go to Settings',
}

const SECTIONS = [
  {
    icon: <HelpCircleIcon size={18} />,
    title: 'Keyboard Shortcuts',
    items: Object.values(SHORTCUTS).map(s => ({
      keys: s.label,
      desc: SHORTCUT_DESC[s.label] || '',
    })),
  },
  {
    icon: <TargetIcon size={18} />,
    title: 'Missions',
    items: [
      { keys: null, desc: 'Create and edit mission posts with unlimited images' },
      { keys: null, desc: 'Fields: Title, Tag, Date, Description, Full Story, Stats, Partners' },
      { keys: null, desc: 'Images can be drag-and-drop reordered' },
      { keys: null, desc: 'Drafts auto-save to localStorage' },
    ],
  },
  {
    icon: <MegaphoneIcon size={18} />,
    title: 'Announcements',
    items: [
      { keys: null, desc: 'Create club notices with optional single image' },
      { keys: null, desc: 'Fields: Title, Tag, Status, Date, Time, Location, Summary, Description' },
      { keys: null, desc: 'Includes visibility toggle for show/hide' },
    ],
  },
  {
    icon: <UsersIcon size={18} />,
    title: 'Members',
    items: [
      { keys: null, desc: 'Manage Teachers, Core Team, and General Members' },
      { keys: null, desc: 'Each member has Name, Class, Role, and Type fields' },
      { keys: null, desc: 'Stats auto-calculated for all sections' },
    ],
  },
  {
    icon: <GitPullRequestIcon size={18} />,
    title: 'Publishing',
    items: [
      { keys: null, desc: 'All changes go through a Pull Request — never directly to main' },
      { keys: null, desc: 'Only content files (JSON, images) are committed — code is blocked' },
    ],
  },
  {
    icon: <SettingsIcon size={18} />,
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
    <div className="page-enter page-container">
      <div className="form-page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Help & Guide</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>How to use the RU Club Motherland Admin Panel</p>
        </div>
      </div>

      {SECTIONS.map((section, i) => (
        <div key={i} className="form-card">
          <div className="form-card-header">
            <span style={{ color: 'var(--accent)', display: 'flex' }}>{section.icon}</span>
            <h3>{section.title}</h3>
          </div>
          <div className="form-card-body" style={{ padding: '16px 24px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {section.items.map((item, j) => (
                <li key={j} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '6px 0',
                  borderBottom: j < section.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  {item.keys ? (
                    <span style={{
                      display: 'inline-flex', gap: 4, flexShrink: 0,
                      marginTop: 1,
                    }}>
                      {item.keys.split('+').map((k, ki) => (
                        <span key={ki} style={{
                          display: 'inline-block',
                          padding: '1px 7px',
                          borderRadius: 5,
                          background: 'var(--surface-hover)',
                          border: '1px solid var(--border)',
                          fontSize: 11,
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--text)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        }}>
                          {k}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>•</span>
                  )}
                  <span style={{ color: 'var(--text-secondary)' }}>{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      <div className="form-card" style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, rgba(34,197,94,0.08), transparent)'
          : 'linear-gradient(135deg, rgba(34,197,94,0.04), transparent)',
      }}>
        <div className="form-card-body" style={{ textAlign: 'center', padding: '24px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            RU Club Motherland Admin Panel &middot; Built by &nbsp;
            <strong style={{ color: 'var(--text)' }}>Sincee Bhattarai</strong>
            <br />
            <span style={{ fontSize: 11 }}>Edition for RU Club Site &middot; Content management system</span>
          </p>
        </div>
      </div>
    </div>
  )
}
