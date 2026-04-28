// ═══ SUPABASE CLIENT INITIALIZATION ══════════════

let supabaseClient = null;

function initSupabase() {
  if (!ENEO_CONFIG.useMockData || !ENEO_CONFIG.useMockAuth) {
    if (ENEO_CONFIG.supabaseUrl.includes('YOUR-PROJECT-ID')) {
      console.warn('⚠️ Supabase not configured — using mock mode. Update js/config.js with your project URL and anon key.');
      return null;
    }
    supabaseClient = window.supabase.createClient(ENEO_CONFIG.supabaseUrl, ENEO_CONFIG.supabaseAnonKey);
    console.log('✅ Supabase client initialized');
    return supabaseClient;
  }
  console.log('📦 Running in mock mode');
  return null;
}

// Initialize on load
supabaseClient = initSupabase();

// Check for existing session on page load (handles OAuth redirect back)
(async function checkExistingSession() {
  try {
    if (!supabaseClient) return;
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !session) {
      console.warn('⚠️ No valid session — forcing login screen');
      try { await supabaseClient.auth.signOut(); } catch (e) { /* ignore */ }
      localStorage.removeItem('eneo-saved');
      localStorage.removeItem('eneo-location');
      document.getElementById('login-screen').classList.add('active');
      document.getElementById('app-screen').classList.remove('active');
      return;
    }
    // Valid session — ensure public.users row exists for OAuth users
    const { data: profile } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();
    if (!profile) {
      await supabaseClient.from('users').insert({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || '',
        phone: session.user.user_metadata?.phone || '',
        account_id: 'usr_' + session.user.id.substring(0, 10)
      });
    }
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    renderFeed();
    updateSavedCountBadge();
    renderAccount();
    loadSavedFromDB();
    loadHistoryFromDB();
    loadAlertsFromDB();
  } catch (e) {
    console.warn('Session check failed, showing login screen');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('app-screen').classList.remove('active');
  }
})();

// ═══ DATA LAYER ═══════════════════════════════════

// ═══ MOCK DATA ═══════════════════════════════════

const MOCK_PROPS = [];

// ── Data Access Functions ────────────────────────

async function fetchProperties(filters = {}) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    let results = [...MOCK_PROPS];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p => p.title.toLowerCase().includes(q) || p.loc.toLowerCase().includes(q));
    }
    if (filters.minPrice) results = results.filter(p => parseInt(p.price.replace(/[^0-9]/g, '')) >= filters.minPrice);
    if (filters.maxPrice) results = results.filter(p => parseInt(p.price.replace(/[^0-9]/g, '')) <= filters.maxPrice);
    if (filters.beds && filters.beds !== 'Any') {
      if (filters.beds === 'Studio') results = results.filter(p => p.beds === 0);
      else if (filters.beds === '4+') results = results.filter(p => p.beds >= 4);
      else results = results.filter(p => p.beds === parseInt(filters.beds));
    }
    if (filters.baths && filters.baths !== 'Any') {
      if (filters.baths === '3+') results = results.filter(p => p.baths >= 3);
      else results = results.filter(p => p.baths === parseFloat(filters.baths));
    }
    if (filters.county && filters.county !== 'any') {
      results = results.filter(p => p.county && p.county.toLowerCase() === filters.county.toLowerCase());
    }
    return { data: results, error: null };
  }

  let query = supabaseClient.from('properties').select('*').eq('status', 'active');
  if (filters.search) query = query.or(`title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  if (filters.minPrice) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
  if (filters.beds && filters.beds !== 'Any') {
    if (filters.beds === 'Studio') query = query.eq('bedrooms', 0);
    else if (filters.beds === '4+') query = query.gte('bedrooms', 4);
    else query = query.eq('bedrooms', parseInt(filters.beds));
  }
  if (filters.baths && filters.baths !== 'Any') {
    if (filters.baths === '3+') query = query.gte('baths', 3);
    else query = query.eq('baths', parseFloat(filters.baths));
  }
  if (filters.county && filters.county !== 'any') {
    query = query.eq('county', filters.county);
  }
  query = query.order('created_at', { ascending: false });
  return await query;
}


async function fetchStatsData(userLat, userLng) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    return {
      listedToday: 0,
      nearYou: 0,
      newThisHour: 0,
      responseRate: '-'
    };
  }

  // Listed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: listedToday } = await supabaseClient
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', today.toISOString());

  // New this hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const { count: newThisHour } = await supabaseClient
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', oneHourAgo.toISOString());

  // Near you (within 5km)
  let nearYou = 0;
  if (userLat && userLng) {
    const { data: nearby, error } = await supabaseClient
      .from('properties')
      .select('id, latitude, longitude')
      .eq('status', 'active');
    if (!error && nearby) {
      nearYou = nearby.filter(p => {
        const d = getDistance(userLat, userLng, p.latitude, p.longitude);
        return d <= 5;
      }).length;
    }
  }

  // Response rate
  const { data: bookings } = await supabaseClient
    .from('bookings')
    .select('status');

  let responseRate = '—';
  if (bookings && bookings.length > 0) {
    const contacted = bookings.filter(b => b.status === 'confirmed').length;
    responseRate = Math.round((contacted / bookings.length) * 100) + '%';
  }

  return { listedToday: listedToday || 0, nearYou, newThisHour: newThisHour || 0, responseRate };
}

async function incrementViewCount(propertyId) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) return;
  const { error } = await supabaseClient.rpc('increment_view', { prop_id: propertyId });
  if (error) {
    // Fallback: do it manually if RPC fails
    const { data: prop } = await supabaseClient.from('properties').select('view_count').eq('id', propertyId).single();
    if (prop) {
      await supabaseClient.from('properties').update({ view_count: (prop.view_count || 0) + 1 }).eq('id', propertyId);
    }
  }
}

// Haversine helper
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchPropertyById(id) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    const prop = MOCK_PROPS.find(p => p.id === id);
    return { data: prop || null, error: prop ? null : 'Not found' };
  }
  return await supabaseClient.from('properties').select('*').eq('id', id).single();
}

async function fetchMyProperties() {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    return { data: MOCK_PROPS.slice(0, 2), error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: [], error: 'Not authenticated' };
  return await supabaseClient.from('properties').select('*').eq('landlord_id', user.id).eq('status', 'active').order('created_at', { ascending: false });
}

// ═══ SAVED PROPERTIES DATA ═══

async function fetchSavedProperties() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) return { data: [], error: null };
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: [], error: null };
  return await supabaseClient.from('saved_properties').select('property_id').eq('user_id', user.id);
}

async function savePropertyToDB(propertyId) {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) return { error: null };
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  return await supabaseClient.from('saved_properties').upsert({
    user_id: user.id,
    property_id: propertyId
  }, { onConflict: 'user_id, property_id' });
}

async function unsavePropertyFromDB(propertyId) {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) return { error: null };
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  return await supabaseClient.from('saved_properties').delete().eq('user_id', user.id).eq('property_id', propertyId);
}

// ═══ BROWSING HISTORY DATA ═══

async function saveHistoryToDB(propertyId) {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) return { error: null };
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  return await supabaseClient.from('browsing_history').insert({
    user_id: user.id,
    property_id: propertyId
  });
}

async function fetchBrowsingHistory() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) return { data: [], error: null };
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: [], error: null };
  return await supabaseClient.from('browsing_history').select('property_id, viewed_at').eq('user_id', user.id).order('viewed_at', { ascending: false }).limit(50);
}
async function submitReview(reviewData) {
  if (ENEO_CONFIG.useMockData || !supabaseClient || ENEO_CONFIG.useMockAuth) {
    return { data: { id: Date.now() }, error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  return await supabaseClient.from('reviews').insert({
    property_id: reviewData.propertyId,
    reviewer_id: user.id,
    landlord_id: reviewData.landlordId,
    stars: reviewData.stars,
    review_text: reviewData.reviewText
  });
}

async function fetchReviewsForLandlord(landlordId) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    return { data: [], error: null };
  }
  return await supabaseClient
    .from('reviews')
    .select('*, reviewer:reviewer_id(name)')
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });
}
async function clearHistoryInDB() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) return { error: null };
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  return await supabaseClient.from('browsing_history').delete().eq('user_id', user.id);
}

// Take down a property
async function takeDownProperty(propertyId) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) return { data: null, error: null };
  return await supabaseClient.from('properties').update({ status: 'removed' }).eq('id', propertyId);
}

async function doTakeDown(propId) {
  if (!confirm('Take down this listing? It will no longer appear in Explore.')) return;
  const { error } = await takeDownProperty(propId);
  if (error) {
    toast('Failed to take down. Try again.', 'err');
    return;
  }
  toast('✅ Property taken down', 'ok');
  renderPosting();
  renderFeed();
}
async function doDeleteProperty(propId) {
  if (!confirm('Permanently delete this property? This cannot be undone.')) return;

  // Get photos to delete from storage
  const { data: prop } = await supabaseClient.from('properties').select('photos').eq('id', propId).single();
  if (prop && prop.photos && prop.photos.length) {
    const photos = Array.isArray(prop.photos) ? prop.photos : JSON.parse(prop.photos);
    console.log('🗑️ Deleting ' + photos.length + ' photos from storage...');
    for (const url of photos) {
      const path = url.split('/').pop();
      console.log('  Removing: properties/' + path);
      if (path) {
        const { error: removeError } = await supabaseClient.storage.from(ENEO_CONFIG.storageBucket).remove(['properties/' + path]);
        console.log('  Result:', removeError || '✅ Deleted');
      }
    }
  } else {
    console.log('⚠️ No photos found to delete');
  }

  const { error } = await supabaseClient.from('properties').delete().eq('id', propId);
  if (error) {
    toast('Failed to delete. Try again.', 'err');
    return;
  }
  toast('🗑️ Property permanently deleted', 'ok');
  renderPosting();
  renderFeed();
}

// Create a booking
async function createBooking(propertyId) {
  if (ENEO_CONFIG.useMockData || !supabaseClient || ENEO_CONFIG.useMockAuth) {
    return { data: { id: Date.now() }, error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  // Fetch tenant's own profile (RLS allows reading own row)
  const { data: profile } = await supabaseClient
    .from('users')
    .select('name, phone')
    .eq('id', user.id)
    .single();

  return await supabaseClient.from('bookings').insert({
    property_id: propertyId,
    tenant_id: user.id,
    tenant_name: profile?.name || '',
    tenant_phone: profile?.phone || '',
    status: 'pending'
  });
}

// Save a notification alert
async function saveAlert(alertData) {
  if (ENEO_CONFIG.useMockData || !supabaseClient || ENEO_CONFIG.useMockAuth) {
    return { data: { id: Date.now() }, error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  return await supabaseClient.from('notify_alerts').insert({
    ...alertData,
    user_id: user.id
  });
}

async function fetchAlerts() {
  if (ENEO_CONFIG.useMockData || !supabaseClient || ENEO_CONFIG.useMockAuth) {
    return { data: [], error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: [], error: 'Not authenticated' };
  return await supabaseClient.from('notify_alerts').select('*').eq('user_id', user.id);
}

// Sign up
async function signUp(email, password, name, phone) {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { data: { user: { id: 'mock-user-id', email } }, error: null };
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, phone } }
  });

  if (error) {
    // If user already exists, suggest signing in
    if (error.message && error.message.includes('already registered')) {
      return { data: null, error: { message: 'An account with this email already exists. Please sign in instead.' } };
    }
    return { data: null, error };
  }

  if (data.user) {
    const accountId = 'usr_' + data.user.id.substring(0, 10);
    // Insert into public.users — ignore if already exists (edge case)
    const { error: insertError } = await supabaseClient.from('users').insert({
      id: data.user.id,
      email: email,
      name: name,
      phone: phone,
      account_id: accountId
    });

    // If duplicate, it's okay — user already has a profile
    if (insertError && insertError.code !== '23505') {
      // 23505 is unique violation, which we ignore
      console.warn('⚠️ Could not insert user profile:', insertError);
    }
  }

  return { data, error: null };
}

async function signIn(email, password) {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { data: { user: { id: 'mock-user-id', email } }, error: null };
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return { data: null, error };
  const { data: profile } = await supabaseClient.from('users').select('*').eq('id', data.user.id).single();
  if (!profile) {
    await supabaseClient.from('users').insert({
      id: data.user.id,
      email: email,
      name: data.user.user_metadata?.full_name || '',
      phone: data.user.user_metadata?.phone || '',
      account_id: 'usr_' + data.user.id.substring(0, 10)
    });
  }
  return { data, error: null };
}

async function signOut() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) return { error: null };
  return await supabaseClient.auth.signOut();
}

async function getCurrentUser() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { user: { id: 'mock-user-id', email: 'jane.mwangi@gmail.com', user_metadata: { full_name: 'Jane Mwangi', phone: '+254 712 345 678' } } };
  }
  const { data } = await supabaseClient.auth.getUser();
  return data;
}

async function getUserProfile() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { data: { account_id: 'usr_abc123xyz', name: 'Jane Mwangi', phone: '+254 712 345 678' }, error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };
  return await supabaseClient.from('users').select('*').eq('id', user.id).single();
}

// ═══ COMPATIBILITY ALIAS ══════════════════════════


// ═══ APPLICATION STATE ════════════════════════════

let curProp = null;
let booked = false;
let photosAdded = false;
let locDone = false;
let photoFiles = [];
let savedProps = JSON.parse(localStorage.getItem('eneo-saved') || '[]');
let overlayCount = 0;
let browsingHistory = [];
let notifyAlerts = [];
let nearMeActive = false;
let _tt;

// ═══ OVERLAY BODY SCROLL LOCK ════════════════════

function overlayOpened() {
  overlayCount++;
  document.body.style.overflow = 'hidden';
}

function overlayClosed() {
  overlayCount--;
  if (overlayCount <= 0) {
    overlayCount = 0;
    document.body.style.overflow = '';
  }
}

// ═══ AUTH ══════════════════════════════════════════
function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈';
  } else {
    input.type = 'password';
    icon.textContent = '👁';
  }
}

function authSwitch(t, el) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('form-in').style.display = t === 'in' ? '' : 'none';
  document.getElementById('form-up').style.display = t === 'up' ? '' : 'none';
}

// ═══ DARK MODE ══════════════════════════════════════

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('eneo-dark', isDark ? '1' : '0');
  updateDarkUI(isDark);
  toast(isDark ? '🌙 Dark mode on' : '☀️ Light mode on', 'ok');
}

function updateDarkUI(isDark) {
  const label = document.getElementById('dm-label');
  const thumb = document.getElementById('dm-thumb');
  const icon = document.getElementById('dm-icon');
  if (label) label.textContent = isDark ? 'Currently dark' : 'Currently light';
  if (thumb) thumb.textContent = isDark ? '☀️' : '🌙';
  if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

(function initDarkMode() {
  const saved = localStorage.getItem('eneo-dark');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved !== null ? saved === '1' : prefersDark;
  if (isDark) document.documentElement.classList.add('dark');
  updateDarkUI(isDark);
})();

// Handle password reset when user returns from email link
(function handleResetFlow() {
  if (window.location.search.includes('reset=true')) {
    const newPassword = prompt('Enter your new password (min 6 characters):');
    if (newPassword && newPassword.length >= 6) {
      supabaseClient.auth.updateUser({ password: newPassword }).then(({ error }) => {
        if (error) {
          alert('Failed. ' + error.message);
        } else {
          alert('✅ Password updated! Sign in with your new password.');
          window.location.href = window.location.origin;
        }
      });
    }
  }
})();

// ═══ LOGIN / LOGOUT ════════════════════════════════

async function doLogin(btn) {
  btn.innerHTML = '<span class="spin"></span> Signing in...';
  btn.disabled = true;

  const isSignIn = document.getElementById('form-in').style.display !== 'none';
  
  const formId = isSignIn ? 'form-in' : 'form-up';
  const form = document.getElementById(formId);
  if (!form) {
    toast('Form not found. Please refresh.', 'err');
    btn.innerHTML = isSignIn ? 'Sign In →' : 'Create Account →';
    btn.disabled = false;
    return;
  }
  const emailInput = form.querySelector('input[type="email"]');
  const passwordInput = form.querySelector('input[type="password"]');
  if (!emailInput || !passwordInput) {
    toast('Form error. Please refresh the page.', 'err');
    btn.innerHTML = isSignIn ? 'Sign In →' : 'Create Account →';
    btn.disabled = false;
    return;
  }
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    toast('Please fill in all fields', 'err');
    btn.innerHTML = isSignIn ? 'Sign In →' : 'Create Account →';
    btn.disabled = false;
    return;
  }

  let result;
  if (isSignIn) {
    result = await signIn(email, password);
  } else {
    const name = form.querySelector('input[type="text"]')?.value || '';
    const phone = form.querySelector('input[type="tel"]')?.value || '';
    result = await signUp(email, password, name, phone);
  }

  if (result.error) {
    toast('Incorrect email or password. Please try again.', 'err');
    btn.innerHTML = isSignIn ? 'Sign In →' : 'Create Account →';
    btn.disabled = false;
    return;
  }
  if (result.error) {
    toast('Incorrect email or password. Please try again.', 'err');
    btn.innerHTML = isSignIn ? 'Sign In →' : 'Create Account →';
    btn.disabled = false;
    return;
  }

  // ADD THIS BLOCK RIGHT HERE
  if (!result.data || !result.data.user) {
    toast('Login failed. Please try again.', 'err');
    btn.innerHTML = isSignIn ? 'Sign In →' : 'Create Account →';
    btn.disabled = false;
    return;
  }
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  renderFeed();
  updateSavedCountBadge();
  renderAccount();
  loadSavedFromDB();
  loadHistoryFromDB();
  loadAlertsFromDB();
  toast('Welcome to Eneo! 👋', 'ok');
}

async function doLogout() {
  await signOut();
  savedProps = [];
  browsingHistory = [];
  notifyAlerts = [];
  localStorage.clear();
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  updateSavedCountBadge();
  toast('Signed out', 'ok');
}

// ═══ NAVIGATION ═══════════════════════════════════

function switchNav(m) {
  const modes = ['feed', 'posting', 'saved', 'history', 'bookings', 'account'];
  modes.forEach(k => {
    const page = document.getElementById('p-' + k);
    if (page) page.style.display = k === m ? '' : 'none';
    const snav = document.getElementById('snav-' + k);
    if (snav) snav.classList.toggle('active', k === m);
    const mb = document.getElementById('mbnav-' + k);
    if (mb) mb.classList.toggle('active', k === m);
  });

  const titles = {
    feed: 'Explore Listings',
    posting: 'My Listings',
    saved: 'Saved Properties',
    history: 'Browsing History',
    bookings: 'My Bookings',
    account: 'Account Settings'
  };
  document.getElementById('topbar-title').textContent = titles[m];

  const act = document.getElementById('topbar-actions');
  if (m === 'feed') {
    act.innerHTML = `<div class="tbar-chip" id="tbar-location" onclick="refreshLocationChip()">📍 Detect location...</div><button class="tbar-icon-btn" onclick="checkNotificationCount()">🔔</button>`;
    updateLocationChip();
  } else if (m === 'posting') {
    act.innerHTML = `<button class="new-post-btn" style="font-size:13px;padding:9px 16px;" onclick="openPostForm()">+ New Listing</button>`;
  } else if (m === 'saved') {
    act.innerHTML = `<button class="tbar-icon-btn" onclick="switchNav('feed')" title="Browse">🏠</button>`;
    renderSavedWorkspace();
  } else if (m === 'history') {
    act.innerHTML = `<button class="tbar-icon-btn" onclick="switchNav('feed')" title="Browse">🏠</button>`;
    renderHistory();
  } else if (m === 'bookings') {
    act.innerHTML = `<button class="tbar-icon-btn" onclick="switchNav('feed')" title="Browse">🏠</button>`;
    renderBookings();
  } else {
    act.innerHTML = '';
  }

  if (m === 'feed') renderFeed();
  if (m === 'posting') renderPosting();
  if (m === 'saved') renderSavedWorkspace();
  if (m === 'history') renderHistory();
  if (m === 'account') renderAccount();
  if (m === 'bookings') renderBookings();

  document.getElementById('content-area').scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══ RENDER FEED ═══════════════════════════════════

async function renderFeed() {
  const { data: properties, error } = await fetchProperties();
  // Auto-remove properties with expired pending bookings (3-day rule)
  const now = new Date();
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  const { data: expiredBookings } = await supabaseClient
    .from('bookings')
    .select('property_id')
    .eq('status', 'pending')
    .lt('booked_at', seventyTwoHoursAgo);

  if (expiredBookings && expiredBookings.length > 0) {
    const expiredIds = [...new Set(expiredBookings.map(b => b.property_id))];
    await supabaseClient
      .from('properties')
      .update({ status: 'removed' })
      .in('id', expiredIds)
      .eq('status', 'active');

    await supabaseClient
      .from('bookings')
      .update({ status: 'expired' })
      .in('property_id', expiredIds)
      .eq('status', 'pending');
  }
  if (error || !properties || properties.length === 0) {
    console.warn('Fetch failed, using PROPS fallback');
  }

  const props = (properties && properties.length ? properties : []).map(p => ({
    ...p,
    beds: p.bedrooms ?? p.beds ?? 0,
    baths: p.baths ?? 1,
    type: p.property_type ?? p.type ?? 'Apartment',
    loc: p.location ?? p.loc ?? '',
    area: p.area ?? 'N/A',
    isNew: p.isNew ?? false,
    photos: Array.isArray(p.photos) ? p.photos : (typeof p.photos === 'string' ? JSON.parse(p.photos) : []),
    price: typeof p.price === 'number' ? `KSh ${p.price.toLocaleString()}` : p.price,
    landlord: p.landlord ?? { name: 'Landlord', initials: 'LL', rating: 0, totalRatings: 0, isTrusted: false, totalPosted: 0, totalBooked: 0, responseRate: 0, reviews: [] },
    activity: p.activity ?? { views: 0, saves: 0, bookings: 0 }
  }));
  // Fetch real stats
  let userLat = null, userLng = null;
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 300000 });
      });
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
    } catch (e) {
      // Silent fail — nearYou will be 0
    }
  }
  const stats = await fetchStatsData(userLat, userLng);
  // Update greeting with real name + time-aware salutation
  const { data: { user } } = await supabaseClient.auth.getUser();
  const { data: profile } = user ? await supabaseClient.from('users').select('name').eq('id', user.id).single() : { data: null };
  const greeting = document.getElementById('feed-greeting');
  if (greeting) {
    const firstName = (profile?.name || 'there').split(' ')[0];
    const hour = new Date().getHours();
    let salutation = 'Good evening';
    if (hour < 12) salutation = 'Good morning';
    else if (hour < 17) salutation = 'Good afternoon';
    greeting.textContent = `${salutation}, ${firstName} 👋`;
  }

  // Update stat cards
  const statVals = document.querySelectorAll('.stat-val');
  if (statVals.length >= 1) statVals[0].textContent = stats.listedToday;
  if (statVals.length >= 2) statVals[1].textContent = stats.nearYou;
  if (statVals.length >= 3) statVals[2].textContent = stats.newThisHour;
  if (statVals.length >= 4) statVals[3].textContent = stats.responseRate;
  const featuredScroll = document.getElementById('featured-scroll');
  if (featuredScroll && props.length >= 4) {
    const featured = [
      { prop: props[0], tag: 'New', color: '' },
      { prop: props[3] || props[props.length - 1], tag: 'Hot', color: 'background:var(--terra)' },
      { prop: props[2] || props[Math.min(2, props.length - 1)], tag: 'Space', color: 'background:var(--sand);color:var(--ink)' },
      { prop: props[1], tag: 'Value', color: 'background:var(--forest3)' }
    ];
    featuredScroll.innerHTML = featured.map(({ prop, tag, color }) => `
      <div class="feat-card" onclick="openDetail(${prop.id})">
        <div class="feat-img"><img src="${prop.photos[0]}" alt=""><span class="feat-tag" style="${color}">${tag}</span></div>
        <div class="feat-body">
          <div class="feat-price">${prop.price}<span style="font-size:11px;color:var(--text3);font-weight:400">/mo</span></div>
          <div class="feat-sub">🛏 ${prop.beds === 0 ? 'Studio' : prop.beds + 'BR'} &nbsp;·&nbsp; 📍 ${getNeighborhood(prop.loc)}</div>
        </div>
      </div>
    `).join('');
  }

  const propGrid = document.getElementById('prop-grid');
  if (propGrid) propGrid.innerHTML = props.map(p => createPropertyCardHTML(p)).join('');
  const listingCount = document.getElementById('listing-count');
  if (listingCount) listingCount.textContent = `(${props.length})`;

  updateAllSaveToggles();
}

// ═══ LOCATION HELPERS ══════════════════════════════

async function updateLocationChip() {
  const chip = document.getElementById('tbar-location');
  if (!chip) return;

  const saved = localStorage.getItem('eneo-location');
  if (saved) {
    chip.textContent = '📍 ' + saved;
    return;
  }

  if (!navigator.geolocation) {
    chip.textContent = '📍 Set location';
    return;
  }

  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 600000 });
    });
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    let name = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    let fullLocation = name;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        { headers: { 'User-Agent': 'Eneo-HouseHunting/1.0' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const country = addr.country || '';
        const county = addr.county || addr.state || addr.region || '';
        const city = addr.city || addr.town || addr.city_district || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '';

        // Show on chip: neighbourhood, county
        name = [suburb || city, county].filter(Boolean).join(', ') || city || county;
        // Store full hierarchy for tooltip/info
        fullLocation = [suburb, city, county, country].filter(Boolean).join(', ');
      }
    } catch (e) { /* use coordinates */ }

    localStorage.setItem('eneo-location', fullLocation);
    chip.textContent = '📍 ' + name;
    chip.title = fullLocation; // Shows full hierarchy on hover
  } catch (e) {
    chip.textContent = '📍 Set location';
  }
}

function refreshLocationChip() {
  localStorage.removeItem('eneo-location');
  const chip = document.getElementById('tbar-location');
  if (chip) chip.textContent = '📍 Detect location...';
  updateLocationChip();
}

function getNeighborhood(loc) {
  if (!loc) return '';
  const hoods = ['Kilimani', 'Westlands', 'Karen', 'South B', 'South C', 'Lavington', 'Kileleshwa'];
  for (const h of hoods) if (loc.includes(h)) return h;
  return loc.split(',')[0] || loc;
}

function createPropertyCardHTML(p) {
  const bedLabel = p.beds === 0 ? 'Studio' : p.beds;
  const badgeHTML = p.isNew ? '<span class="badge green">✨ New</span>' : '<span class="badge terra">🔥 Popular</span>';
  const dotsHTML = p.photos.map((_, i) => `<span class="gdot${i === 0 ? ' active' : ''}"></span>`).join('');
  const photosHTML = p.photos.map((src, i) => `<img src="${src}" alt="" loading="lazy" ${i === 0 ? '' : 'decoding="async"'}>`).join('');
  return `
    <div class="pcard" data-prop-id="${p.id}" onclick="openDetail(${p.id})">
      <div class="pcard-img">
        <div class="pcard-gallery">${photosHTML}</div>
        <div class="gallery-nav-dots">${dotsHTML}</div>
        <button class="gal-arrow gal-prev" onclick="event.stopPropagation();galScroll(this,-1)">‹</button>
        <button class="gal-arrow gal-next" onclick="event.stopPropagation();galScroll(this,1)">›</button>
        <div class="pcard-overlay"></div>
        <div class="pcard-badges">${badgeHTML}<span class="badge">🐾 Pets OK</span></div>
        <div class="photo-pill">📸 ${p.photos.length}</div>
        <button class="save-toggle" onclick="event.stopPropagation();toggleSave(${p.id})" data-prop-id="${p.id}">♡</button>
      </div>
      <div class="pcard-body">
        <div class="pcard-price">${p.price} <small>/month</small></div>
        <div class="pcard-title">${p.title}</div>
        <div class="pcard-loc">📍 ${p.loc}</div>
        <div class="pcard-divider"></div>
        <div class="pcard-stats">
          <div class="pstat"><div class="pstat-val">${bedLabel}</div><div class="pstat-lbl">Beds</div></div>
          <div class="pstat"><div class="pstat-val">${p.baths}</div><div class="pstat-lbl">Baths</div></div>
          <div class="pstat"><div class="pstat-val">${p.area}</div><div class="pstat-lbl">Area</div></div>
        </div>
      </div>
    </div>
  `;
}

// ═══ RENDER POSTING ════════════════════════════════

async function renderPosting() {
  const { data: myProps } = await fetchMyProperties();
  const listings = (myProps && myProps.length) ? myProps : [];

  // Active
  const ptActive = document.getElementById('pt-active');
  if (ptActive) {
    if (listings.length === 0) {
      ptActive.innerHTML = `<div class="empty-box"><div class="ei">🏠</div><p>No active listings yet.<br>Tap "+ New Listing" to post your first property.</p></div>`;
    } else {
      // Fetch bookings + tenant info
      const { data: { user } } = await supabaseClient.auth.getUser();
      const propertyIds = listings.map(p => p.id);
      const { data: allBookings } = await supabaseClient
        .from('bookings')
        .select('id, booked_at, property_id, tenant_id, tenant_name, tenant_phone')
        .in('property_id', propertyIds)
        .eq('status', 'pending')
        .order('booked_at', { ascending: false });



      const bookingsByProperty = {};
      (allBookings || []).forEach(b => {
        if (!bookingsByProperty[b.property_id]) bookingsByProperty[b.property_id] = [];
        bookingsByProperty[b.property_id].push(b);
      });

      ptActive.innerHTML = listings.map(p => {
        const photos = Array.isArray(p.photos) ? p.photos : (typeof p.photos === 'string' ? JSON.parse(p.photos) : []);
        const img = photos.length ? photos[0] : '';
        const price = typeof p.price === 'number' ? p.price.toLocaleString() : p.price;
        const beds = p.bedrooms ?? p.beds ?? 0;
        const bedLabel = beds === 0 ? 'Studio' : beds + 'BR';
        const loc = p.location ?? p.loc ?? '';
        const title = p.title || 'Untitled';
        const created = p.created_at ? new Date(p.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
        const propBookings = bookingsByProperty[p.id] || [];

        const bookingsHTML = propBookings.length > 0 ? propBookings.map(b => {

          const tenantName = b.tenant_name || 'Tenant';
          const tenantPhone = b.tenant_phone || '';
          const initials = tenantName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const bookedTimeAgo = timeAgo(new Date(b.booked_at).getTime());
          return `
            <div class="booking-row">
              <div class="bk-av">${initials}</div>
              <div class="bk-info">
                <div class="bk-name">${tenantName}</div>
                <div class="bk-time">📅 Booked ${bookedTimeAgo}</div>
                ${tenantPhone ? `<div style="font-size:12px;color:var(--forest);font-weight:600;margin-top:2px;">📞 ${tenantPhone}</div>` : ''}
              </div>
              ${tenantPhone ? `<button class="bk-call" onclick="event.stopPropagation();window.location.href='tel:${tenantPhone}'">📞 Call</button>` : ''}
            </div>
          `;
        }).join('') : '<div class="booking-row" style="color:var(--text4);font-size:12px;justify-content:center;">No pending bookings</div>';

        return `
          <div class="lcard">
            <div class="lcard-head"><img class="lthumb" src="${img}" alt=""><div class="lmeta"><div class="ltitle">${title}</div><div class="lprice">KSh ${price}/mo</div><div class="ldate">📅 Posted ${created}</div></div></div>
            <div class="lcard-strip"><div class="ls">🛏 <b>${bedLabel}</b></div><div class="ls">📍 <b>${getNeighborhood(loc)}</b></div><div class="ls" style="color:var(--forest)">✅ Active</div></div>
                        ${propBookings.length > 0 ? '<div style="padding:8px 16px;color:var(--terra);font-size:11px;text-align:center;background:rgba(196,81,42,.06);border-top:1px solid rgba(196,81,42,.15);border-bottom:1px solid rgba(196,81,42,.15);">⚠️ If you don\'t contact the tenant within 3 days, this listing will be automatically removed.</div>' : ''}
            ${bookingsHTML}
            <div class="lcard-actions">
              <button class="laction la-edit" onclick="openPostForm(${JSON.stringify(p).replace(/"/g, '&quot;')})">✏️ Edit</button>
              <button class="laction la-down" onclick="event.stopPropagation();doTakeDown(${p.id})">⬇️ Take Down</button>
              <button class="laction" style="background:rgba(196,81,42,.08);border:1.5px solid rgba(196,81,42,.25);color:var(--terra);" onclick="event.stopPropagation();doDeleteProperty(${p.id})">🗑️ Delete</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }


  // Removed
  const ptRemoved = document.getElementById('pt-removed');
  if (ptRemoved) {
    const { data: removed } = await supabaseClient.from('properties').select('*').eq('landlord_id', (await supabaseClient.auth.getUser()).data.user.id).eq('status', 'removed').order('created_at', { ascending: false });
    if (!removed || removed.length === 0) {
      ptRemoved.innerHTML = `<div class="empty-box"><div class="ei">🗂️</div><p>No removed properties.<br>Properties you take down will appear here.</p></div>`;
    } else {
      ptRemoved.innerHTML = removed.map(r => `
        <div class="lcard" style="display:flex;align-items:center;gap:14px;padding:16px;">
          <div style="flex:1;min-width:0;"><div class="ltitle">${r.title || 'Untitled'}</div><div class="ldate" style="margin-top:4px;">Removed</div></div>
          <button class="laction la-edit" onclick="restoreProperty(${r.id})">🔄 Restore</button>
        </div>
      `).join('');
    }
  }
}



async function restoreProperty(propId) {
  const { error } = await supabaseClient.from('properties').update({ status: 'active' }).eq('id', propId);
  if (error) {
    toast('Failed to restore', 'err');
    return;
  }
  toast('✅ Property restored!', 'ok');
  renderPosting();
  renderFeed();
}

// ═══ RENDER ACCOUNT ════════════════════════════════

async function renderAccount() {
  const { data: profile } = await getUserProfile();
  if (profile) {
    const nameEl = document.querySelector('.acct-name');
    const emailEl = document.querySelector('.acct-email');
    const avEl = document.querySelector('.acct-av');
    const idCode = document.querySelector('.acct-id-pill code') || document.querySelector('.acct-id-pill span');
    if (nameEl) nameEl.textContent = profile.name || 'User';
    if (emailEl) emailEl.textContent = profile.email || '';
    if (avEl) {
      const initials = (profile.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      avEl.textContent = initials;
    }
    if (idCode) idCode.textContent = profile.account_id || '';

    const sbName = document.querySelector('.sb-user-name');
    const sbAv = document.querySelector('.sb-av');
    if (sbName && profile.name) sbName.textContent = profile.name;
    if (sbAv) {
      const initials = (profile.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      sbAv.textContent = initials;
    }

    const settingRows = document.querySelectorAll('.srow');
    if (settingRows.length >= 1) {
      const nameVal = settingRows[0].querySelector('.srow-val');
      if (nameVal) nameVal.textContent = profile.name || 'User';
      const nameSmall = settingRows[0].querySelector('.srow-text small');
      if (nameSmall) nameSmall.textContent = profile.name || 'User';
      settingRows[0].onclick = () => editProfileField('name', profile.name);
    }
    if (settingRows.length >= 2) {
      const phoneVal = settingRows[1].querySelector('.srow-val');
      if (phoneVal) phoneVal.textContent = profile.phone || 'Not set';
      settingRows[1].onclick = () => editProfileField('phone', profile.phone);
    }
    if (settingRows.length >= 3) {
      const emailSmall = settingRows[2].querySelector('.srow-text small');
      const emailVal = settingRows[2].querySelector('.srow-val');
      if (emailSmall) emailSmall.textContent = profile.email || '';
      if (emailVal) emailVal.textContent = profile.email || '';
      settingRows[2].onclick = () => editEmail(profile.email);
    }
    // Change Password row (index 3)
    if (settingRows.length >= 4) {
      settingRows[3].onclick = () => changePassword();
    }

    const { data: myProps } = await fetchMyProperties();
    const activeCount = myProps ? myProps.length : 0;
    const sbRole = document.querySelector('.sb-user-role');
    if (sbRole) sbRole.textContent = activeCount + ' active listing' + (activeCount !== 1 ? 's' : '');
    const activityRows = document.querySelectorAll('.srow');
    activityRows.forEach(row => {
      const strong = row.querySelector('.srow-text strong');
      if (strong && strong.textContent === 'My Listings') {
        const small = row.querySelector('.srow-text small');
        if (small) small.textContent = activeCount + ' active';
      }
    });
    // Fetch real bookings count
    const { data: { user } } = await supabaseClient.auth.getUser();
    let bookedCount = 0;
    if (user) {
      const { count } = await supabaseClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.id);
      if (count !== null) bookedCount = count;
    }

    const asmVals = document.querySelectorAll('.asm-val');
    if (asmVals.length >= 1) asmVals[0].textContent = activeCount;
    if (asmVals.length >= 2) asmVals[1].textContent = bookedCount;
  }

  const acctSavedCount = document.getElementById('acct-saved-count');
  if (acctSavedCount) acctSavedCount.textContent = savedProps.length + ' saved';
}

async function changePassword() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user || !user.email) {
    toast('No email on file. Contact support.', 'err');
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(user.email, {
    redirectTo: window.location.origin + '?reset=true'
  });
  if (error) {
    toast(error.message || 'Failed to send reset email.', 'err');
    return;
  }
  toast('📧 Password reset link sent to your email!', 'ok');
}
async function editEmail(currentEmail) {
  const newEmail = prompt('Enter new email address:', currentEmail || '');
  if (!newEmail || newEmail === currentEmail) return;

  const { data: { user } } = await supabaseClient.auth.getUser();

  // Update email in Supabase Auth (sends confirmation)
  const { error: authError } = await supabaseClient.auth.updateUser({ email: newEmail });
  if (authError) {
    toast(authError.message || 'Failed to update email.', 'err');
    return;
  }

  // Also update in public.users
  const { error: dbError } = await supabaseClient.from('users').update({ email: newEmail }).eq('id', user.id);
  if (dbError) {
    toast('Updated in auth but failed to update profile.', 'err');
    return;
  }

  toast('📧 Confirmation link sent to ' + newEmail + '. Click it to verify.', 'ok');
  renderAccount();
}

async function editProfileField(field, currentValue) {
  const newValue = prompt(`Enter new ${field}:`, currentValue || '');
  if (!newValue || newValue === currentValue) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  const updates = {};
  updates[field] = newValue;
  const { error } = await supabaseClient.from('users').update(updates).eq('id', user.id);
  if (error) {
    toast('Failed to update. Try again.', 'err');
    return;
  }
  toast('✅ Updated successfully!', 'ok');
  renderAccount();
}

// ═══ POSTING TABS ══════════════════════════════════

function ptab(t, el) {
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['active', 'removed'].forEach(k => {
    const tab = document.getElementById('pt-' + k);
    if (tab) tab.style.display = k === t ? '' : 'none';
  });
}

// ═══ IMAGE COMPRESSION ═════════════════════════════

async function compressImage(file, maxSizeKB = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const megapixels = (img.width * img.height) / 1000000;
        if (megapixels > 72) return reject(new Error('Image too large. Please use a photo under 72 megapixels.'));
        const maxDimension = 1600;
        let width = img.width, height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) { height = Math.round((height / width) * maxDimension); width = maxDimension; }
          else { width = Math.round((width / height) * maxDimension); height = maxDimension; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Compression failed'));
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });

          if (file.size <= 1024 * 1024 && file.size <= compressedFile.size) {
            console.log(`📸 Kept original: ${(file.size / 1024).toFixed(0)}KB (under 1MB, already efficient)`);
            resolve(file);
          } else {
            console.log(`📸 Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
            resolve(compressedFile);
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ═══ POST FORM ═════════════════════════════════════

function openPostForm(existingData = null) {
  photosAdded = false;
  locDone = false;

  if (existingData) {
    document.getElementById('f-title').value = existingData.title || '';
    document.getElementById('f-desc').value = existingData.description || '';
    document.getElementById('f-beds').value = existingData.bedrooms || existingData.beds || 0;
    document.getElementById('f-baths').value = existingData.baths || 0;
    document.getElementById('f-price').value = existingData.price || '';
    document.getElementById('f-area').value = existingData.area || '';
    document.getElementById('f-location').value = existingData.location || '';
    if (existingData.photos && existingData.photos.length) {
      photosAdded = true;
      document.getElementById('pz').style.display = 'none';
      const grid = document.getElementById('thumb-grid');
      grid.innerHTML = existingData.photos.map((src, i) => `
        <div class="thumb-item" id="thumb-${i}">
          <img src="${src}" alt=""><div class="thumb-x" onclick="removeThumb(this)">✕</div>
        </div>
      `).join('') + `<div class="thumb-add" onclick="addPhotos()">+</div>`;
    }
    if (existingData.latitude && existingData.longitude) {
      locDone = true;
      const gpsBtn = document.getElementById('lo-gps');
      gpsBtn.className = 'loc-option lo-captured';
      gpsBtn.innerHTML = `<span class="lo-icon">✓</span><span><span class="lo-main">Location captured</span><span class="lo-sub">Lat: ${existingData.latitude.toFixed(4)}, Lng: ${existingData.longitude.toFixed(4)}</span></span>`;
      gpsBtn._coords = { lat: existingData.latitude, lng: existingData.longitude };
    }
    document.getElementById('submit-btn').innerHTML = '🔄 &nbsp;Update Listing';
    document.getElementById('form-overlay')._editingId = existingData.id;
  } else {
    ['f-title', 'f-desc', 'f-beds', 'f-baths', 'f-area', 'f-location', 'f-price'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('thumb-grid').innerHTML = '';
    document.getElementById('pz').style.display = '';
    document.getElementById('lo-gps').className = 'loc-option lo-green';
    document.getElementById('lo-gps').innerHTML = `<span class="lo-icon">📍</span><span><span class="lo-main">Use my current location</span><span class="lo-sub">Easiest if you're at the property right now</span></span>`;
    document.getElementById('lo-manual').className = 'loc-option lo-neutral';
    document.getElementById('lo-manual').innerHTML = `<span class="lo-icon">🗺️</span><span><span class="lo-main">Enter coordinates manually</span><span class="lo-sub">If you're far away or on a VPN</span></span>`;
    document.getElementById('submit-btn').innerHTML = '🚀 &nbsp;Post Property';
    document.getElementById('form-overlay')._editingId = null;
  }

  document.getElementById('loc-msg').textContent = '';
  document.getElementById('form-progress').textContent = '0 / 5';
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('form-overlay').classList.add('open');
  overlayOpened();
}

function confirmClose() {
  const title = document.getElementById('f-title').value;
  const desc = document.getElementById('f-desc').value;
  const has = title || desc || photosAdded;
  if (has) openModal('m-cancel');
  else { document.getElementById('form-overlay').classList.remove('open'); overlayClosed(); }
}



function discardForm() {
  closeModal('m-cancel');
  document.getElementById('form-overlay').classList.remove('open');
  overlayClosed();
  toast('Draft discarded', '');
}

function updateProgress() {
  const fields = [
    !!document.getElementById('f-title').value,
    !!document.getElementById('f-desc').value,
    !!document.getElementById('f-price').value,
    photosAdded,
    locDone
  ];
  document.getElementById('form-progress').textContent = fields.filter(Boolean).length + ' / 5';
}

function addPhotos() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
  input.onchange = async function () {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    if (photoFiles.length + files.length > 10) {
      toast('Maximum 10 photos total. You already have ' + photoFiles.length + '.', 'err');
      return;
    }

    photosAdded = true;
    document.getElementById('pz').style.display = 'none';

    const grid = document.getElementById('thumb-grid');
    const startIndex = photoFiles.length;

    // Remove the existing add button temporarily
    const addBtn = grid.querySelector('.thumb-add');
    if (addBtn) addBtn.remove();

    for (let i = 0; i < files.length; i++) {
      const idx = startIndex + i;
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-item';
      placeholder.id = 'thumb-' + idx;
      placeholder.innerHTML = '<div class="spin" style="border-color:rgba(27,77,52,.2);border-top-color:var(--forest);margin:auto;"></div>';
      grid.appendChild(placeholder);
    }

    // Re-add the plus button at the end
    const newAddBtn = document.createElement('div');
    newAddBtn.className = 'thumb-add';
    newAddBtn.onclick = addPhotos;
    newAddBtn.textContent = '+';
    grid.appendChild(newAddBtn);

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        const url = URL.createObjectURL(compressed);
        const idx = startIndex + i;
        const thumbEl = document.getElementById('thumb-' + idx);
        if (thumbEl) {
          thumbEl.innerHTML = `<img src="${url}" alt=""><div class="thumb-x" onclick="removeThumbByIndex(${idx})">✕</div>`;
          thumbEl._compressedFile = compressed;
        }
        photoFiles.push(compressed);
      } catch (err) {
        toast(err.message || 'Failed to compress image', 'err');
      }
    }
    updateProgress();
  };
  input.click();
}

function removeThumbByIndex(idx) {
  photoFiles.splice(idx, 1);
  const grid = document.getElementById('thumb-grid');
  grid.innerHTML = '';
  photoFiles.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const thumbItem = document.createElement('div');
    thumbItem.className = 'thumb-item';
    thumbItem.id = 'thumb-' + i;
    thumbItem.innerHTML = `<img src="${url}" alt=""><div class="thumb-x" onclick="removeThumbByIndex(${i})">✕</div>`;
    thumbItem._compressedFile = file;
    grid.appendChild(thumbItem);
  });
  const addBtn = document.createElement('div');
  addBtn.className = 'thumb-add';
  addBtn.onclick = addPhotos;
  addBtn.textContent = '+';
  grid.appendChild(addBtn);

  if (photoFiles.length === 0) {
    photosAdded = false;
    document.getElementById('pz').style.display = '';
    document.getElementById('thumb-grid').innerHTML = '';
  }
  updateProgress();
}
function removeThumb(el) {
  const idx = parseInt(el.parentElement.id.replace('thumb-', ''));
  removeThumbByIndex(idx);
}

function captureGPS() {
  const btn = document.getElementById('lo-gps');
  if (!navigator.geolocation) { toast('Geolocation not supported. Use manual entry.', 'err'); return; }
  btn.innerHTML = `<span class="lo-icon"><span class="spin" style="border:2.5px solid rgba(27,77,52,.25);border-top-color:var(--forest)"></span></span><span><span class="lo-main">Detecting location...</span></span>`;
  navigator.geolocation.getCurrentPosition(
    position => {
      locDone = true;
      btn.className = 'loc-option lo-captured';
      btn.innerHTML = `<span class="lo-icon">✓</span><span><span class="lo-main">Location captured</span><span class="lo-sub">Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}</span></span>`;
      btn._coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      toast('📍 Location captured!', 'ok');
      updateProgress();
    },
    error => {
      btn.className = 'loc-option lo-green';
      btn.innerHTML = `<span class="lo-icon">📍</span><span><span class="lo-main">Use my current location</span><span class="lo-sub">Easiest if you're at the property right now</span></span>`;
      if (error.code === error.PERMISSION_DENIED) toast('Location access denied. Use manual entry.', 'err');
      else toast('Could not detect location. Use manual entry.', 'err');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function checkCoords() {
  const v = document.getElementById('coord-in').value.trim();
  const ok = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(v);
  const hint = document.getElementById('coord-hint');
  const btn = document.getElementById('cb-save');
  if (ok) { hint.style.color = 'var(--forest)'; hint.textContent = '✓ Valid format'; btn.classList.add('ready'); }
  else if (v.length > 0) { hint.style.color = 'var(--terra)'; hint.textContent = 'Invalid. Use: -1.2864, 36.8172'; btn.classList.remove('ready'); }
  else { hint.style.color = 'var(--text4)'; hint.textContent = 'Paste latitude and longitude separated by a comma'; btn.classList.remove('ready'); }
}

function saveCoords() {
  const v = document.getElementById('coord-in').value.trim();
  locDone = true;
  closeModal('m-coords');
  const btn = document.getElementById('lo-manual');
  btn.className = 'loc-option lo-captured';
  btn.innerHTML = `<span class="lo-icon">✓</span><span><span class="lo-main">Coordinates saved</span><span class="lo-sub">${v}</span></span>`;
  toast('🗺️ Coordinates saved!', 'ok');
  updateProgress();
}
async function submitPost() {
  const title = document.getElementById('f-title').value;
  const price = document.getElementById('f-price').value;
  const desc = document.getElementById('f-desc').value;
  const beds = parseInt(document.getElementById('f-beds').value) || 0;
  const baths = parseFloat(document.getElementById('f-baths').value) || 0;
  const area = document.getElementById('f-area').value || '';
  const editingId = document.getElementById('form-overlay')._editingId;

  if (!title || !price) { toast('Please fill in title and price', 'err'); return; }
  if (!photosAdded && !editingId) { toast('📸 Add at least one photo', 'err'); return; }
  if (!locDone) { toast('📍 Add property location first', 'err'); return; }

  const btn = document.getElementById('submit-btn');
  btn.innerHTML = '<span class="spin"></span> &nbsp;' + (editingId ? 'Updating...' : 'Posting...');
  btn.disabled = true;

  let lat, lng;
  const gpsBtn = document.getElementById('lo-gps');
  if (gpsBtn._coords) { lat = gpsBtn._coords.lat; lng = gpsBtn._coords.lng; }
  else {
    const coordText = document.getElementById('coord-in')?.value || '';
    const parts = coordText.split(',').map(s => parseFloat(s.trim()));
    lat = parts[0]; lng = parts[1];
  }

  try {
    if (ENEO_CONFIG.useMockUpload) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // Upload photos to Supabase Storage
      const thumbItems = document.querySelectorAll('.thumb-item');
      const photoUrls = [];
      for (const item of thumbItems) {
        if (item._compressedFile) {
          const file = item._compressedFile;
          const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const filePath = `properties/${fileName}`;
          const { error: uploadError } = await supabaseClient.storage.from(ENEO_CONFIG.storageBucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabaseClient.storage.from(ENEO_CONFIG.storageBucket).getPublicUrl(filePath);
          photoUrls.push(urlData.publicUrl);
        }
      }
      if (editingId) {
        document.querySelectorAll('.thumb-item img').forEach(img => {
          const src = img.src;
          if (src && !photoUrls.includes(src) && src.startsWith('http')) {
            photoUrls.push(src);
          }
        });
      }
      // Reverse geocode to get county from coordinates
      let county = '';
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
          { headers: { 'User-Agent': 'Eneo-HouseHunting/1.0' } }
        );
        const data = await res.json();
        if (data && data.address) {
          county = data.address.county || data.address.state || data.address.region || '';
        }
      } catch (e) {
        // Silent — county will be empty
      }
      // Get landlord phone from current user's profile
      const { data: landlordProfile } = await supabaseClient
        .from('users')
        .select('phone')
        .eq('id', (await supabaseClient.auth.getUser()).data.user.id)
        .single();
      const landlordPhone = landlordProfile?.phone || '';
      const propertyData = {
        title,
        description: desc,
        price: parseInt(price),
        bedrooms: beds,
        baths,
        area,
        location: document.getElementById('f-location')?.value || '',
        latitude: lat,
        longitude: lng,
        county,
        photos: photoUrls,
        status: 'active',
        landlord_id: (await supabaseClient.auth.getUser()).data.user.id,
        landlord_phone: landlordPhone
      };

      let error;
      if (editingId) {
        ({ error } = await supabaseClient.from('properties').update(propertyData).eq('id', editingId));
      } else {
        ({ error } = await supabaseClient.from('properties').insert(propertyData));
      }
      if (error) throw error;
    }

    btn.innerHTML = '✅ &nbsp;' + (editingId ? 'Updated!' : 'Posted!');
    toast(editingId ? '🎉 Property updated!' : '🎉 Your property is now live!', 'ok');

    setTimeout(() => {
      document.getElementById('form-overlay').classList.remove('open');
      overlayClosed();
      switchNav('posting');
    }, 1100);

  } catch (err) {
    toast(err.message || 'Failed to save property.', 'err');
    btn.innerHTML = editingId ? '🔄 &nbsp;Update Listing' : '🚀 &nbsp;Post Property';
    btn.disabled = false;
  }
}

// ═══ SAVE / BOOKMARK ═══════════════════════════════

async function toggleSave(propId) {
  const idx = savedProps.indexOf(propId);
  if (idx > -1) {
    savedProps.splice(idx, 1);
    await unsavePropertyFromDB(propId);
    toast('Removed from saved', '');
  } else {
    savedProps.push(propId);
    await savePropertyToDB(propId);
    toast('❤️ Saved!', 'ok');
  }
  localStorage.setItem('eneo-saved', JSON.stringify(savedProps));
  updateAllSaveToggles();
  updateSavedCountBadge();
  renderSavedWorkspace();
}

function updateAllSaveToggles() {
  document.querySelectorAll('.save-toggle').forEach(btn => {
    const pid = parseInt(btn.getAttribute('data-prop-id'));
    if (savedProps.includes(pid)) { btn.textContent = '❤️'; btn.classList.add('saved'); }
    else { btn.textContent = '♡'; btn.classList.remove('saved'); }
  });
}

function updateSavedCountBadge() {
  const count = savedProps.length;
  const badge = document.getElementById('snav-saved-count');
  if (badge) { badge.textContent = count; badge.classList.toggle('visible', count > 0); }
  const acctEl = document.getElementById('acct-saved-count');
  if (acctEl) acctEl.textContent = count + ' saved';
}

async function loadSavedFromDB() {
  const { data } = await fetchSavedProperties();
  if (data && data.length) {
    savedProps = data.map(row => row.property_id);
    localStorage.setItem('eneo-saved', JSON.stringify(savedProps));
    updateAllSaveToggles();
    updateSavedCountBadge();
  }
}

// ═══ SAVED WORKSPACE ═══════════════════════════════

async function renderSavedWorkspace() {
  const grid = document.getElementById('saved-grid');
  const empty = document.getElementById('saved-empty');
  const countLabel = document.getElementById('saved-count-label');
  const compareBar = document.getElementById('compare-bar');
  const comparisonView = document.getElementById('comparison-view');
  if (!grid) return;

  if (comparisonView) comparisonView.classList.remove('active');

  if (savedProps.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = '';
    if (countLabel) countLabel.textContent = '0 saved';
    if (compareBar) compareBar.style.display = 'none';
    updateCompareButton();
    return;
  }

  if (empty) empty.style.display = 'none';
  if (countLabel) countLabel.textContent = savedProps.length + ' saved';
  if (compareBar) compareBar.style.display = 'flex';

  const propsData = await Promise.all(savedProps.map(pid => fetchPropertyById(pid).then(r => r.data)));
  const validProps = propsData.filter(Boolean);

  grid.innerHTML = validProps.map(p => {
    const photos = Array.isArray(p.photos) ? p.photos : (typeof p.photos === 'string' ? JSON.parse(p.photos) : []);
    const img = photos.length ? photos[0] : '';
    const price = typeof p.price === 'number' ? `KSh ${p.price.toLocaleString()}` : p.price;
    const title = p.title || 'Untitled';
    const loc = p.location ?? p.loc ?? '';
    const beds = p.bedrooms ?? p.beds ?? 0;
    const bedLabel = beds === 0 ? 'Studio' : beds;
    return `
      <div class="saved-card">
        <div class="check-wrap"><input type="checkbox" class="saved-check" data-prop-id="${p.id}" onchange="updateCompareButton()"></div>
        <div class="saved-card-img"><img src="${img}" alt=""></div>
        <div class="saved-card-body">
          <div class="saved-card-price">${price} <small style="font-size:12px;color:var(--text3);font-weight:400">/mo</small></div>
          <div class="saved-card-title">${title}</div>
          <div class="saved-card-loc">📍 ${loc}</div>
          <div class="saved-card-actions">
            <button class="sv-view" onclick="openDetail(${p.id})">👁 View</button>
            <button class="sv-remove" onclick="toggleSave(${p.id})">🗑 Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateCompareButton();
}

function updateCompareButton() {
  const btn = document.getElementById('compare-btn');
  const checked = document.querySelectorAll('.saved-check:checked');
  if (!btn) return;
  btn.disabled = checked.length < 2 || checked.length > 3;
  btn.textContent = checked.length >= 2 && checked.length <= 3 ? `📊 Compare ${checked.length} Selected` : '📊 Compare Selected';
}

async function compareSelected() {
  const checked = document.querySelectorAll('.saved-check:checked');
  const ids = Array.from(checked).map(cb => parseInt(cb.getAttribute('data-prop-id')));
  if (ids.length < 2 || ids.length > 3) return;

  const comparisonView = document.getElementById('comparison-view');
  if (!comparisonView) return;

  const propsToCompare = (await Promise.all(ids.map(id => fetchPropertyById(id).then(r => r.data)))).filter(Boolean);

  const rows = [
    { label: 'Price', key: 'price' },
    { label: 'Type', key: 'type', fmt: v => v || 'N/A' },
    { label: 'Bedrooms', key: 'bedrooms', fmt: v => v !== undefined ? (v === 0 ? 'Studio' : v) : 'N/A' },
    { label: 'Bathrooms', key: 'baths' },
    { label: 'Area', key: 'area' },
    { label: 'Location', key: 'location' }
  ];

  let html = '<table><thead><tr><th>Feature</th>';
  propsToCompare.forEach(p => { html += `<th class="comp-header">${p.title}</th>`; });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    html += `<tr><td><strong>${row.label}</strong></td>`;
    propsToCompare.forEach(p => {
      let val = p[row.key] !== undefined ? p[row.key] : '';
      if (row.fmt) val = row.fmt(val);
      html += `<td>${val}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  comparisonView.innerHTML = html;
  comparisonView.classList.add('active');
  comparisonView.scrollIntoView({ behavior: 'smooth' });
}

// ═══ DETAIL PANEL ══════════════════════════════════

// Cache for property details — avoids re-fetching on repeat visits
const detailCache = {};

async function openDetail(propId) {
  // Check cache first
  let p;
  if (detailCache[propId]) {
    p = detailCache[propId];
  } else {
    let { data: fetched, error } = await fetchPropertyById(propId);
    if (error || !fetched) fetched = null;
    if (!fetched) return;

    p = {
      ...fetched,
      beds: fetched.bedrooms ?? fetched.beds ?? 0,
      baths: fetched.baths ?? 1,
      type: fetched.property_type ?? fetched.type ?? 'Apartment',
      loc: fetched.location ?? fetched.loc ?? '',
      desc: fetched.description ?? fetched.desc ?? '',
      area: fetched.area ?? 'N/A',
      isNew: fetched.isNew ?? false,
      photos: Array.isArray(fetched.photos) ? fetched.photos : (typeof fetched.photos === 'string' ? JSON.parse(fetched.photos) : []),
      price: typeof fetched.price === 'number' ? `KSh ${fetched.price.toLocaleString()}` : fetched.price,
      landlord: fetched.landlord ?? { name: 'Landlord', initials: 'LL', rating: 0, totalRatings: 0, isTrusted: false, totalPosted: 0, totalBooked: 0, responseRate: 0, reviews: [] },
      activity: fetched.activity ?? { views: 0, saves: 0, bookings: 0 }
    };
    detailCache[propId] = p;
  }

  curProp = p;
  booked = false;
  // Defer non-critical writes — panel opens instantly
  setTimeout(() => {
    trackView(propId);
    incrementViewCount(propId);
  }, 0);

  document.getElementById('dt-title').textContent = p.title;
  document.getElementById('dt-loc').innerHTML = '📍 ' + p.loc;
  document.getElementById('dt-price').innerHTML = p.price + ' <small>/month</small>';
  document.getElementById('dt-name').textContent = p.title;
  document.getElementById('dt-desc').textContent = p.desc;

  const pill = document.getElementById('dt-pill');
  pill.style.display = p.isNew ? '' : 'none';

  const bedLabel = p.beds === 0 ? 'Studio' : p.beds;
  document.getElementById('dt-chips').innerHTML = `
    <div class="dchip"><div class="dchip-val">${bedLabel}</div><div class="dchip-lbl">Bedrooms</div></div>
    <div class="dchip"><div class="dchip-val">${p.baths}</div><div class="dchip-lbl">Bathrooms</div></div>
    <div class="dchip"><div class="dchip-val">${p.area}</div><div class="dchip-lbl">Area</div></div>
  `;

  const gal = document.getElementById('dt-gallery');
  gal.innerHTML = p.photos.map((src, i) => `<img src="${src}" alt="" onclick="event.stopPropagation();openLightbox(${JSON.stringify(p.photos).replace(/"/g, '&quot;')}, ${i})" style="cursor:pointer;">`).join('');
  const dots = document.getElementById('dt-dots');
  dots.innerHTML = p.photos.map((_, idx) => `<div class="gdot${idx === 0 ? ' active' : ''}"></div>`).join('');
  gal.onscroll = () => {
    const idx = Math.round(gal.scrollLeft / gal.clientWidth);
    dots.querySelectorAll('.gdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  };
  gal.scrollLeft = 0;
  dots.querySelectorAll('.gdot').forEach((d, i) => d.classList.toggle('active', i === 0));

  const btn = document.getElementById('book-btn');
  btn.innerHTML = '📅 Book This Property';
  btn.classList.remove('done');
  btn.disabled = false;
  document.getElementById('contact-reveal').classList.remove('show');

  await renderLandlordCard(p);

  document.getElementById('detail-overlay').classList.add('open');
  overlayOpened();
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('open');
  overlayClosed();
}
let lbPhotos = [];
let lbIndex = 0;

function openLightbox(photos, index) {
  lbPhotos = photos;
  lbIndex = index;

  const lb = document.getElementById('lightbox');
  const gallery = document.getElementById('lb-gallery');
  const counter = document.getElementById('lb-counter');

  gallery.innerHTML = photos.map(src => `<img src="${src}" alt="">`).join('');
  counter.textContent = `${index + 1} / ${photos.length}`;

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Scroll to the selected image
  setTimeout(() => {
    gallery.scrollLeft = index * gallery.clientWidth;
  }, 50);

  // Update counter on scroll
  gallery.onscroll = () => {
    const idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
    lbIndex = idx;
    counter.textContent = `${idx + 1} / ${photos.length}`;
  };
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
  lbPhotos = [];
  lbIndex = 0;
}

function lbNav(dir) {
  const gallery = document.getElementById('lb-gallery');
  const newIndex = lbIndex + dir;
  if (newIndex < 0 || newIndex >= lbPhotos.length) return;
  gallery.scrollBy({ left: dir * gallery.clientWidth, behavior: 'smooth' });
}
async function renderLandlordCard(p) {
  // Skip fetch if already rendered for this property
  if (p._landlordRendered) return;
  p._landlordRendered = true;

  // Fetch real landlord profile
  if (p.landlord_id) {
    const { data: profile } = await supabaseClient.from('users').select('name, phone').eq('id', p.landlord_id).single();
    if (profile) {
      p.landlord = p.landlord || {};
      p.landlord.name = profile.name || p.landlord.name || 'Landlord';
      p.landlord.initials = (profile.name || 'L').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
  }
  // ... rest continues as-is

  const ld = p.landlord || {};
  const act = p.activity || {};

  // Default values
  ld.name = ld.name || 'Landlord';
  ld.initials = ld.initials || 'LL';
  ld.rating = ld.rating || 0;
  ld.totalRatings = ld.totalRatings || 0;
  ld.isTrusted = ld.isTrusted || false;
  ld.totalPosted = ld.totalPosted || 0;
  ld.totalBooked = ld.totalBooked || 0;
  ld.responseRate = ld.responseRate || 0;
  ld.reviews = ld.reviews || [];

  // --- Fetch real reviews from DB ---
  if (p.landlord_id) {
    const { data: realReviews } = await fetchReviewsForLandlord(p.landlord_id);
    if (realReviews && realReviews.length > 0) {
      ld.totalRatings = realReviews.length;
      const avgStars = realReviews.reduce((sum, r) => sum + r.stars, 0) / realReviews.length;
      ld.rating = Math.round(avgStars * 10) / 10;
      ld.isTrusted = ld.totalRatings >= 3 && ld.rating >= 3.5;

      ld.reviews = realReviews.map(r => ({
        stars: r.stars,
        text: r.review_text,
        author: r.reviewer?.name || 'Anonymous',
        time: new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
      }));
    }
  }

  // --- Render ---
  document.getElementById('ld-av').textContent = ld.initials;
  document.getElementById('ld-name').textContent = ld.name;
  const fullStars = '★'.repeat(Math.floor(ld.rating));
  const emptyStars = '☆'.repeat(5 - Math.ceil(ld.rating));
  document.getElementById('ld-stars').textContent = fullStars + emptyStars;
  document.getElementById('ld-stars').style.color = 'var(--sand)';
  document.getElementById('ld-rating-num').textContent = ld.rating || '—';
  document.getElementById('ld-rating-count').textContent = `(${ld.totalRatings} ratings)`;

  const badge = document.getElementById('ld-badge');
  if (ld.isTrusted) {
    badge.innerHTML = '<span>🏅 Trusted</span>';
    badge.className = 'landlord-badge';
  } else {
    badge.innerHTML = '<span>🌱 New Landlord</span>';
    badge.className = 'landlord-badge new-landlord';
  }

  document.getElementById('ld-posted').textContent = ld.totalPosted;
  document.getElementById('ld-booked').textContent = ld.totalBooked;
  document.getElementById('ld-response').textContent = (ld.responseRate || 0) + '%';

  // Activity counts
  const dbViews = p.view_count ?? act.views ?? 0;
  document.getElementById('pa-views').textContent = dbViews;

  let savesCount = act.saves ?? 0;
  try {
    const { count } = await supabaseClient
      .from('saved_properties')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', p.id);
    if (count !== null) savesCount = count;
  } catch (e) { /* use fallback */ }
  document.getElementById('pa-saves').textContent = savesCount;

  let bookingsCount = act.bookings ?? 0;
  try {
    const { count } = await supabaseClient
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', p.id);
    if (count !== null) bookingsCount = count;
  } catch (e) { /* use fallback */ }
  document.getElementById('pa-bookings').textContent = bookingsCount;

  const reviewsContainer = document.getElementById('ld-reviews');
  if (ld.reviews && ld.reviews.length > 0) {
    reviewsContainer.innerHTML = ld.reviews.map(r => `
      <div class="review-item">
        <div class="review-stars" style="color:var(--sand)">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
        <div class="review-text">"${r.text}"</div>
        <div class="review-meta">— ${r.author} · ${r.time}</div>
      </div>
    `).join('');
  } else {
    reviewsContainer.innerHTML = '<div style="font-size:12px;color:var(--text4);text-align:center;padding:10px;">No reviews yet. Be the first after a viewing.</div>';
  }
}

async function doBook() {
  if (booked || !curProp) return;
  const btn = document.getElementById('book-btn');
  btn.innerHTML = '<span class="spin"></span> Booking...';
  btn.disabled = true;

  const { error } = await createBooking(curProp.id);
  if (error) {
    toast('Booking failed. Try again.', 'err');
    btn.innerHTML = '📅 Book This Property';
    btn.disabled = false;
    return;
  }

  // Fetch real landlord phone
  // Use landlord_phone stored on the property itself
  if (curProp.landlord_phone) {
    document.querySelector('.contact-number').textContent = curProp.landlord_phone;
  }

  booked = true;
  btn.innerHTML = '✅ Viewing Requested!';
  btn.classList.add('done');
  btn.disabled = false;
  document.getElementById('contact-reveal').classList.add('show');
  // Show review form after booking

  toast('✅ Booked! Call the landlord to confirm a time.', 'ok');
}

// ═══ REVIEW SYSTEM ═══════════════════════════════

let reviewStars = 0;

function setReviewStar(n) {
  reviewStars = n;
  const stars = document.querySelectorAll('#star-picker .star');
  stars.forEach((s, i) => {
    s.textContent = i < n ? '★' : '☆';
    s.style.color = i < n ? 'var(--sand)' : 'var(--text4)';
  });
}
let ratingBookingId = null;
let ratingPropertyId = null;

async function openReviewModal(propertyId, bookingId) {
  ratingPropertyId = propertyId;
  ratingBookingId = bookingId;
  reviewStars = 0;
  document.querySelectorAll('#star-picker .star').forEach(s => { s.textContent = '☆'; s.style.color = 'var(--text4)'; });
  document.getElementById('review-text').value = '';

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    const { data: existing } = await supabaseClient
      .from('reviews')
      .select('stars, review_text')
      .eq('property_id', propertyId)
      .eq('reviewer_id', user.id)
      .maybeSingle();

    if (existing) {
      reviewStars = existing.stars;
      setReviewStar(existing.stars);
      document.getElementById('review-text').value = existing.review_text || '';
      document.querySelector('#review-form .book-btn').textContent = '✏️ Update Review';
    } else {
      document.querySelector('#review-form .book-btn').textContent = 'Submit Review';
    }
  }

  document.getElementById('review-form').style.display = '';
  openDetail(parseInt(propertyId));

  setTimeout(() => {
    document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

async function submitReviewForm() {
  const propId = ratingPropertyId ? parseInt(ratingPropertyId) : (curProp ? curProp.id : null);

  if (!propId) {
    toast('Cannot identify property.', 'err');
    return;
  }

  if (reviewStars === 0) {
    toast('Please select a star rating.', 'err');
    return;
  }

  const reviewText = document.getElementById('review-text').value.trim();
  if (!reviewText) {
    toast('Please write a review.', 'err');
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    toast('You must be logged in to review.', 'err');
    return;
  }

  // Get landlord_id from property
  const { data: property } = await supabaseClient.from('properties').select('landlord_id').eq('id', propId).single();
  if (!property || !property.landlord_id) {
    toast('Cannot identify landlord.', 'err');
    return;
  }


  const { error } = await supabaseClient.from('reviews').upsert({
    property_id: propId,
    reviewer_id: user.id,
    landlord_id: property.landlord_id,
    stars: reviewStars,
    review_text: reviewText
  }, { onConflict: 'property_id, reviewer_id' });

  if (error) {
    toast('Failed to submit review. Try again.', 'err');
    return;
  }

  toast('✅ Review submitted!', 'ok');
  document.getElementById('review-text').value = '';
  reviewStars = 0;
  ratingPropertyId = null;
  ratingBookingId = null;
  document.querySelectorAll('#star-picker .star').forEach(s => { s.textContent = '☆'; s.style.color = 'var(--text4)'; });
  document.getElementById('review-form').style.display = 'none';
  if (curProp) renderLandlordCard(curProp);
}

function openMap() {
  if (!curProp) return;
  toast('📍 Opening Google Maps...', 'ok');
  setTimeout(() => window.open(`https://www.google.com/maps/search/?api=1&query=${curProp.lat},${curProp.lng}`, '_blank'), 600);
}

// ═══ GALLERY SCROLL ════════════════════════════════

function galScroll(el, dir) {
  const gallery = el.parentElement.querySelector('.pcard-gallery');
  if (!gallery) return;
  gallery.scrollBy({ left: dir * gallery.clientWidth, behavior: 'smooth' });
}

document.addEventListener('scroll', e => {
  const gallery = e.target.closest('.pcard-gallery');
  if (!gallery) return;
  const dots = gallery.parentElement.querySelectorAll('.gallery-nav-dots .gdot');
  if (!dots.length) return;
  const idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}, true);

// ═══ LIVE SEARCH ═══════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('feed-search');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const query = searchInput.value.trim();
      // Don't search with less than 2 characters
      if (query.length === 1) return;
      searchTimeout = setTimeout(async () => {
        const { data: properties } = await fetchProperties(query ? { search: query } : {});
        const props = properties || [];
        const propGrid = document.getElementById('prop-grid');
        if (propGrid) {
          propGrid.innerHTML = props.length ? props.map(p => createPropertyCardHTML(p)).join('') : `<div class="empty-box"><div class="ei">🔍</div><p>No properties found matching "${query}"</p></div>`;
        }
        updateAllSaveToggles();
      }, 300);
    });
  }
});

// ═══ FILTERS ═══════════════════════════════════════

function openFilterModal() {
  openModal('m-filter');
  updatePriceFill('f', parseInt(document.getElementById('f-range-min')?.value || 0), parseInt(document.getElementById('f-range-max')?.value || 300000));
}

function pickChip(el, gId) {
  document.querySelectorAll('#' + gId + ' .chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
}

function pickCounty(el, val) {
  document.querySelectorAll('#ch-county .county-chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  if (val !== 'any') {
    nearMeActive = false;
    const nb = document.getElementById('f-nearme-btn');
    nb.classList.remove('active');
    document.getElementById('f-nearme-text').textContent = 'Use my current location';
    document.getElementById('f-nearme-icon').textContent = '📍';
  }
}

async function filterNearMe() {
  const btn = document.getElementById('f-nearme-btn');
  const icon = document.getElementById('f-nearme-icon');
  const txt = document.getElementById('f-nearme-text');

  if (nearMeActive) {
    // Turn off
    nearMeActive = false;
    btn.classList.remove('active');
    icon.textContent = '📍';
    txt.textContent = 'Use my current location';
    document.getElementById('f-nearme-coords')?.remove();
    return;
  }

  // Turn on — get real location
  if (!navigator.geolocation) {
    toast('Geolocation not supported on this device', 'err');
    return;
  }

  btn.classList.add('active');
  icon.textContent = '⏳';
  txt.textContent = 'Detecting location...';

  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      });
    });

    nearMeActive = true;
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Store coords on the button for applyFilters to use
    btn._nearMeCoords = { lat, lng };

    // Try to get neighborhood name using reverse geocode
    let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        { headers: { 'User-Agent': 'Eneo-HouseHunting/1.0' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const country = addr.country || '';
        const county = addr.county || addr.state || addr.region || '';
        const city = addr.city || addr.town || addr.city_district || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '';
        // Show neighbourhood, county in the text
        locationName = [suburb || city, county].filter(Boolean).join(', ') || [city, county, country].filter(Boolean).join(', ');
      }
    } catch (e) {
      // Use coordinates as fallback
    }

    icon.textContent = '✅';
    txt.textContent = `Near me — ${locationName}`;

    // Clear county selection since we're using GPS
    document.querySelectorAll('#ch-county .county-chip').forEach((c, i) => c.classList.toggle('on', i === 0));

    toast(`📍 Location set: ${locationName}`, 'ok');

  } catch (err) {
    nearMeActive = false;
    btn.classList.remove('active');
    icon.textContent = '📍';
    txt.textContent = 'Use my current location';

    if (err.code === err.PERMISSION_DENIED) {
      toast('Location denied. Check browser permissions.', 'err');
    } else if (err.code === err.TIMEOUT) {
      toast('Location timed out. Try again.', 'err');
    } else {
      toast('Could not get location. Try manual county.', 'err');
    }
  }
}

// ═══ PRICE SLIDERS ════════════════════════════════

function syncFromSliders(prefix) {
  const minR = document.getElementById(prefix + '-range-min');
  const maxR = document.getElementById(prefix + '-range-max');
  const minI = document.getElementById(prefix + '-min-input');
  const maxI = document.getElementById(prefix + '-max-input');
  if (!minR || !maxR) return;
  let minV = parseInt(minR.value), maxV = parseInt(maxR.value);
  if (minV >= maxV) { minV = Math.max(0, maxV - 5000); minR.value = minV; }
  if (minI) minI.value = minV;
  if (maxI) maxI.value = maxV;
  updatePriceFill(prefix, minV, maxV);
}

function syncFromInputs(prefix) {
  const minI = document.getElementById(prefix + '-min-input');
  const maxI = document.getElementById(prefix + '-max-input');
  const minR = document.getElementById(prefix + '-range-min');
  const maxR = document.getElementById(prefix + '-range-max');
  if (!minI || !maxI) return;
  let minV = Math.max(0, parseInt(minI.value) || 0), maxV = Math.max(0, parseInt(maxI.value) || 300000);
  minV = Math.min(minV, 300000); maxV = Math.min(maxV, 300000);
  if (minV >= maxV) maxV = Math.min(minV + 5000, 300000);
  minI.value = minV; maxI.value = maxV;
  if (minR) minR.value = minV;
  if (maxR) maxR.value = maxV;
  updatePriceFill(prefix, minV, maxV);
}

function updatePriceFill(prefix, minV, maxV) {
  const fill = document.getElementById(prefix === 'f' ? 'price-fill' : 'n-price-fill');
  if (!fill) return;
  const pct = v => (v / 300000) * 100;
  fill.style.left = pct(minV) + '%';
  fill.style.width = (pct(maxV) - pct(minV)) + '%';
}

function clearFilters() {
  document.getElementById('f-range-min').value = 0;
  document.getElementById('f-range-max').value = 300000;
  document.getElementById('f-min-input').value = 0;
  document.getElementById('f-max-input').value = 300000;
  updatePriceFill('f', 0, 300000);
  nearMeActive = false;
  const nb = document.getElementById('f-nearme-btn');
  if (nb) nb.classList.remove('active');
  document.getElementById('f-nearme-icon').textContent = '📍';
  document.getElementById('f-nearme-text').textContent = 'Use my current location';
  ['ch-county', 'ch-beds', 'ch-baths', 'ch-type', 'ch-furnish'].forEach(id => {
    document.querySelectorAll('#' + id + ' .chip, #' + id + ' .county-chip').forEach((c, i) => c.classList.toggle('on', i === 0));
  });
  toast('Filters cleared', '');
}

async function applyFilters() {
  const minV = parseInt(document.getElementById('f-min-input')?.value || 0);
  const maxV = parseInt(document.getElementById('f-max-input')?.value || 300000);
  const beds = document.querySelector('#ch-beds .chip.on')?.textContent;
  const baths = document.querySelector('#ch-baths .chip.on')?.textContent;
  const type = document.querySelector('#ch-type .chip.on')?.textContent;
  const furnish = document.querySelector('#ch-furnish .chip.on')?.textContent;
  closeModal('m-filter');

  const filters = {};
  if (minV > 0) filters.minPrice = minV;
  if (maxV < 300000) filters.maxPrice = maxV;
  if (beds && beds !== 'Any') filters.beds = beds;
  if (baths && baths !== 'Any') filters.baths = baths;
  if (type && type !== 'Any') filters.type = type;
  if (furnish && furnish !== 'Any') filters.furnish = furnish;
  // Get selected county from chip
  const countyEl = document.querySelector('#ch-county .county-chip.on');
  if (countyEl) {
    const county = countyEl.getAttribute('onclick')?.match(/pickCounty\(this,'(.+?)'\)/)?.[1];
    if (county && county !== 'any') filters.county = county;
  }

  const { data: properties } = await fetchProperties(filters);
  let filteredProps = properties || [];

  // Apply near-me distance filter if active and coords present
  if (nearMeActive) {
    const nb = document.getElementById('f-nearme-btn');
    if (nb && nb._nearMeCoords) {
      const { lat, lng } = nb._nearMeCoords;
      filteredProps = filteredProps.filter(p => {
        const pLat = p.latitude ?? p.lat;
        const pLng = p.longitude ?? p.lng;
        if (pLat == null || pLng == null) return false;
        const d = getDistance(lat, lng, pLat, pLng);
        return d <= 5;
      });
    }
  }

  const propGrid = document.getElementById('prop-grid');
  if (propGrid) propGrid.innerHTML = filteredProps.map(p => createPropertyCardHTML(p)).join('');
  updateAllSaveToggles();

  const parts = [];
  if (nearMeActive) parts.push('Near me');
  if (minV > 0 || maxV < 300000) {
    const fmt = v => v >= 300000 ? '300k+' : v === 0 ? '0' : (v / 1000) + 'k';
    parts.push(`KSh ${fmt(minV)}–${fmt(maxV)}`);
  }
  if (type && type !== 'Any') parts.push(type);
  if (beds && beds !== 'Any') parts.push(beds + ' bed');
  if (baths && baths !== 'Any') parts.push(baths + ' bath');
  if (furnish && furnish !== 'Any') parts.push(furnish);

  toast(parts.length ? '🔍 ' + parts.join(' · ') : 'Showing all listings', parts.length ? 'ok' : '');
  const fb = document.getElementById('filter-btn');
  if (fb) fb.classList.toggle('on', parts.length > 0);
}

// ═══ NOTIFY ME ═════════════════════════════════════

async function checkNotificationCount() {
  const { data: alerts } = await fetchAlerts();
  if (!alerts || alerts.length === 0) {
    toast('No alerts saved. Click "Notify Me" to create one.', '');
    return;
  }

  let matchCount = 0;
  for (const alert of alerts) {
    let query = supabaseClient
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (alert.min_price) query = query.gte('price', alert.min_price);
    if (alert.max_price && alert.max_price < 999999) query = query.lte('price', alert.max_price);

    const { count, error } = await query.limit(1);
    if (!error && count > 0) matchCount++;
  }

  if (matchCount === 0) {
    toast('No matching properties yet', '');
  } else {
    toast(`🔔 ${matchCount} listing${matchCount > 1 ? 's' : ''} match your alerts!`, 'ok');
  }
}

function openNotifyModal() {
  updatePriceFill('n', 0, 300000);
  renderNotifyAlerts();
  openModal('m-notify');
}

async function saveNotifyAlert() {
  const county = document.querySelector('#nch-county .chip.on')?.textContent?.trim() || 'Anywhere';
  const type = document.querySelector('#nch-type .chip.on')?.textContent?.trim() || 'Any';
  const beds = document.querySelector('#nch-beds .chip.on')?.textContent?.trim() || 'Any';
  const match = document.querySelector('#nch-match .chip.on')?.textContent?.trim() || 'Exact';
  const how = document.querySelector('#nch-how .chip.on')?.textContent?.trim() || '📱 In-app';
  const minV = parseInt(document.getElementById('n-min-input')?.value || 0);
  const maxV = parseInt(document.getElementById('n-max-input')?.value || 300000);

  const fmt = v => v >= 300000 ? '300k+' : v === 0 ? '0' : (v / 1000) + 'k';
  const priceLabel = (minV === 0 && maxV >= 300000) ? 'Any budget' : `KSh ${fmt(minV)}–${fmt(maxV)}`;
  const parts = [];
  if (county !== 'Anywhere') parts.push(county.replace(/^[^ ]+ /, ''));
  parts.push(priceLabel);
  if (type !== 'Any') parts.push(type);
  if (beds !== 'Any') parts.push(beds === 'Studio' ? 'Studio' : beds + ' bed');
  const label = parts.join(' · ');

  const alertData = { county, minV, maxV, type, beds, match, how, label };
  notifyAlerts.push(alertData);
  await saveAlert({ county, min_price: minV, max_price: maxV, property_type: type, beds, match_type: match, notify_how: how });

  const nb = document.getElementById('notify-btn');
  if (nb) nb.classList.add('active');
  closeModal('m-notify');
  toast(`🔔 Alert saved! We'll notify you via ${how.replace(/^[^ ]+ /, '').toLowerCase()}`, 'ok');
}

function renderNotifyAlerts() {
  const section = document.getElementById('notify-active-section');
  const list = document.getElementById('notify-alerts-list');
  if (!notifyAlerts.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  list.innerHTML = notifyAlerts.map((a, i) => `
    <div class="notify-alert-item">
      <div class="notify-alert-label">${a.label}<div class="notify-alert-sub">${a.match} match · via ${a.how.replace(/^[^ ]+ /, '')}</div></div>
      <button class="notify-alert-del" onclick="deleteNotifyAlert(${i})">✕</button>
    </div>
  `).join('');
}

function deleteNotifyAlert(i) {
  notifyAlerts.splice(i, 1);
  renderNotifyAlerts();
  const nb = document.getElementById('notify-btn');
  if (nb) nb.classList.toggle('active', notifyAlerts.length > 0);
  if (!notifyAlerts.length) toast('Alert removed', '');
}

async function loadAlertsFromDB() {
  const { data } = await fetchAlerts();
  if (data && data.length) {
    notifyAlerts = data.map(a => ({
      county: a.county, minV: a.min_price, maxV: a.max_price, type: a.property_type,
      beds: a.beds, match: a.match_type, how: a.notify_how,
      label: `${a.county || 'Anywhere'} · KSh ${a.min_price || 0}–${a.max_price || '300k+'} · ${a.property_type || 'Any'}`
    }));
    const nb = document.getElementById('notify-btn');
    if (nb) nb.classList.toggle('active', notifyAlerts.length > 0);
  }
}

// ═══ MODALS ════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); overlayOpened(); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); overlayClosed(); }
function outsideCloseModal(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }
function overlayClose(e, id) { if (e.target === document.getElementById(id)) { document.getElementById(id).classList.remove('open'); overlayClosed(); } }

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('lightbox').classList.contains('open')) {
    closeLightbox();
    return;
  }
  const openModals = document.querySelectorAll('.modal-bg.open');
  if (openModals.length) { closeModal(openModals[openModals.length - 1].id); return; }
  if (document.getElementById('form-overlay').classList.contains('open')) { confirmClose(); return; }
  if (document.getElementById('detail-overlay').classList.contains('open')) closeDetail();
});
// ═══ BROWSING HISTORY ══════════════════════════════

function trackView(propId) {
  browsingHistory = browsingHistory.filter(h => h.propId !== propId);
  browsingHistory.unshift({ propId, timestamp: Date.now() });
  if (browsingHistory.length > 50) browsingHistory = browsingHistory.slice(0, 50);
  saveHistoryToDB(propId);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' });
}

async function renderHistory() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!browsingHistory.length) { list.innerHTML = ''; empty.style.display = ''; return; }
  empty.style.display = 'none';

  const groups = {};
  browsingHistory.forEach(h => {
    const label = dayLabel(h.timestamp);
    if (!groups[label]) groups[label] = [];
    groups[label].push(h);
  });

  const entries = await Promise.all(Object.entries(groups).map(async ([day, items]) => {
    const itemsHtml = await Promise.all(items.map(async h => {
      const { data: p } = await fetchPropertyById(h.propId);
      if (!p) return '';
      const photos = Array.isArray(p.photos) ? p.photos : [];
      const img = photos.length ? photos[0] : '';
      const price = typeof p.price === 'number' ? `KSh ${p.price.toLocaleString()}` : p.price;
      const title = p.title || 'Untitled';
      const loc = p.location ?? p.loc ?? '';
      const beds = p.bedrooms ?? p.beds ?? 0;
      const bedLabel = beds === 0 ? 'Studio' : beds + ' bed';
      return `
        <div class="hcard" onclick="openDetail(${h.propId})">
          <img class="hcard-img" src="${img}" alt="">
          <div class="hcard-body">
            <div class="hcard-price">${price}</div>
            <div class="hcard-title">${title}</div>
            <div class="hcard-meta"><span>📍 ${loc}</span><span>· ${bedLabel} · ${p.baths} bath</span></div>
          </div>
          <div class="hcard-time">${timeAgo(h.timestamp)}</div>
          <button class="hcard-remove" title="Remove" onclick="event.stopPropagation();removeHistory(${h.propId})">✕</button>
        </div>`;
    }));
    return `<div class="history-day"><div class="history-day-label">${day}</div>${itemsHtml.join('')}</div>`;
  }));

  list.innerHTML = entries.join('');
}
async function renderBookings() {
  const list = document.getElementById('bookings-list');
  const empty = document.getElementById('bookings-empty');
  if (!list) return;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { list.innerHTML = ''; empty.style.display = ''; return; }

  const { data: bookings, error } = await supabaseClient
    .from('bookings')
    .select('id, booked_at, status, property_id')
    .eq('tenant_id', user.id)
    .order('booked_at', { ascending: false });

  if (error || !bookings || bookings.length === 0) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';

  const bookingHTML = await Promise.all(bookings.map(async b => {
    const { data: p } = await supabaseClient
      .from('properties')
      .select('id, title, price, photos')
      .eq('id', b.property_id)
      .single();

    if (!p) return '';

    const photos = Array.isArray(p.photos) ? p.photos : [];
    const img = photos.length ? photos[0] : '';
    const price = typeof p.price === 'number' ? `KSh ${p.price.toLocaleString()}` : (p.price || '');
    const title = p.title || 'Untitled';
    const statusLabel = b.status === 'pending' ? '🕐 Pending' : b.status === 'confirmed' ? '✅ Confirmed' : '⏰ Expired';
    const dateStr = new Date(b.booked_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

    return `
      <div class="hcard" style="cursor:default;">
        <img class="hcard-img" src="${img}" alt="">
        <div class="hcard-body">
          <div class="hcard-price">${price}</div>
          <div class="hcard-title">${title}</div>
          <div class="hcard-meta"><span>Booked ${dateStr}</span></div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px;">${statusLabel}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
          <button class="book-btn" style="width:auto;padding:8px 16px;font-size:13px;" onclick="openReviewModal('${b.property_id}', '${b.id}')">⭐ Rate</button>
          <button style="width:auto;padding:6px 14px;font-size:11px;background:none;border:1.5px solid rgba(196,81,42,.25);color:var(--terra);border-radius:8px;cursor:pointer;font-weight:600;" onclick="event.stopPropagation();removeBooking(${b.id})">✕ Remove</button>
        </div>
      </div>
    `;
  }));

  list.innerHTML = bookingHTML.join('');
}

async function removeBooking(bookingId) {
  if (!confirm('Remove this booking from your list?')) return;
  const { error } = await supabaseClient.from('bookings').delete().eq('id', bookingId);
  if (error) { toast('Failed to remove.', 'err'); return; }
  toast('Booking removed.', 'ok');
  renderBookings();
}

function removeHistory(propId) {
  browsingHistory = browsingHistory.filter(h => h.propId !== propId);
  renderHistory();
  if (!browsingHistory.length) toast('History cleared', '');
}
async function clearHistory() {
  browsingHistory = [];
  await clearHistoryInDB();
  renderHistory();
  toast('History cleared', '');
}

async function loadHistoryFromDB() {
  const { data } = await fetchBrowsingHistory();
  if (data && data.length) {
    browsingHistory = data.map(row => ({ propId: row.property_id, timestamp: new Date(row.viewed_at).getTime() }));
  }
}

// ═══ DELETE ACCOUNT ════════════════════════════════

function showDeleteConfirm() {
  document.getElementById('delete-confirm-step').style.display = 'none';
  document.getElementById('delete-type-step').style.display = '';
  document.getElementById('delete-confirm-input').value = '';
  document.getElementById('delete-final-btn').disabled = true;
  document.getElementById('delete-final-btn').style.opacity = '.4';
}

function checkDeleteInput(el) {
  const valid = el.value.trim() === 'DELETE';
  el.classList.toggle('valid', valid);
  document.getElementById('delete-final-btn').disabled = !valid;
  document.getElementById('delete-final-btn').style.opacity = valid ? '1' : '.4';
}

function resetDeleteModal() {
  document.getElementById('delete-confirm-step').style.display = '';
  document.getElementById('delete-type-step').style.display = 'none';
  document.getElementById('delete-confirm-input').value = '';
}

async function doDeleteAccount() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { closeModal('m-delete-account'); resetDeleteModal(); doLogout(); return; }

  try {
    // 1. Delete all photos from storage for each property owned
    const { data: myProps } = await supabaseClient
      .from('properties')
      .select('id, photos')
      .eq('landlord_id', user.id);

    if (myProps && myProps.length) {
      for (const prop of myProps) {
        const photos = Array.isArray(prop.photos) ? prop.photos : (typeof prop.photos === 'string' ? JSON.parse(prop.photos || '[]') : []);
        for (const url of photos) {
          const path = url.split('/').pop();
          if (path) {
            await supabaseClient.storage.from(ENEO_CONFIG.storageBucket).remove(['properties/' + path]);
          }
        }
      }
    }

    // 2. Delete saved properties & browsing history & reviews
    await supabaseClient.from('saved_properties').delete().eq('user_id', user.id);
    await supabaseClient.from('browsing_history').delete().eq('user_id', user.id);
    await supabaseClient.from('notify_alerts').delete().eq('user_id', user.id);
    await supabaseClient.from('reviews').delete().eq('reviewer_id', user.id);
    await supabaseClient.from('reviews').delete().eq('landlord_id', user.id);

    // 3. Delete bookings made by this user
    await supabaseClient.from('bookings').delete().eq('tenant_id', user.id);

    // 4. Delete properties (cascades to bookings on those properties)
    await supabaseClient.from('properties').delete().eq('landlord_id', user.id);

    // 5. Delete user from public.users (must be before auth.users due to FK)
    await supabaseClient.from('users').delete().eq('id', user.id);

    // 6. Sign out (this removes the session, auth.user deletion handled by Supabase)
    await signOut();

    closeModal('m-delete-account');
    resetDeleteModal();
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    savedProps = []; browsingHistory = []; notifyAlerts = [];
    updateSavedCountBadge();
    toast('🗑️ Account permanently deleted', 'ok');

  } catch (err) {
    toast('Failed to delete account. Please try again.', 'err');
    console.error('Delete account error:', err);
  }
}

// ═══ FORGOT PASSWORD ═══════════════════════════════

async function forgotPassword() {
  const email = prompt('Enter your email to receive a reset link:');
  if (!email) return;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
  if (error) toast(error.message || 'Failed to send reset email.', 'err');
  else toast('📧 Reset link sent! Check your email.', 'ok');
}

// ═══ GOOGLE SIGN-IN ════════════════════════════════

async function signInWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin  // redirect back to root, not window.location.href
    }
  });
  if (error) toast(error.message || 'Google sign-in failed.', 'err');
}

// ═══ TOAST ═════════════════════════════════════════

function toast(msg, type) {
  const el = document.getElementById('toast-el');
  el.textContent = msg;
  el.className = 'toast ' + (type || '');
  clearTimeout(_tt);
  requestAnimationFrame(() => el.classList.add('vis'));
  _tt = setTimeout(() => el.classList.remove('vis'), 2800);
}

// ═══ SMOOTH MOMENTUM SCROLL ════════════════════════

(function initMomentumScroll() {
  const SELECTORS = ['.content-area', '.detail-scroll', '.form-scroll', '.modal-card', '.login-right', '.featured-scroll'];

  function applyMomentum(el) {
    if (!el || el._ms) return;
    el._ms = true;
    let drag = false, sy = 0, sx = 0, vy = 0, vx = 0, ly = 0, lx = 0, lt = 0, raf = null;
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

    el.addEventListener('mousedown', e => {
      stop(); drag = true; sy = e.clientY + el.scrollTop; sx = e.clientX + el.scrollLeft;
      ly = e.clientY; lx = e.clientX; lt = Date.now(); vy = vx = 0;
      el.style.cursor = 'grabbing'; el.style.userSelect = 'none';
    }, { passive: true });

    window.addEventListener('mousemove', e => {
      if (!drag) return;
      const now = Date.now(), dt = Math.max(now - lt, 1);
      vy = (ly - e.clientY) / dt * 14; vx = (lx - e.clientX) / dt * 14;
      ly = e.clientY; lx = e.clientX; lt = now;
      el.scrollTop = sy - e.clientY; el.scrollLeft = sx - e.clientX;
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (!drag) return;
      drag = false; el.style.cursor = ''; el.style.userSelect = '';
      (function coast() {
        vy *= 0.88; vx *= 0.88;
        if (Math.abs(vy) < 0.25 && Math.abs(vx) < 0.25) { stop(); return; }
        el.scrollTop += vy; el.scrollLeft += vx;
        raf = requestAnimationFrame(coast);
      })();
    }, { passive: true });

    el.addEventListener('wheel', e => {
      if (e.deltaMode !== 0) return;
      stop(); vy = e.deltaY * 0.6; vx = e.deltaX * 0.6;
      (function glide() {
        vy *= 0.84; vx *= 0.84;
        if (Math.abs(vy) < 0.3 && Math.abs(vx) < 0.3) { stop(); return; }
        el.scrollTop += vy; el.scrollLeft += vx;
        raf = requestAnimationFrame(glide);
      })();
    }, { passive: true });
  }

  function initAll() { SELECTORS.forEach(s => document.querySelectorAll(s).forEach(applyMomentum)); }
  document.addEventListener('DOMContentLoaded', initAll);
  window.addEventListener('load', initAll);
  new MutationObserver(initAll).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();