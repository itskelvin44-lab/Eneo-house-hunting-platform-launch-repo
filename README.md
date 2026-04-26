# Eneo — House Hunting, Simplified.

**Find your next home. No fees. No agents. No chat APIs. Just homes.**

Eneo is a rental-focused web application built for Kenya. It strips away unnecessary complexity — no separate tenant and landlord roles, no expensive API keys, and no hidden costs. Anyone can post a property in under a minute. Anyone can browse, save, compare, and book viewings. Communication happens the simplest way possible: a phone call.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture Overview](#architecture-overview)
5. [Application Modes](#application-modes)
6. [Location System](#location-system)
7. [Image Handling](#image-handling)
8. [Database Schema](#database-schema)
9. [Booking & Auto-Removal](#booking--auto-removal)
10. [Reputation & Trust System](#reputation--trust-system)
11. [Revenue Model (Future)](#revenue-model-future)
12. [Getting Started](#getting-started)
13. [Project Structure](#project-structure)
14. [Browser Support](#browser-support)
15. [License](#license)

---

## Core Philosophy

### 1. Open Supply
Any person with a property can list it. No agent license required. No verification gate at entry. This maximizes inventory and makes the platform useful for all price ranges — from a KSh 8,000 bedsitter in Umoja to a KSh 150,000 townhouse in Karen.

### 2. Direct Contact
No in-app messaging. No middlemen. Tenants call landlords directly. The phone call is the verification layer — real human interaction filters out fraud better than any automated system.

### 3. Free for Everyone, Indefinitely
Browsing, saving, comparing, booking viewings, posting — all free. The platform grows by being genuinely useful, not by charging early adopters.

### 4. Reputation Over Verification
Instead of document uploads and manual approval, trust emerges from how users interact. Landlords who post accurate listings, answer calls, and complete viewings earn visible reputation. Bad actors sink to the bottom. The community self-regulates.

---

## Features

### For Tenants
- 🏠 **Browse listings** — Scroll through property cards with swipeable photo galleries
- 🔍 **Search & filter** — Search by neighborhood, filter by price range, bedrooms, bathrooms, and county
- 📍 **Location-aware** — Find properties near you with GPS-based filtering
- 🔖 **Save & compare** — Bookmark properties and compare up to 3 side-by-side
- 🕐 **Browsing history** — Automatically tracked, grouped by day, easily revisitable
- 📞 **Direct booking** — Request a viewing and get the landlord's phone number immediately
- ⭐ **Landlord reputation** — See ratings, reviews, and trust badges before you book
- 🌙 **Dark mode** — Full dark theme support with system preference detection

### For Landlords
- 📝 **Post properties** — Fill a simple form, add photos, capture location, go live instantly
- 📸 **Client-side image compression** — Photos automatically compressed to ~200KB using the browser's Canvas API
- 📍 **GPS or manual coordinates** — Capture location at the property or paste from Google Maps
- 📋 **Manage listings** — Track views, saves, bookings from a dedicated dashboard
- 📞 **Tenant contact** — See who booked, view their phone number, call directly
- 📊 **Booking management** — Active, draft, and removed listing tabs
- 🏅 **Build reputation** — Earn the "Trusted Landlord" badge through real activity

### For Everyone
- 🔄 **One account for everything** — Every user can both rent and post. No separate roles.
- 🌐 **Google Maps integration** — Open any property location with one click (no API key required)
- 📱 **Fully responsive** — Desktop sidebar + mobile bottom navigation
- 🔒 **Privacy-first** — EXIF data stripped from all uploaded photos automatically

---

## Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| **Frontend** | HTML, CSS, JavaScript (Single Page Application) | Free |
| **Database** | PostgreSQL via Supabase | Free tier (500MB) |
| **Image Storage** | Cloudflare R2 | Free tier (10GB, zero egress) |
| **Image Compression** | Browser Canvas API | Free (built into every browser) |
| **Maps** | Google Maps URL scheme | Free (no API key required) |
| **Authentication** | Supabase Auth | Free tier |
| **Communication** | Phone calls / SMS (tel: and sms: links) | Carrier rates only |
| **Hosting** | Static web server (any) | Free / low-cost |

### Why This Stack?

- **Zero API costs** — No Google Maps API key, no WhatsApp Business API, no chat SDKs
- **Client-side processing** — Images compressed in the browser before upload, saving bandwidth
- **Free tiers that last** — Supabase free tier never expires, Cloudflare R2 has no egress fees
- **Scales affordably** — Upgrade to Supabase Pro ($25/month) only when reaching ~500+ daily active users

---

## Architecture Overview

Eneo is a **single-page application (SPA)**. Everyone loads the same static HTML/CSS/JS shell from the server. Empty `div` containers are dynamically filled with data from Supabase. The History API enables clean URLs so the back button works and links are shareable.

### Data Flow

```
User visits URL
    ↓
Static HTML/CSS/JS served
    ↓
Login/signup via Supabase Auth
    ↓
SPA shell loads, empty containers ready
    ↓
Data fetched from Supabase PostgreSQL
    ↓
Cards rendered dynamically into containers
    ↓
User interacts → new data fetched → containers re-render
```

### URL Structure

| URL | Destination |
|-----|------------|
| `/feed` | Explore mode (default after login) |
| `/property/{id}` | Property detail panel |
| `/my-listings` | My Listings (Posting Mode) |
| `/saved` | Saved workspace |
| `/history` | Browsing history |
| `/account` | Account settings |

The browser back button is handled via `window.onpopstate`, which reads `event.state.mode` and re-renders the appropriate section without a page reload.

---

## Application Modes

### 1. Explore (Feed) — Default View

The main browsing experience for finding rental properties.

- **Greeting header** — "Good morning, Jane 👋" with serif headline
- **Search bar** — Full-text search across titles and locations
- **Stats row** — Listed Today, Near You, New This Hour, Response Rate
- **Featured strip** — Horizontally scrollable featured property cards
- **Property card grid** — Auto-fill CSS grid with comprehensive cards containing:
  - Swipeable photo galleries with dot indicators
  - Save/heart toggle
  - Price, title, location
  - Beds, baths, area stats
- **Filters modal** — County, price range (dual slider + manual inputs), bedrooms, bathrooms, furnishing
- **Notify Me modal** — Save search alerts with location, price, type, bedrooms, match sensitivity, and notification channel

### 2. My Listings (Posting Mode)

Manage properties and track booking requests.

**Tabs:**
- **Active** — Currently live listings with view/booking stats
- **Drafts** — Started but unpublished listings
- **Removed** — Taken down or auto-removed properties

**New Listing Form** — Slides in from the right:
- Section 1: Title, description
- Section 2: Bedrooms, bathrooms, price
- Section 3: Photo upload with Canvas compression
- Section 4: GPS capture or manual coordinate entry
- Section 5: Submit with full validation

### 3. Saved Workspace

Bookmarked properties with side-by-side comparison.

- Checkbox selection on each saved card
- Compare 2-3 properties in an inline comparison table
- Quick actions: View detail or Remove from saved

### 4. History

Automatically tracked browsing history grouped by day.

- Entries grouped under "Today", "Yesterday", or date labels
- Each entry shows thumbnail, price, title, location, and relative timestamp
- Click to re-open property detail
- Remove individual entries or clear all
- Capped at 50 entries

### 5. Account Settings

- **Profile card** — Avatar, name, email, account ID (copyable)
- **Settings panels** — Profile editing, security, activity overview, preferences
- **Dark mode toggle** — Animated pill switch, persisted to localStorage
- **Danger zone** — Sign out, delete account (with 30-day recovery window)

---

## Location System

### Capturing Coordinates During Posting

**Method 1: GPS (Primary)**
- Browser requests geolocation permission
- On success, latitude and longitude stored instantly
- Button changes to green "✓ Location captured" state
- Exact coordinates displayed beneath

**Method 2: Manual Entry (Fallback)**
- Step-by-step tutorial modal showing how to get coordinates from Google Maps
- "Right-click → What's here? → Copy numbers"
- Text input with format validation (e.g., `-1.286389, 36.817223`)
- Green checkmark on valid format

### Displaying Properties on Map

No Google Maps API key is used. When a tenant clicks "Open in Google Maps":

```
https://www.google.com/maps/search/?api=1&query={latitude},{longitude}
```

This opens Google Maps in a new tab (desktop) or the Google Maps app (mobile) with a red pin at the exact property location. No API key, no billing, no egress costs.

---

## Image Handling

### Client-Side Compression

All image processing happens in the browser before any upload using the Canvas API (built into every browser — not OpenAI Canvas or Canva).

| Parameter | Value |
|-----------|-------|
| Target size | ~200 KB per photo |
| Max dimension | 1200px (width or height) |
| Format | JPEG |
| Quality | 0.7 (0–1 scale) |
| Memory guard | Rejects images >12 megapixels |
| EXIF stripping | Automatic (canvas.toBlob() creates new file) |

### Upload Flow

1. User selects photo(s) from gallery/camera
2. JavaScript reads file (still in browser, no upload yet)
3. Canvas resizes to max 1200px, compresses to JPEG quality 0.7
4. 72×72px thumbnail preview appears with × removal button
5. Spinner overlay while compression runs
6. On submit → uploads to Cloudflare R2 → permanent URLs stored in database
7. Text displays: "Photos compressed to ~200KB each for fast loading"

### Cloud Storage — Cloudflare R2

| Metric | Free Tier |
|--------|-----------|
| Storage | 10 GB |
| Egress fees | Zero |
| Write/delete ops | 1 million/month |
| What's stored | Compressed photos only (~200KB each) |

**Capacity estimate:** ~2,500 properties before reaching 10GB (20 photos × 200KB = 4MB per property).

---

## Database Schema

### Properties Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Primary Key | Auto-generated |
| `landlord_id` | FK → users | Property owner |
| `title` | Text | Listing title |
| `description` | Text | Full description |
| `property_type` | Enum | apartment, house, condo, studio, townhouse |
| `bedrooms` | Integer | Number of bedrooms |
| `bathrooms` | Decimal | e.g., 1.5 |
| `price` | Integer | Monthly rent (KSh) |
| `latitude` | Decimal | Up to 8 decimal places |
| `longitude` | Decimal | Up to 8 decimal places |
| `photos` | JSON Array | Cloudflare R2 URLs |
| `status` | Enum | active, removed, draft |
| `removed_reason` | Text | 24hr_booking_no_contact, landlord_manually_removed |
| `created_at` | Timestamp | When posted |

### Bookings Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Primary Key | Auto-generated |
| `property_id` | FK → properties | Booked property |
| `tenant_id` | FK → users | Who booked |
| `booked_at` | Timestamp | When booked |
| `status` | Enum | pending, confirmed, expired |

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Primary Key | Auto-generated |
| `email` | Text | Unique |
| `hashed_password` | Text | Via Supabase Auth |
| `name` | Text | Display name |
| `phone` | Text | Optional — shown to tenants who book |
| `account_id` | Text | Immutable unique ID (e.g., usr_abc123xyz) |
| `created_at` | Timestamp | Account creation |

### Spatial Queries

Properties within 5km of the user's position are found using the Haversine formula in SQL:

```sql
SELECT *,
  (6371 * acos(
    cos(radians(user_latitude)) *
    cos(radians(latitude)) *
    cos(radians(longitude) - radians(user_longitude)) +
    sin(radians(user_latitude)) *
    sin(radians(latitude))
  )) AS distance_km
FROM properties
WHERE status = 'active'
HAVING distance_km < 5
ORDER BY distance_km;
```

---

## Booking & Auto-Removal

### Tenant Booking Flow

1. Tenant finds property in Explore
2. Clicks card → detail panel opens
3. Reviews photos, description, landlord reputation
4. Taps "Book a Viewing"
5. Booking record created: `property_id`, `tenant_id`, `booked_at`, `status = pending`
6. Toast: "Booking requested! Landlord will see this."
7. Contact section reveals: landlord's phone number, "Call Now", "Send SMS"

### Landlord Response

1. Landlord navigates to My Listings → Active tab
2. Sees pending booking with tenant name and phone
3. Taps "Call" → phone dialer opens with tenant's number
4. Arranges viewing via phone call

### The 24-Hour Rule

When a property receives a booking, a clock starts. If the landlord has not made contact within 24 hours:

- **Trigger:** `booking.status = pending` AND `booked_at < (now - 24 hours)`
- **Effect:** Property status → `removed`, reason: `24hr_booking_no_contact`
- **Visibility:** Property disappears from Explore feed immediately
- **Recovery:** Landlord sees it in My Listings → Removed tab

This keeps the feed fresh and ensures landlords remain responsive.

---

## Reputation & Trust System

### The Problem

Kenya's rental market has a trust crisis. Over 70% of online listings lack verified ownership. Common problems include fake listings with stolen photos, bait-and-switch, unresponsive landlords, and deposit scams.

### Eneo's Approach: Activity-Based Reputation

**No document verification. No manual approval. Trust emerges from behavior.**

### Reputation Signals

| Signal | What It Measures | Weight |
|--------|-----------------|--------|
| Profile views | People viewing landlord's other listings | 5% |
| Property detail clicks | Full detail panel opens | 10% |
| Saves/bookmarks | Saved to workspace | 15% |
| Booking requests | Viewing requests received | 25% |
| Completed viewings | Confirmed viewings that happened | 30% |
| Tenant ratings | Star rating + written review | 30% |
| Response rate | % of booking requests answered | 10% |
| Account age | Time on platform | 5% |

### The "Trusted Landlord" Badge

Awarded automatically when an account meets ALL of:

| Threshold | Requirement |
|-----------|------------|
| Completed bookings | 5+ confirmed viewings |
| Average rating | 4.0 stars or above |
| Response rate | 80% or above |
| Account age | 30 days or more |

Accounts that don't yet qualify show: **🌱 New Landlord · Building reputation**

### How Fraud Dies Naturally

| Bad Behavior | Reputation Consequence |
|-------------|----------------------|
| Fake listing (stolen photos) | 0 bookings, 0 saves → never appears in search |
| Landlord never answers calls | Response rate drops below 80% → loses Trusted badge |
| Misleading description | 1-star rating → affects ALL their listings |
| Bait-and-switch | Bad review is public and permanent |
| Spam posts | Low engagement → algorithm deprioritizes |
| Scammer asking for deposit | No completed viewing → account stays "Unrated" |

---

## Revenue Model (Future)

**"Pay for Time, Nothing Else"**

| What | Cost |
|------|------|
| Post a property | Free (3 days) |
| Browse listings | Free forever |
| Save properties | Free forever |
| Book viewings | Free forever |
| Contact landlords | Free forever |
| Extend listing beyond 3 days | KSh 200/week, KSh 350/2 weeks, KSh 600/month |

**When to activate:** Only when the platform has critical mass — measured by daily active tenants and landlords reporting fast rentals. Before that, Eneo is entirely free.

---

## Getting Started

### Prerequisites

- A Supabase account (free tier)
- A Cloudflare R2 bucket (free tier)
- A static web hosting service (Netlify, Vercel, GitHub Pages, etc.)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/eneo.git
   cd eneo
   ```

2. **Configure Supabase**
   - Create a new Supabase project
   - Set up the database tables as described in [Database Schema](#database-schema)
   - Enable Supabase Auth (email/password)
   - Copy your Supabase URL and anon key

3. **Configure Cloudflare R2**
   - Create an R2 bucket
   - Generate API tokens with read/write access
   - Note your bucket endpoint URL

4. **Update configuration**
   ```javascript
   // config.js
   const SUPABASE_URL = 'your-supabase-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   const R2_ENDPOINT = 'your-r2-endpoint';
   ```

5. **Deploy**
   - Upload all files to your static hosting service
   - Or run locally with any static file server:
     ```bash
     npx serve .
     ```

### Local Development

Since Eneo is a static SPA, you can develop with any local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Open `http://localhost:8000` in your browser.

---

## Project Structure

```
eneo/
├── index.html              # Main application file (SPA shell + all HTML)
├── config.js               # Supabase & R2 configuration
├── assets/
│   └── icons/             # App icons and favicon
├── styles/                # (Consolidated into index.html <style>)
├── scripts/               # (Consolidated into index.html <script>)
└── README.md              # This file
```

The entire application is contained in `index.html`:
- All HTML markup for login screen, app shell, modals, and panels
- All CSS styles (including dark mode variables) in `<style>` tags
- All JavaScript functionality in `<script>` tags

This monolithic structure is intentional for a single-page application — it eliminates HTTP request overhead and simplifies deployment.

---

## Browser Support

Eneo works on all modern browsers:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome for Android

**Required browser features:**
- CSS Custom Properties (for theming)
- Canvas API (for image compression)
- Geolocation API (for GPS capture)
- Fetch API (for API calls)
- CSS Grid & Flexbox (for layout)

---

## Features Explicitly NOT Included

- WhatsApp/Telegram API integration
- In-app chat/messaging system
- Google Maps API (key-based)
- Separate tenant/landlord roles
- Automatic SMS/email notifications
- Payment processing
- Lease agreement signing
- Tenant screening/credit checks
- Landlord verification badges (beyond activity-based Trusted badge)

---

## License

MIT License — see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Playfair Display** — Serif typeface by Claus Eggers Sørensen
- **Outfit** — Sans-serif typeface by Smartsheet Inc.
- **Unsplash** — Demo property photos
- **Supabase** — Backend infrastructure
- **Cloudflare** — Image storage infrastructure

---

**Eneo** — Your next home is already waiting. No fees. No chat APIs. Just homes.
