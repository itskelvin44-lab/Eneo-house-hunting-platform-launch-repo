/* ═══════════════════════════════════════════════
   ENEO — CONFIG.JS
   Service credentials and configuration
   ═══════════════════════════════════════════════ */

const ENEO_CONFIG = {
  // ── Supabase ─────────────────────────────────
  // Replace these with your actual Supabase project values
  // Found in: Supabase Dashboard → Settings → API
  supabaseUrl: 'https://YOUR-PROJECT-ID.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // anon/public key — safe for client-side

  // ── Cloudflare R2 ────────────────────────────
  // Replace when you've created your R2 bucket
  r2Endpoint: 'https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com',
  r2BucketName: 'eneo-photos',
  r2PublicUrl: 'https://pub-YOUR-HASH.r2.dev',
  r2AccessKeyId: 'YOUR_R2_ACCESS_KEY_ID',
  r2SecretAccessKey: 'YOUR_R2_SECRET_ACCESS_KEY',

  // ── Feature Flags ────────────────────────────
  // Toggle these to control fallback behavior
  useMockData: true,        // Set to false when Supabase tables are ready
  useMockAuth: true,        // Set to false when Supabase Auth is configured
  useMockUpload: true       // Set to false when R2 bucket is configured
};