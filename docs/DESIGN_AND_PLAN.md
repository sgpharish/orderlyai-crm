# OrderlyAI CRM — Design & Plan Document

**Purpose:** Single reference for layout, visual language, and feature UX before implementation. Aligns backend API spec with the existing OrderlyAI theme (tokens, glass, shadows) and brand (logo, green accent). Target: modern, trendy, production-ready CRM for large hotel chains.

**No code in this doc — ideas and plan only. Implementation starts after approval.**

---

## 1. Vision & principles

- **Audience:** Hotel staff and admins (front desk, revenue, ops). Used daily; must feel calm, trustworthy, and efficient.
- **Tone:** Minimal, clean, soft mid-tone backgrounds (no stark white or dark mode for v1). Neutrals (zinc/slate) + one accent (OrderlyAI green `#16a34a`). Relaxed density — enough whitespace that heavy users don’t feel cramped.
- **Quality bar:** Enterprise-grade — accessibility (focus, contrast, reduced motion), responsive layout, clear hierarchy, consistent touch targets (44px min). Feels “big hotel chain” ready, not a side project.
- **Theme alignment:** All UI uses existing design tokens (`:root` in `index.css`): primary, semantic text, backgrounds, borders, typography (Inter), spacing scale, radius, shadows, motion, glass variables. We extend with new components and patterns but do not fight the theme.

---

## 2. Brand & logo

**OrderlyAI logo (reference provided):**

- **Composition:** Circular “O” (white ring) with inner icon: two overlapping speech bubbles + small sparkle/stars. Text “rderly” in white, “ai” in green. Clean sans-serif (Inter fits).
- **Colors:** White + green `#16a34a` (matches `--color-primary`). On black it reads as given; on the CRM’s light backgrounds we need a **light-background variant**.
- **Light-background usage:**
  - **Option A (recommended):** Provide or derive a “light” logo asset: circle and “rderly” in dark neutral (e.g. `--color-text-primary`), “ai” in `--color-primary`, icon in same dark. No black fill.
  - **Option B:** Use the existing logo on a subtle dark pill or in a header bar with dark background so white/green still pops.
  - **Option C:** Use only the circular icon (no “rderlyai” text) as an app icon/favicon; full logo on login and in footer or “About.”
- **Placement:**
  - **Login / Forgot / Reset:** Centered above the form; primary brand moment.
  - **App shell (authenticated):** Compact logo + “OrderlyAI” or “OrderlyAI CRM” in the sidebar header or top bar; clicking goes to “Home” or dashboard.
  - **Favicon:** Circular icon only.
- **Consistency:** Same logo asset(s) everywhere; no stretched or low-res versions. Use SVG if available for crispness at all sizes.

---

## 3. Visual language: glass, shadow, polymorphic finish

**Glass (frosted panels):**

- **Where:** Main content cards, sidebar panel, modal/dialog surfaces, login card, filter panels. Use existing `.glass` and `.glass-panel` with `backdrop-filter` and fallback.
- **Layering:** Page background (`--color-bg-page`) → slightly darker or same as `--color-bg-main`. Panels on top use glass so content behind (e.g. subtle gradient or pattern) could show through slightly — keeping it subtle so it doesn’t distract.
- **Header:** Optional glass bar (e.g. `--blur-header`) for the top app header so it feels “floating” over content.

**Shadow:**

- **Hierarchy:** Use token scale: `--shadow-sm` for inputs and small controls, `--shadow-md` for cards and dropdowns, `--shadow-lg` for modals and the login card, `--shadow-panel` for sidebar/panels. Primary buttons keep `--shadow-button` / `--shadow-button-hover` (green tint).
- **Depth:** List rows or table rows can have no shadow or only a bottom border; cards that “hold” content get `--shadow-md` or `--shadow-panel`. Modals and slide-out panels get stronger shadow so they clearly sit above the page.
- **Consistency:** No one-off shadow values; map every surface to a token.

**Polymorphic / soft UI:**

- **Meaning:** Soft, slightly “pill-like” or rounded shapes; buttons already use `--radius-2xl` (pill). Extend to:
  - **Cards:** `--radius-lg` or `--radius-xl` (already in theme).
  - **Inputs:** `--radius-md` (current).
  - **Chips / tags:** `--radius-full` (existing `.chip`).
  - **Avatars or status dots:** Circles; optional very soft inner shadow for a “soft blob” feel.
- **Surfaces:** Slight gradient on primary buttons (already: 135deg primary → primary-dark). We can add a very subtle gradient on main content area (e.g. top-to-bottom from `--color-bg-surface` to `--color-bg-main`) for depth without noise.
- **No over-3D:** Avoid heavy skeuomorphism. “Polymorphic” here = rounded, soft edges + light shadow + optional subtle gradient, not literal 3D shapes.

**Motion:**

- **Transitions:** Use `--duration-fast` / `--duration-normal` for hover and focus; `--duration-slow` for modals or panel open/close. Respect `prefers-reduced-motion` (already in theme).
- **Micro-interactions:** Button lift on hover (already); list row hover with background change; optional gentle fade-in for modals and toasts.
- **Loading:** Skeleton (`.skeleton`) for lists and tables; optional subtle pulse for buttons during submit. No spinners unless necessary; prefer skeleton for layout stability.

---

## 4. Layout & app shell

**High-level structure:**

- **Unauthenticated:** Full-screen layout. Login, Forgot password, Reset password are single-column, centered (like current login). No sidebar or app header.
- **Authenticated:** App shell = **sidebar + main content**. Optional top bar above main for breadcrumbs or context (e.g. “Chat history > Conversation with +1…”).

**Sidebar (authenticated):**

- **Width:** Min `--panel-min-width` (280px); can collapse to icon-only on smaller screens (e.g. icons + tooltips).
- **Background:** Glass panel (`glass-panel`) or solid `--color-bg-panel` with `--shadow-panel`. Slight border (e.g. `--glass-border`) on the inner edge.
- **Content (top to bottom):**
  - **Logo + “OrderlyAI CRM”** (or compact logo only) at top; links to dashboard/home.
  - **Nav links:** Chat history (primary), Bookings, Documents, Analytics. Icons + labels; active state with primary accent (e.g. left border or background tint).
  - **Section header** (e.g. “Account”) then: Profile/Settings, Log out.
- **Responsive:** Below a breakpoint (e.g. 1024px), sidebar becomes overlay/drawer; hamburger in header opens it. Main content full width when sidebar closed.

**Main content area:**

- **Background:** `--color-bg-page` or `--color-bg-main` so it’s clearly distinct from sidebar.
- **Padding:** Consistent `--spacing-2xl` or `--spacing-3xl` from viewport edges; inner content (tables, cards) use same spacing scale.
- **Max width:** Optional max-width (e.g. 1400px) for very wide screens so line length stays readable; center the content block.

**Header (optional top bar):**

- **Height:** `--header-height` (56px). Glass or solid; border-bottom `--color-border-light`.
- **Content:** Page title or breadcrumb; search if global search exists later; user avatar/name and logout shortcut. Keeps critical actions visible without cluttering the sidebar.

---

## 5. Information architecture & routes

**Routes (conceptual):**

| Route | Purpose | API touchpoints |
|-------|---------|-----------------|
| `/login` | Sign in | `POST /auth/login` |
| `/forgot-password` | Request reset email | `POST /auth/forgot-password` |
| `/reset-password` | Set new password (token in query) | `POST /auth/reset-password` |
| `/` or `/dashboard` | Home / overview (optional) | — |
| `/chat` or `/chat/history` | Chat history — list of conversations | `GET /api/chat/history` |
| `/chat/:sessionId` | Single conversation thread | `GET /api/chat/history/:sessionId/messages` |
| `/bookings` | Bookings list with filters | `GET /bookings` |
| `/documents` | Property documents list | `GET /documents?propertyId=...` |
| `/analytics` | Analytics hub (four views, shared date range) | See below |
| `/analytics/messages` | Message analytics | `GET /analytics/:propertyId/messages` |
| `/analytics/bookings` | Booking analytics | `GET /analytics/:propertyId/bookings` |
| `/analytics/conversations` | Conversation analytics | `GET /analytics/:propertyId/conversations` |
| `/analytics/guests` | Guest analytics | `GET /analytics/:propertyId/guests` |

**Auth guard:** All routes except login, forgot-password, reset-password require valid JWT and `role === 'admin'`; redirect to login if missing or expired. Use `user.propertyId` from login response for property-scoped calls.

**Navigation:** Sidebar items map to these routes. “Chat history” is the main CRM surface; Bookings, Documents, Analytics are peer sections. Analytics can be one sidebar entry with in-page tabs or sub-nav for Messages, Bookings, Conversations, Guests.

---

## 6. Screen-by-screen ideas

**Login**

- Centered card (existing pattern): glass panel, soft shadow. Logo at top (light variant), “OrderlyAI CRM” title, “Sign in to your account” subtitle.
- Form: Email, Password; primary “Sign in” button; “Forgot password?” link. Error message area (use `--color-status-error-bg` and `--color-status-error-text`). On success: store token + user (including `propertyId`); redirect to `/chat` or dashboard.
- No sidebar or header; full-page soft background. Optional very subtle gradient or texture on `body` for depth.

**Forgot password**

- Same layout family: centered card, logo, title “Reset your password”, subtitle “We’ll send a link to your email.”
- Single field: Email. Primary “Send reset link”. Back link to login. Success message: “If that email is registered, you’ll receive a reset link.” (Match API message; no email enumeration.)

**Reset password**

- Read `token` from URL (`/reset-password?token=...`). If missing or invalid, show inline error and link to login or forgot-password.
- Form: New password, Confirm new password. Primary “Reset password”. On success: toast or inline success + “Log in” link to `/login`.

**Chat history (list)**

- **Layout:** Main content = toolbar + table (or card list). Toolbar: title “Chat history”, filters as chips or dropdowns: Status (active/closed/all), Date range (from/to), optional Guest phone, Search (message content). “Refresh” optional. Use `propertyId` from auth; pass filters to `GET /api/chat/history`.
- **List:** Each row = one conversation: guest name/phone, unit (if any), platform (WhatsApp/SMS/web) as small badge, status (active/closed), started at, message count, last message preview. Click row → navigate to `/chat/:sessionId`. Table: sortable columns where it helps (e.g. started at, message count). Empty state: “No conversations in this period” with optional adjustment of filters.
- **Visual:** Rows in a glass or surface card; alternating row tint optional (very subtle). Platform and status use chips or small pills (existing `.chip`); active = primary tint.

**Chat thread (single conversation)**

- **Layout:** Header: back to list, guest name/phone, unit, platform, status, assigned staff (if any). Body: message list (scrollable). Messages: guest left, staff/system right (or distinct style); show sender name, time, content; attachments as links or thumbnails. Optional: “Load older” at top.
- **Visual:** Message bubbles or list rows with clear sender; timestamps muted. Use `--color-bg-surface` for message area; bubbles can have soft border and light shadow. No “reply” UI in v1 if API doesn’t support sending from CRM.

**Bookings**

- **Layout:** Toolbar with filters: Status (multi-select or chips: inquiry, pending_approval, confirmed, checked_in, completed, canceled), Platform (WhatsApp/SMS/web), Date range (startDate/endDate on creation). Table: columns per booking (guest, dates, unit, status, platform, created, etc.). Pagination (page, pageSize) per API.
- **Visual:** Same card/table treatment as chat list. Status chips with semantic color (e.g. confirmed = primary, canceled = muted/error tint).

**Documents**

- **Layout:** Title “Property documents”, list of documents (name, description, type, uploadedAt). Actions per row: “Replace” (opens replace flow). Optional “Upload” if we add `POST /documents/upload` later.
- **Replace flow:** Modal or slide-over: file picker, optional name/description; submit `PUT /documents/:id/replace` (multipart). Success: refresh list or show toast.
- **Visual:** Cards or table rows; glass panel for list container.

**Analytics (four views, shared date range)**

All analytics views share a required date range (startDate, endDate) at the top; optional `groupBy=day` where the API supports it. One Analytics page with tabs or sub-nav: **Messages**, **Bookings**, **Conversations**, **Guests**. Same visual language: KPI cards (glass/surface), charts or tables with soft background; primary green for key metrics, neutrals for others. Pick a simple, accessible chart library when implementing.

- **Messages** — `GET /analytics/:propertyId/messages`
  - **Display:** Total messages; breakdown by platform (whatsapp, sms, web); breakdown by type (booking vs concierge). If `groupBy=day`, daily series (chart or table).
  - **Use:** Volume and channel mix for messaging.

- **Bookings** — `GET /analytics/:propertyId/bookings`
  - **Display:** Total bookings; overTime (daily when `groupBy=day`); conversion funnel (inquiry → pending_approval → confirmed → checked_in → completed, plus canceled); by platform; by source (Direct, Booking.com, etc.); average length of stay (nights).
  - **Use:** Booking volume, conversion, and channel/source mix.

- **Conversations** — `GET /analytics/:propertyId/conversations`
  - **Display:** Total sessions; overTime (daily when `groupBy=day`); peak by hour (0–23); sessions per guest (one / two / three+ sessions).
  - **Use:** Conversation volume, busy hours, and repeat engagement.

- **Guests** — `GET /analytics/:propertyId/guests`
  - **Display:** New vs returning guests; top guests by booking count (table: name, phone, booking count; `topN` default 10, max 50); channel mix (whatsapp, sms, web).
  - **Use:** Guest acquisition, loyalty, and top bookers; optional `topN` control in UI.

---

## 7. Components & patterns

**Tables / lists**

- Header row: `--font-weight-semibold`, `--color-text-secondary` or primary; bottom border.
- Rows: min height for touch; hover background `--glass` or `--color-border-light` (subtle). Borders between rows or none; keep consistent.
- Empty state: Illustration or icon + short copy + optional action (e.g. “Adjust filters”).

**Filters**

- Chips for single/multi value (Status, Platform): use `.chip` and `.chip-active`; align with theme.
- Date range: two inputs or a small date-range component; use `--radius-md` and existing input styles.
- Search: single input with optional search icon; debounced.

**Modals / dialogs**

- Overlay: semi-transparent (e.g. `rgba(0,0,0,0.2)`); focus trap; Escape to close.
- Content: glass-panel, `--radius-xl`, `--shadow-lg`; title, body, actions (primary + secondary). Match spacing scale.

**Toasts / notifications**

- Success (e.g. “Password reset”): primary or success color.
- Error (e.g. “Invalid token”): use `--color-status-error-bg` and `--color-status-error-text`. Position: top-right or bottom-right; auto-dismiss or close button.

**Loading**

- Skeleton (`.skeleton`) for list and table rows, card content. No layout shift: reserve height.
- Button: “Signing in…” with disabled state (already in login).

**Errors**

- Inline: below form or section; use status error tokens; optional retry or link.
- 403/404 from API: clear message + action (e.g. “Back to list”, “Log in again”).

---

## 8. Responsive & accessibility

- **Breakpoints:** Define one or two (e.g. 768px, 1024px): sidebar collapse, stack filters, table → cards or horizontal scroll with care.
- **Touch:** Min touch target `--touch-target-min` (44px); spacing between tappable elements.
- **Keyboard:** Focus order logical; focus-visible ring (`--shadow-focus`); skip link to main content if needed.
- **Reduced motion:** Theme already disables transitions and skeleton animation when `prefers-reduced-motion: reduce`; ensure modals and drawer don’t rely on motion-only feedback.
- **Color:** Don’t rely on color alone for status (e.g. add “Active”/“Closed” text or icon with color).

---

## 9. Implementation order (after approval)

1. **Auth & shell**
   - Wire login to `POST /auth/login`; store token and user (including `propertyId`).
   - Add forgot-password and reset-password pages and API calls.
   - Implement app shell (sidebar + main), auth guard, and logo placement (light variant).
2. **Chat history**
   - List page with filters and `GET /api/chat/history`.
   - Thread page with `GET /api/chat/history/:sessionId/messages` and message layout.
3. **Bookings**
   - List with filters and pagination; `GET /bookings`.
4. **Documents**
   - List `GET /documents?propertyId=...`; replace flow with `PUT /documents/:id/replace`.
5. **Analytics (four views)**
   - Shared date-range control and Analytics shell (tabs or sub-nav). Messages: `GET /analytics/:propertyId/messages` (totals, by platform, by type, optional daily). Bookings: `GET /analytics/:propertyId/bookings` (totals, overTime, conversion, by platform/source, avg length of stay). Conversations: `GET /analytics/:propertyId/conversations` (total sessions, overTime, peak by hour, sessions per guest). Guests: `GET /analytics/:propertyId/guests` (new vs returning, top guests by booking count, channel mix; optional topN).
6. **Polish**
   - Empty states, error states, toasts, any remaining responsive and a11y tweaks.

---

## 10. Summary

- **Theme:** Use existing OrderlyAI tokens and components (glass, shadows, buttons, inputs, chips); extend with tables, modals, and layout only where needed.
- **Logo:** Light-background variant for login and app shell; consistent placement and size.
- **Visual:** Glass panels, token-based shadows, soft rounded surfaces (polymorphic-lite), subtle motion and skeleton loading.
- **Layout:** Centered auth screens; authenticated = sidebar + main content; optional top bar.
- **Features:** Login, Forgot/Reset password, Chat history (list + thread), Bookings, Documents, Analytics (Messages, Bookings, Conversations, Guests — four views with shared date range) — each mapped to the API spec and same design language.

Once this plan is approved, implementation can proceed in the order above (or in a different order if you prefer).
