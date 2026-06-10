import { motion } from 'framer-motion'

function Kbd({ children }: { children: string }) {
  const parts = children.split('+')
  return (
    <span className="inline-flex flex-wrap gap-0.5">
      {parts.map((k, i) => (
        <span key={i} className="inline-block rounded border dark:border-zinc-700 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold dark:text-zinc-300 shadow-sm font-mono">
          {k}
        </span>
      ))}
    </span>
  )
}

function Badge({ children, color }: { children: string; color?: string }) {
  const c = color || 'emerald'
  return <span className={`inline-block rounded-full bg-${c}-500/10 text-${c}-400 px-2 py-0.5 text-[10px] font-medium`}>{children}</span>
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border dark:border-zinc-800/50 dark:bg-zinc-900/30 overflow-hidden">
      <div className="flex items-center gap-2 border-b dark:border-zinc-800/50 px-4 py-3 dark:text-zinc-400 text-sm font-semibold">
        <span>{icon}</span>
        {title}
      </div>
      <div className="p-4 text-xs dark:text-zinc-400 space-y-2 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

export function HelpPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-4xl space-y-4"
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Help & Guide</h2>
        <p className="mt-0.5 text-xs dark:text-zinc-500">Complete reference for the RU Club Motherland Admin Panel</p>
      </div>

      <Section title="Quick Start" icon="🚀">
        <p><strong>1.</strong> Log in with your admin credentials</p>
        <p><strong>2.</strong> Use the sidebar to navigate between sections</p>
        <p><strong>3.</strong> Create or edit content — all saves go directly to the database</p>
        <p><strong>4.</strong> Changes appear instantly on <a href="https://ruclub.motherland.edu.np" target="_blank" className="text-emerald-400 underline">ruclub.motherland.edu.np</a></p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge color="emerald">No draft/publish</Badge>
          <Badge color="blue">Instant updates</Badge>
          <Badge color="amber">Direct DB writes</Badge>
        </div>
      </Section>

      <Section title="Keyboard Shortcuts" icon="⌨️">
        <div className="space-y-1.5">
          <p><Kbd>Ctrl+1</Kbd> New Mission</p>
          <p><Kbd>Ctrl+2</Kbd> New Announcement</p>
          <p><Kbd>Ctrl+D</Kbd> Dashboard</p>
          <p><Kbd>Ctrl+M</Kbd> Missions</p>
          <p><Kbd>Ctrl+Shift+A</Kbd> Announcements</p>
          <p><Kbd>Ctrl+U</Kbd> Members</p>
          <p><Kbd>Ctrl+Shift+C</Kbd> Contact Submissions</p>
        </div>
      </Section>

      <Section title="Rich Text Editor — Markdown Guide" icon="📝">
        <p className="font-semibold dark:text-zinc-300">All long-text fields use the built-in Markdown editor with three modes:</p>
        <div className="flex gap-2 mt-1 mb-2">
          <Badge color="blue">Edit</Badge><span>— write raw Markdown</span>
        </div>
        <div className="flex gap-2 mb-1">
          <Badge color="emerald">Split</Badge><span>— side-by-side live preview (default)</span>
        </div>
        <div className="flex gap-2 mb-2">
          <Badge color="amber">Preview</Badge><span>— full rendered view</span>
        </div>

        <div className="mt-3 border-t dark:border-zinc-800 pt-3 space-y-2">
          <p className="font-semibold dark:text-zinc-300">Toolbar & Formatting</p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><kbd className="dark:text-zinc-300 font-semibold">B I BI S</kbd><br/><span className="dark:text-zinc-500">Bold, Italic, Bold+Italic, Strikethrough</span></div>
            <div><kbd className="dark:text-zinc-300 font-semibold">H2 H3</kbd><br/><span className="dark:text-zinc-500">Section headings</span></div>
            <div><kbd className="dark:text-zinc-300 font-semibold">&bull; 1. ☐</kbd><br/><span className="dark:text-zinc-500">Bullet, numbered, task lists</span></div>
            <div><kbd className="dark:text-zinc-300 font-semibold">&ldquo; &lt;/&gt; —</kbd><br/><span className="dark:text-zinc-500">Blockquote, inline code, horizontal rule</span></div>
            <div><kbd className="dark:text-zinc-300 font-semibold">🔗 🖼 ≡</kbd><br/><span className="dark:text-zinc-500">Link, image, table</span></div>
            <div><kbd className="dark:text-zinc-300 font-semibold">❮❯ ▶</kbd><br/><span className="dark:text-zinc-500">Code block, collapsible details</span></div>
            <div><kbd className="dark:text-zinc-300 font-semibold">∑ ∫</kbd><br/><span className="dark:text-zinc-500">Inline math ($...$) and block math ($$...$$)</span></div>
          </div>
        </div>

        <div className="mt-3 border-t dark:border-zinc-800 pt-3 space-y-2">
          <p className="font-semibold dark:text-zinc-300">Writing Guide</p>
          <p><span className="text-emerald-400">**bold**</span> — bold text</p>
          <p><span className="text-emerald-400">*italic*</span> — italic text</p>
          <p><span className="text-emerald-400">~~strikethrough~~</span> — strikethrough</p>
          <p><span className="text-emerald-400">[text](url)</span> — hyperlink</p>
          <p><span className="text-emerald-400">![alt](url)</span> — image (paste URL)</p>
          <p><span className="text-emerald-400">- [x] task</span> — checked task list item</p>
          <p><span className="text-emerald-400">| col1 | col2 |</span> — table (headers with --- separator)</p>
          <p><span className="text-emerald-400">```</span> — code block (triple backticks)</p>
          <p><span className="text-emerald-400">&gt; quote</span> — blockquote</p>
          <p><span className="text-emerald-400">$E=mc^2$</span> — inline LaTeX math</p>
          <p><span className="text-emerald-400">{'$$\\sum_{i=1}^n i$$'}</span> — display math (centered)</p>
          <p><span className="text-emerald-400">&lt;details&gt;&lt;summary&gt;...&lt;/details&gt;</span> — collapsible section</p>
          <p><span className="text-emerald-400">---</span> — horizontal rule</p>
        </div>

        <div className="mt-3 border-t dark:border-zinc-800 pt-3 space-y-1">
          <p className="font-semibold dark:text-zinc-300">Keyboard Shortcuts in Editor</p>
          <p><Kbd>Ctrl+B</Kbd> Bold</p>
          <p><Kbd>Ctrl+I</Kbd> Italic</p>
          <p><Kbd>Ctrl+K</Kbd> Insert link</p>
          <p><Kbd>Ctrl+D</Kbd> Strikethrough</p>
          <p><Kbd>Tab</Kbd> Indent (2 spaces)</p>
        </div>
      </Section>

      <Section title="Missions" icon="🎯">
        <p>Missions are the club's core activities. Each mission has:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li><strong>Basic info:</strong> ID (read-only), title, tag/badge, date</li>
          <li><strong>Short description:</strong> One-line summary for the card view</li>
          <li><strong>Full Story:</strong> Rich markdown editor — the main content body</li>
          <li><strong>Stats:</strong> Key metrics (volunteers, trees planted, etc.)</li>
          <li><strong>Partners:</strong> Collaborating organizations</li>
          <li><strong>Goals:</strong> Numbered list of objectives</li>
          <li><strong>Timeline:</strong> Chronological events with dates</li>
          <li><strong>Participants:</strong> Group names and participant counts</li>
          <li><strong>Budget:</strong> Itemized expenses</li>
          <li><strong>Images:</strong> Photo gallery (first image = cover)</li>
          <li><strong>Visibility:</strong> Show/hide toggle for the public site</li>
        </ul>
        <div className="mt-2 flex gap-1.5">
          <Badge color="emerald">Images auto-upload to Supabase Storage</Badge>
          <Badge color="blue">Right-click row for quick actions</Badge>
        </div>
      </Section>

      <Section title="Announcements" icon="📢">
        <p>Announcements cover notices, events, and deadlines:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li><strong>Basic info:</strong> ID, tag (Update/Event/Notice/Opportunity), status, date, deadline</li>
          <li><strong>Title + Summary:</strong> Card headline and one-liner</li>
          <li><strong>Full Description:</strong> Rich markdown editor for main content</li>
          <li><strong>Event details:</strong> Day, time, location, issued by</li>
          <li><strong>Why It Matters:</strong> Importance callout (amber box on site)</li>
          <li><strong>Instructions:</strong> How-to guide for participants</li>
          <li><strong>Tags:</strong> Categorize announcements (free-text, multi)</li>
          <li><strong>Cover Image:</strong> Single hero image</li>
          <li><strong>Gallery:</strong> Additional images</li>
          <li><strong>Visibility:</strong> Active/hidden toggle</li>
        </ul>
        <div className="mt-2 space-y-1">
          <p className="font-semibold dark:text-zinc-300">Status values and their badge colors on the main site:</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge color="red">urgent</Badge>
            <Badge color="emerald">ongoing</Badge>
            <Badge color="amber">upcoming</Badge>
            <Badge color="orange">deadline</Badge>
            <Badge color="zinc">ended</Badge>
          </div>
        </div>
      </Section>

      <Section title="Members" icon="👥">
        <p>Three membership tiers:</p>
        <ul className="list-disc pl-4 space-y-1 mt-1">
          <li><strong>Teachers</strong> — Patrons & advisors</li>
          <li><strong>Core Team</strong> — Student coordinators & leads</li>
          <li><strong>General Members</strong> — Regular club members</li>
        </ul>
        <p className="mt-2">Each member has Name, Class, Role, and optional image. Images auto-upload to Supabase Storage.</p>
      </Section>

      <Section title="Stats & Partners (Home Page)" icon="📊">
        <p><strong>Stats</strong> — The hero section metric cards (e.g., "500+ Students", "25+ Events").</p>
        <p><strong>Partners</strong> — Organization logos displayed below the hero.</p>
        <p className="mt-1 dark:text-zinc-500">Both are simple key-value lists. Changes take effect immediately.</p>
      </Section>

      <Section title="Contact Submissions" icon="✉️">
        <p>Visitor messages from the main site's contact form appear here. Review and delete as needed.</p>
        <p className="dark:text-zinc-500 mt-1">Submitted messages are read-only. Delete after responding.</p>
      </Section>

      <Section title="Settings" icon="⚙️">
        <p><strong>Reformat All Text</strong> — Batch-processes all existing content through the Markdown formatter. Useful after migrating from plain text.</p>
        <p><strong>Export/Import</strong> — Full database backup as JSON. Export regularly for safekeeping.</p>
        <p className="dark:text-zinc-500 mt-1">Session expires after 12 hours. Log out when finished.</p>
      </Section>

      <Section title="Security" icon="🔒">
        <p>Admin credentials are set in environment variables — never committed to the repository.</p>
        <p>All API calls require a JWT token obtained at login.</p>
        <p>Token expires after 12 hours or on browser close.</p>
        <p>Rate-limited login (5 attempts/minute) prevents brute force.</p>
        <p>Optional master key login for emergency access.</p>
        <p>HTML output is sanitized via DOMPurify — scripts are stripped, XSS prevented.</p>
        <div className="mt-2 flex gap-1.5">
          <Badge color="emerald">JWT Auth</Badge>
          <Badge color="blue">Rate Limited</Badge>
          <Badge color="amber">XSS Protected</Badge>
          <Badge color="red">No JS in content</Badge>
        </div>
      </Section>

      <Section title="Technical Architecture" icon="⚡">
        <p><strong>Frontend:</strong> React 19 + TypeScript + Vite + Tailwind CSS v4</p>
        <p><strong>Backend:</strong> Supabase (PostgreSQL + Storage) via API handlers</p>
        <p><strong>Auth:</strong> JWT tokens, admin credentials via environment variables</p>
        <p><strong>Rendering:</strong> Markdown via <code>marked</code> (GFM) + KaTeX (math) + DOMPurify (sanitizer)</p>
        <p><strong>Deployment:</strong> Vercel auto-deploy from <code>main</code> branch</p>
        <p><strong>Main Site:</strong> <a href="https://ruclub.motherland.edu.np" target="_blank" className="text-emerald-400 underline">ruclub.motherland.edu.np</a> / <a href="https://ruclubmss.vercel.app" target="_blank" className="text-emerald-400 underline">ruclubmss.vercel.app</a></p>
        <p><strong>Admin Panel:</strong> <a href="https://ru-admin-site.vercel.app" target="_blank" className="text-emerald-400 underline">ru-admin-site.vercel.app</a></p>
      </Section>

      <div className="rounded-xl border dark:border-zinc-800/50 px-4 py-6 text-center bg-gradient-to-br from-emerald-500/5 to-transparent">
        <p className="text-xs dark:text-zinc-500">
          Built by <a href="https://github.com/VoidX3D" target="_blank" className="text-emerald-400 underline font-semibold">Sincere Bhattarai (@VoidX3D)</a>
          <br />
          <span className="text-[10px] dark:text-zinc-600">RU Club Motherland &middot; Motherland Secondary School &middot; Pokhara, Nepal</span>
        </p>
      </div>
    </motion.div>
  )
}
