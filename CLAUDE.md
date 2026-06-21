# Nyawer — Project Guidelines

Platform donasi streamer Indonesia dengan potongan flat 4%. Built with React + Vite + TailwindCSS, backend Supabase.

---

## Behavioral Guidelines

**Bias toward caution over speed. For trivial tasks, use judgment.**

### Think Before Coding

- Restate what you understand the task to be before implementing.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so and push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No unrequested flexibility or configurability.
- If you write 200 lines and it could be 50, rewrite it.
- Self-check: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

- Touch only what you must. Clean up only your own mess.
- Do not improve adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- Every changed line should trace directly to the user's request.

### Verify Before Claiming

- Use `ls`, `grep`, or `find` to confirm a file exists before `read`.
- Read relevant files before editing them.
- Distinguish observations from assumptions.
- Prefer reproducible evidence over confidence statements.

### Directness

- Lead with the answer. No preamble.
- Skip "great question", "you're right", "sure!". Lead with the answer.
- Say "I'm not sure" when you are not sure. Mark speculation explicitly.

### Goal-Driven Execution

- Transform vague tasks into verifiable goals.
- For multi-step tasks, state a brief plan with verification per step.
- Strong success criteria enable independent looping.

### Production Safety

- Do not run destructive commands against production without explicit approval.
- When in doubt, ask before proceeding.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TailwindCSS 3 |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| Routing | React Router DOM 6 |
| UI Icons | Lucide React |
| QR Code | qrcode.react |
| Language | JavaScript (JSX), no TypeScript |

## Architecture

```
src/
├── main.jsx              # Entry point, renders <AppRouter />
├── App.jsx               # Landing page (hero, features, CTA, footer)
├── router.jsx            # All routes (public + protected + OBS overlays)
├── components/
│   ├── ProtectedRoute.jsx   # Auth guard wrapper
│   └── ui/
│       ├── StatusBadge.jsx  # Donation status badge
│       └── Toast.jsx        # Toast notification component
├── hooks/
│   ├── useAuth.jsx          # Auth context provider + useAuth hook
│   ├── useRealtime.js       # Supabase Realtime subscription hook
│   ├── useTTS.js            # Text-to-speech for OBS alerts
│   └── useToast.js          # Toast state management
├── lib/
│   ├── supabase.js          # Supabase client init (with fallback to mock)
│   ├── mockData.js          # Demo profile & donations for offline mode
│   └── utils.js             # formatRp, formatDate, truncate
└── pages/
    ├── Dashboard.jsx        # Stats, Settings, Overlay tabs
    ├── LoginPage.jsx        # Email/password + Google OAuth
    ├── RegisterPage.jsx     # Registration form
    ├── PayPage.jsx          # Public donation page (/pay/:username)
    └── overlay/
        ├── AlertOverlay.jsx    # OBS: real-time donation alert popup
        ├── MarqueeOverlay.jsx  # OBS: running text donation history
        └── QROverlay.jsx       # OBS: QR code for donation link
```

## Database Schema

Two main tables in `database/schema.sql`:

- **profiles** — Streamer profiles (id, username, display_name, bio, min_donation, avatar_url)
- **donations** — Donation records (id, streamer_id, sender_name, amount, message, status, payment_ref)

Key features:
- `amount_received` is a GENERATED ALWAYS column: `FLOOR(amount * 0.96)`
- Status enum: `pending → success | failed | expired`
- RLS enabled: anon can INSERT donations, only streamer can SELECT their own, service_role can UPDATE status
- Realtime enabled on `donations` table for OBS overlay live updates
- Auto-create profile trigger on `auth.users` INSERT

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login form |
| `/register` | Public | Registration form |
| `/pay/:username` | Public | Donation page for a streamer |
| `/dashboard` | Protected | Streamer dashboard (stats, settings, overlay) |
| `/overlay/alert/:streamerId` | Public | OBS alert overlay |
| `/overlay/marquee/:streamerId` | Public | OBS marquee overlay |
| `/overlay/qr/:streamerId` | Public | OBS QR code overlay |

## Design System

Dark theme with neon accents. Colors defined in `tailwind.config.js`:

- `neon-purple: #a855f7` — Primary brand
- `neon-cyan: #22d3ee` — Secondary accent
- `neon-pink: #ec4899` — Tertiary accent
- `neon-violet: #7c3aed` — Deep accent

Custom CSS classes (defined in `src/index.css`):
- `glass-card`, `glass-card-hover` — Frosted glass cards
- `glass-nav` — Navigation backdrop blur
- `btn-neon` — Primary CTA button with glow
- `btn-glass` — Secondary glass button
- `badge-neon` — Small neon badge
- `divider-neon` — Gradient divider line
- `chrome-text` — Metallic shimmer text effect
- `noise-overlay` — Subtle noise texture

Fonts: `Inter` (body), `Outfit` (display/headings)

## Conventions

- **Language**: UI text is in Bahasa Indonesia
- **Currency**: All monetary values in Rupiah (Rp), use `formatRp()` from `src/lib/utils.js`
- **Fallback mode**: App works without Supabase configured — uses mock data from `src/lib/mockData.js`
- **Supabase check**: Always guard with `isSupabaseReady` before calling supabase methods
- **Component style**: Functional components with hooks, no class components
- **File naming**: PascalCase for components (`PayPage.jsx`), camelCase for hooks/utils (`useAuth.js`)
- **ID attributes**: All interactive elements have `id` attributes for testing (e.g., `id="pay-submit"`)

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (Vite, port 5173)
npm run build      # Production build
npm run preview    # Preview production build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

App runs in demo/mock mode if env vars are not set.

## Important Notes

- No test framework is currently set up
- The `database/schema_v2_patch.sql` contains future schema changes
- OBS overlays use Supabase Realtime for live donation alerts
- Payment gateway integration (Midtrans) is planned but not yet implemented
- The 4% fee is hardcoded in both frontend calculations and database generated column
