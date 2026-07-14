## Goal
Build the full authenticated app experience for Our Little Galaxy: a refined dashboard plus nine themed pages, all sharing the dreamy night-sky identity, glassmorphism cards, and smooth motion. Frontend-first with a light backend for the two content types users can actually create now (stars, letters); the rest are beautifully scaffolded UIs ready for data.

## Scope & approach

- Frontend-heavy: every page ships polished UI and animations today.
- Backend: add two tables (`stars`, `letters`) so My Jar / Add Star / Love Letters / Timeline / Achievements / Days Together read/write real data. Photos/Videos/Voice are shown as "coming soon" states inside the same UI so nothing looks broken. (Media uploads need storage buckets + a heavier flow — out of scope for this phase.)
- Themes: client-side theme switcher (Night, Rose, Aurora, Vanilla) writing a `data-theme` attribute + localStorage. Persisted per-user to `profiles.theme` for cross-device sync.
- Galaxy Mode: fullscreen immersive view of all stars floating in an animated night sky.
- Achievements: derived from user stats (first star, 10 stars, first letter, 30-day streak, etc.) — computed client-side from queries, no backend needed.

## Backend (single migration)

```
stars
  id uuid pk, user_id uuid (auth.users), title text, note text,
  color text (token key: gold|rose|sky|sage|blush|violet),
  emotion text (love|joy|memory|dream|milestone|thanks),
  starred_on date, created_at timestamptz

letters
  id uuid pk, user_id uuid, title text, body text,
  unlock_at timestamptz null, created_at timestamptz
```

- GRANT SELECT/INSERT/UPDATE/DELETE to authenticated; ALL to service_role.
- RLS on both: user_id = auth.uid() for all four ops.
- Add `theme text default 'night'` to `profiles`.

## Routes (all under `_authenticated/`)

```
src/routes/_authenticated/
  dashboard.tsx        # refined
  my-jar.tsx           # /my-jar
  add-star.tsx         # /add-star
  love-letters.tsx     # /love-letters
  timeline.tsx         # /timeline
  galaxy-mode.tsx      # /galaxy-mode
  themes.tsx           # /themes
  achievements.tsx     # /achievements
  settings.tsx         # /settings
  account.tsx          # /account
```

Each: `head()` with unique title/description, NightSky background, Header, MusicPlayer, glass content shell, reveal animations. All use existing tokens — no new colors.

### Page-by-page

- **Dashboard (refined)**: greeting, quick actions (Add Star / Write Letter), centered MemoryJar with live star count reflected in its inner stars (up to N pulled from DB), stat cards around it now showing real values (Stars, Letters, Days Together) and elegant "soon" pills on Photos/Videos/Voice. Recent stars strip below.
- **My Jar** (`/my-jar`): large jar hero + gallery grid of all the user's stars as glass cards (title, note, colored star icon, date). Empty state with CTA to Add Star.
- **Add Star** (`/add-star`): premium form on a glass card — title, note, date, emotion (chip picker), color (swatch picker matching star colors), submit → insert to `stars`, toast, navigate to My Jar. Motion on successful save (a little star flies up).
- **Love Letters** (`/love-letters`): two-column layout — compose card (title, body, optional unlock date "open on…") + list of existing letters as sealed envelope glass cards; locked letters show countdown and disabled open.
- **Timeline** (`/timeline`): vertical constellation timeline — a glowing thread with alternating left/right glass nodes containing star + letter events sorted by date, connected by a dashed line.
- **Galaxy Mode** (`/galaxy-mode`): fullscreen immersive canvas — every star as a floating pulsing point across the viewport with parallax on mouse, hover reveals title/note in a floating glass tooltip, Esc/close button returns.
- **Themes** (`/themes`): 4 large preview cards (Night, Rose Nebula, Aurora, Vanilla Cream) showing a mini-scene, click sets `data-theme` on `<html>`, saves to profile. Add matching `[data-theme="rose"]` etc. blocks in `src/styles.css` overriding key tokens (`--primary`, `--accent`, gradients).
- **Achievements** (`/achievements`): grid of glass badge cards — locked ones desaturated with subtle lock, unlocked ones glowing. Derived: First Star, 10 Stars, 50 Stars, First Letter, 100 Days Together, 365 Days, Every Emotion Used, etc. Progress bars on the near-unlocked ones.
- **Settings** (`/settings`): sections — Profile (display name, partner name, together_since date), Preferences (music autoplay toggle, reduced motion toggle stored in localStorage), Theme quick-switch link, Danger zone (sign out).
- **Account** (`/account`): email (read-only), password change form via `supabase.auth.updateUser`, connected providers list (from `identities`), sign out.

## Shared components (new)

```
src/components/galaxy/
  PageShell.tsx        # NightSky + Header + MusicPlayer + <main> with consistent padding & animate-reveal
  GlassCard.tsx        # rounded-3xl glass wrapper w/ hover glow
  StarChip.tsx         # colored star icon by token
  SectionHeader.tsx    # eyebrow + display title + subtitle
  EmptyState.tsx       # centered glass state w/ CTA
  ThemeProvider.tsx    # reads profile.theme + localStorage, applies data-theme to <html>
```

## Header

Replace all `to: "/dashboard"` placeholders with real routes (My Jar, Add Star, Love Letters, Timeline, Galaxy Mode, Themes, Achievements, Settings, Account). Keep the Home/Open Galaxy CTA. Ensure `<Link to="/...">` uses strict route strings that match file names.

## Data plumbing

- TanStack Query hooks per entity: `useStars()`, `useLetters()`, `useProfile()`, `useAchievements()` (derived).
- Mutations invalidate the appropriate keys and show `sonner` toasts.
- All Supabase calls via the client SDK — RLS enforces ownership; no server functions needed this phase.

## Styling additions in `src/styles.css`

- `[data-theme="rose"|"aurora"|"vanilla"]` token overrides.
- `@utility glass-card` (already have `.glass`, add a stronger card variant with softer shadow).
- Two extra keyframes: `constellation-draw` (SVG stroke-dashoffset for the timeline thread) and `badge-glow` for achievements.

## Verification

- `bun run build` clean.
- Visit each new route: night sky + header + jar/glass motif consistent; empty states shown when no data; add-star flow inserts row and appears on My Jar, Timeline, and dashboard count; theme switch instantly changes tokens across pages; galaxy-mode renders even with 0 stars; sign-out from Settings/Account follows the cancelQueries → clear → signOut → replace-navigate pattern.
- Playwright screenshots at desktop 1280 and mobile 360 for `/dashboard`, `/my-jar`, `/add-star`, `/love-letters`, `/timeline`, `/galaxy-mode`, `/themes`, `/achievements`, `/settings`, `/account`.

## Out of scope this phase

- Photo/Video/Voice uploads (needs storage buckets + a real capture UI — flagged "soon").
- Sharing a jar with a partner (invite flow, joint accounts) — future phase.
- Notification/reminder emails for unlock dates.
