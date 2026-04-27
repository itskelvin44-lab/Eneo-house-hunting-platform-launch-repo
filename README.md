Let me update the README to reflect the actual current state of the project — all the pivots, real tech choices, and progress.

Here's the updated README:

---

# ENEO — README (Updated)

```markdown
# Eneo — House Hunting, Simplified.

**Find your next home. No agents. No fees. Just direct calls.**

Eneo is a rental-focused web application built for Kenya. Single-page application. One account for everything — rent and post. No chat APIs. No middlemen. Phone-only communication. Free-tier-first architecture.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Features](#features)
3. [Tech Stack (Actual)](#tech-stack-actual)
4. [Architecture Overview](#architecture-overview)
5. [Application Modes](#application-modes)
6. [Location System](#location-system)
7. [Image Handling](#image-handling)
8. [Database Schema](#database-schema)
9. [Booking & 3-Day Auto-Removal](#booking--3-day-auto-removal)
10. [Ratings & Reviews System](#ratings--reviews-system)
11. [Blog System](#blog-system)
12. [Getting Started](#getting-started)
13. [Project Structure](#project-structure)
14. [Feature Flags](#feature-flags)
15. [Features Explicitly NOT Included](#features-explicitly-not-included)
16. [License](#license)

---

## Core Philosophy

- **One account for everything** — Every user can both rent and post properties. No separate roles.
- **Direct contact, always** — No in-app messaging. Tenants call landlords directly via `tel:` and `sms:` links.
- **Free-tier-first** — Supabase free PostgreSQL, Supabase Storage, Canvas API compression, Google Maps URL scheme. No API keys with billing.
- **Client-side processing preferred** — Image compression happens in the browser before upload.
- **Reputation over verification** — Trust emerges from real activity: ratings, reviews, response rates, completed bookings.

---

## Features

### For Tenants
- 🏠 Browse listings with swipeable photo galleries
- 🔍 Search & filter by price, beds, baths, county, furnishing, and "Near Me" GPS
- 🔖 Save properties & compare up to 3 side-by-side
- 🕐 Browsing history grouped by day
- 📋 My Bookings tab — view, rate, and remove bookings
- ⭐ Rate landlords after viewing — 5-star system with written reviews
- 📞 Book a viewing → get landlord's real phone number immediately
- 🏅 See landlord reputation: star rating, Trusted badge, response rate
- 🌙 Dark mode with system preference detection

### For Landlords
- 📝 Post properties in under a minute
- 📸 Client-side image compression to ~200KB via Canvas API (max 10 photos)
- 📍 GPS capture or manual coordinate entry
- 📋 My Listings dashboard — Active / Removed tabs
- 📞 See pending bookings with tenant name, phone, and Call button
- ⚠️ 3-day warning on listing cards
- 🗑️ Take Down, Restore, or Permanently Delete listings
- 🏅 Earn "Trusted Landlord" badge through real activity

### For Everyone
- 🔄 One account for renting & posting
- 🌐 Google Maps integration (no API key required)
- 📱 Fully responsive — desktop sidebar + mobile bottom nav
- 🔔 Notify Me alerts for saved searches
- 📖 Blog with 5 articles
- 🔒 EXIF data stripped from all uploaded photos

---

## Tech Stack (Actual)

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Frontend** | HTML, CSS, JavaScript (SPA) | Single index.html + styles.css + app.js |
| **Database** | PostgreSQL via Supabase | Free tier (500MB) |
| **Auth** | Supabase Auth | Email/password + Google OAuth |
| **Image Storage** | Supabase Storage | `property-photos` bucket (pivoted from Cloudflare R2 → Backblaze B2 → Supabase Storage) |
| **Image Compression** | Browser Canvas API | Max 1200px, JPEG 0.7, ~200KB target, EXIF stripping |
| **Maps** | Google Maps URL scheme | `google.com/maps/search/?api=1&query=lat,lng` — no API key |
| **Communication** | Phone calls / SMS | `tel:` and `sms:` links |
| **Hosting** | Static web server (Netlify) | `_redirects` for SPA routing |
| **Reverse Geocoding** | Nominatim (OpenStreetMap) | Free, no API key |

### Why Supabase Storage (not R2 or B2)?
Cloudflare R2 required a credit card. Backblaze B2 had CORS issues blocking browser uploads. Supabase Storage works out of the box — CORS pre-configured, same project as database and auth, free tier: 1GB file storage.

---

## Architecture Overview

Single-page application. Static HTML/CSS/JS shell loads once. Empty divs are dynamically filled with data from Supabase.

```
Browser → Static files → Supabase Auth login → Supabase DB queries → Dynamic card rendering
```

### URL Structure (History API)
| URL | Destination |
|-----|------------|
| `/feed` | Explore (default) |
| `/property/{id}` | Property detail panel |
| `/my-listings` | My Listings |
| `/saved` | Saved workspace |
| `/history` | Browsing history |
| `/account` | Account settings |

---

## Application Modes

### 1. Explore (Feed) — Default
- Time-aware greeting with real user name
- GPS reverse-geocoded location chip in topbar
- Search bar, Filters, Notify Me buttons
- Stats row: Listed Today, Near You, New This Hour, Response Rate (all real counts from DB)
- Featured Nearby horizontal scroll strip
- Property card grid with gallery dots, save toggle, beds/baths/area

### 2. My Listings (Posting Mode)
- **Tabs:** Active | Removed (Drafts removed in Progress 8)
- Each Active card shows: thumbnail, title, price, posted date, pending bookings with tenant phone + Call button, 3-day warning banner
- Actions: Edit, Take Down, Delete (with photo cleanup from Storage)
- Edit slides in same form panel pre-filled with existing data
- Restore button on Removed tab

### 3. Saved Workspace
- Bookmarked properties with checkbox selection
- Compare 2-3 properties in inline table (Price, Type, Beds, Baths, Area, Location)

### 4. History
- Auto-tracked property views, grouped by day
- Each entry: thumbnail, price, title, location, relative timestamp
- Remove individual or clear all (capped at 50)

### 5. My Bookings
- All bookings with status (Pending / Confirmed / Expired)
- Rate button → opens review form in detail panel
- Remove button to delete booking

### 6. Account
- Profile card with real data from DB
- Editable: Name, Phone, Email (with Supabase confirmation)
- Change Password (real Supabase reset email flow)
- Activity: My Listings, Saved Properties, Booking History counts
- Dark mode toggle (animated pill, localStorage)
- Danger Zone: Sign Out, Delete Account (30-day grace, cascading data removal)

---

## Location System

### GPS Capture (Primary)
`navigator.geolocation` → stores lat/lng → button shows "✓ Location captured"

### Manual Entry (Fallback)
Step-by-step modal: Open Google Maps → Right-click → "What's here?" → Copy coordinates → Paste → Validate format

### Display
`https://www.google.com/maps/search/?api=1&query={lat},{lng}` — opens in new tab/app

### "Near Me" Filter
Real GPS → Haversine formula filters properties within 5km

### Topbar Location Chip
Reverse geocoded via Nominatim API → shows "Neighbourhood, County"

---

## Image Handling

### Compression (Canvas API)
| Parameter | Value |
|-----------|-------|
| Target size | ~200 KB |
| Max dimension | 1200px |
| Format | JPEG |
| Quality | 0.7 |
| Memory guard | Rejects >12MP |
| EXIF | Automatically stripped |
| Max photos | 10 per listing |

### Upload Flow
1. Select photos → 2. Compress in browser (spinner per thumbnail) → 3. Upload to Supabase Storage → 4. Public URLs stored in `properties.photos` JSONB

### Rendering
- `object-fit: contain` on cards and detail gallery (full image visible, no cropping)
- Lightbox: fullscreen viewer with prev/next arrows and counter

---

## Database Schema

### Tables (All with RLS Policies)

| Table | Purpose |
|-------|---------|
| `public.users` | User profiles (name, phone, email, account_id) |
| `public.properties` | Listings (title, desc, price, beds, baths, area, lat, lng, photos, status, view_count) |
| `public.bookings` | Booking records (property_id, tenant_id, status, booked_at) |
| `public.saved_properties` | Saved/bookmarked properties (user_id, property_id) |
| `public.browsing_history` | Viewed properties (user_id, property_id, viewed_at) |
| `public.notify_alerts` | Saved search alerts |
| `public.reviews` | Landlord reviews (property_id, reviewer_id, landlord_id, stars, review_text) |

### Key SQL Functions
- `increment_view(prop_id)` — PostgreSQL stored procedure for view counting
- Haversine formula for distance-based queries

---

## Booking & 3-Day Auto-Removal

### Tenant Flow
Find property → View detail → Book → Get landlord's phone → Call/SMS

### Landlord Flow
My Listings → See pending booking with tenant name/phone → Tap Call → Arrange viewing

### 3-Day Rule (Changed from 24hr in Progress 8)
- Booking created with `status = pending`
- If landlord doesn't contact within 72 hours:
  - Property `status` → `removed`
  - Booking `status` → `expired`
  - Property disappears from Explore feed
- Landlord sees warning on listing card: "⚠️ If you don't contact the tenant within 3 days, this listing will be automatically removed."
- Check runs client-side on `renderFeed()`

---

## Ratings & Reviews System

### How It Works
- After booking, tenant can rate landlord (1-5 stars + written review)
- Reviews appear on property detail panel's landlord card
- Star picker with hover effects

### Trusted Landlord Badge
Awarded when: ≥3 reviews AND average ≥3.5 stars

### New Landlord Badge
Shown when thresholds not yet met: "🌱 New Landlord"

### Landlord Card Shows
- Name, initials, average star rating, review count
- Trusted/New badge
- Stats: Posted, Booked, Response Rate
- Activity: Views, Saves, Bookings (real counts from DB)
- Recent reviews with stars, text, author, date

---

## Blog System

5 blog posts in `/blog/` directory:

| File | Title |
|------|-------|
| `blog.html` | Blog index listing all posts |
| `blog/spot-good-landlord.html` | How to Spot a Good Landlord — Star Rating & Trusted Badge System |
| `blog/5-things-before-renting.html` | 5 Things to Check Before Renting a Property |
| `blog/3-day-rule.html` | Eneo's 3-Day Rule — How It Protects You |
| `blog/direct-contact.html` | Why Direct Contact Beats Middlemen Every Time |
| `blog/post-property-fast.html` | How to Post a Property That Gets Booked Fast |

All posts styled with Eneo design tokens, dark mode support, and global footer.

---

## Getting Started

### Prerequisites
- Supabase account (free tier)
- Supabase project with tables created
- Static hosting (Netlify recommended)

### Setup
1. Clone the repo
2. Update `js/config.js` with your Supabase URL and anon key
3. Ensure `storageBucket: 'property-photos'` bucket exists in Supabase
4. Deploy to Netlify (or any static host)

### Local Development
```bash
# Any static server works
npx serve .
# or
python -m http.server 8000
```

---

## Project Structure

```
eneo/
├── index.html                    # Main SPA (login + app screens, all modals, lightbox)
├── blog.html                     # Blog index page
├── _redirects                    # Netlify SPA routing (/* /index.html 200)
├── css/
│   └── styles.css               # All styles, dark mode, responsive, lightbox, star picker (~2500 lines)
├── js/
│   ├── config.js                # Supabase credentials, feature flags, storage bucket
│   └── app.js                   # All application logic (~2000+ lines)
└── blog/
    ├── spot-good-landlord.html
    ├── 5-things-before-renting.html
    ├── 3-day-rule.html
    ├── direct-contact.html
    └── post-property-fast.html
```

---

## Feature Flags

In `js/config.js`:

```javascript
const ENEO_CONFIG = {
  supabaseUrl: 'https://zkonxwgyyvmesmbclpvq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  useMockData: false,    // Real Supabase data
  useMockAuth: false,    // Real Supabase Auth
  useMockUpload: false,  // Real Supabase Storage uploads
  storageBucket: 'property-photos',
};
```

All flags are `false` — the app runs on real Supabase infrastructure.

---

## Features Explicitly NOT Included

- WhatsApp / Telegram API
- In-app chat / messaging
- Google Maps API (key-based)
- Separate tenant / landlord roles
- Automatic SMS/email notifications
- Payment processing
- Lease agreement signing
- Tenant screening / credit checks
- Document-based landlord verification
- Drafts feature (removed in Progress 8)

---

## Development History

| Phase | Date | What |
|-------|------|------|
| Phase 1 | April 2026 | File split — monolithic demo → index.html + styles.css + app.js |
| Phase 2 | April 2026 | Data layer, feature flags, Supabase client, Canvas compression |
| Phase 3 | April 2026 | Supabase project, tables, auth, seeded data, CORS fixes |
| Phase 4 | April 2026 | Saved/history/bookings tables, edit profile, delete account |
| Phase 5 | April 2026 | Stats row, Near Me filter, Change Password, location chip, greeting |
| Phase 6 | April 2026 | Remove Unsplash data, 10-photo limit, lightbox, Area field, Delete button |
| Phase 7 | April 2026 | Reviews system, My Bookings tab, notification bell |
| Phase 8 | April 2026 | Drafts removed, 24h→3-day rule, bookings on listing cards, blog created, Google OAuth, email change, password reset flow, global footer |
| Phase 9 | April 2026 | Footer placement fixes, opacity adjustments, README update |

---

## License

MIT License

---

**Eneo** — From a developer who believes in the ones building a life, one home at a time.
```

---

This README now reflects:
- Actual tech stack (Supabase Storage, not R2/B2)
- All pivots and decisions
- Current 6-mode navigation
- 3-day rule (not 24hr)
- Reviews system
- Blog system
- Project structure
- Development history