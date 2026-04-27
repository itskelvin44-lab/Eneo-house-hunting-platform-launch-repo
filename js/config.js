/* ═══════════════════════════════════════════════
   ENEO — CONFIG.JS
   Service credentials and configuration
   ═══════════════════════════════════════════════ */

const ENEO_CONFIG = {
  // ── Supabase ─────────────────────────────────
  supabaseUrl: 'https://zkonxwgyyvmesmbclpvq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprb254d2d5eXZtZXNtYmNscHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDA2MjUsImV4cCI6MjA5Mjc3NjYyNX0.yQEz65JZJORHYCS4kn3k1M-KDcA1DEWzKuU6Ufx9-8I',

  // ── Feature Flags ────────────────────────────
  useMockData: false,
  useMockAuth: false,
  useMockUpload: false,

  // ── Supabase Storage ──────────────────────
  storageBucket: 'property-photos',
};