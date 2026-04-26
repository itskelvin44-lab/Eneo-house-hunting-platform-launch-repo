// ═══ SUPABASE CLIENT INITIALIZATION ══════════════

let supabaseClient = null;

function initSupabase() {
  if (!ENEO_CONFIG.useMockData || !ENEO_CONFIG.useMockAuth) {
    if (ENEO_CONFIG.supabaseUrl.includes('YOUR-PROJECT-ID')) {
      console.warn('⚠️ Supabase not configured — using mock mode. Update js/config.js with your project URL and anon key.');
      return null;
    }
    supabaseClient = window.supabaseClient.createClient(ENEO_CONFIG.supabaseUrl, ENEO_CONFIG.supabaseAnonKey);
    console.log('✅ Supabase client initialized');
    return supabaseClient;
  }
  console.log('📦 Running in mock mode');
  return null;
}

// Initialize on load
supabaseClient = initSupabase();

// ═══ DATA LAYER ═══════════════════════════════════
// All data access goes through these functions.
// They check ENEO_CONFIG.useMockData to decide whether
// to return mock data or query supabaseClient.

// ═══ MOCK DATA ═══════════════════════════════════

const MOCK_PROPS = [
  {
    id: 0,
    price: 'KSh 45,000',
    title: 'Modern 2BR Apartment with City Views',
    loc: '200m from Yaya Centre, Kilimani',
    lat: -1.2928,
    lng: 36.7873,
    beds: 2,
    baths: 1.5,
    area: '72m²',
    type: 'Apartment',
    isNew: true,
    desc: 'A beautifully maintained apartment on the 6th floor with panoramic city views. Fitted kitchen with granite countertops. Secure compound with 24hr guard, ample parking, borehole water, and backup generator. Walking distance to Yaya Centre, Junction Mall, and several top restaurants. Quiet and ideal for a professional or small family.',
    photos: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80',
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=900&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=900&q=80'
    ],
    landlord: {
      name: 'Jane Mwangi',
      initials: 'JM',
      rating: 4.7,
      totalRatings: 14,
      isTrusted: true,
      totalPosted: 12,
      totalBooked: 8,
      responseRate: 94,
      reviews: [
        { stars: 5, text: 'Exactly as described. Very responsive on calls.', author: 'Peter K.', time: '3 days ago' },
        { stars: 4, text: 'Good apartment. Slightly smaller than photos.', author: 'Amina W.', time: '1 week ago' }
      ]
    },
    activity: { views: 243, saves: 18, bookings: 3 }
  },
  {
    id: 1,
    price: 'KSh 28,000',
    title: 'Cozy Studio — Excellent Value',
    loc: 'Near South B Shopping Centre',
    lat: -1.3139,
    lng: 36.8319,
    beds: 0,
    baths: 1,
    area: '38m²',
    type: 'Studio',
    isNew: false,
    desc: 'A neat, self-contained studio perfect for a single professional or student. Built-in wardrobe, fitted kitchen unit, tiled bathroom with hot shower, and internet-ready. The estate has CCTV, gated access, and clean shared laundry. South B is well-connected — buses to CBD take 15 minutes. Water and bin collection included in rent.',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80'
    ],
    landlord: {
      name: 'David Omari',
      initials: 'DO',
      rating: 3.8,
      totalRatings: 6,
      isTrusted: false,
      totalPosted: 4,
      totalBooked: 3,
      responseRate: 67,
      reviews: [
        { stars: 4, text: 'Decent place. Took a while to respond but eventually showed up.', author: 'Grace M.', time: '2 weeks ago' },
        { stars: 3, text: 'Photos made it look bigger. Okay for the price.', author: 'Brian T.', time: '1 month ago' }
      ]
    },
    activity: { views: 89, saves: 5, bookings: 1 }
  },
  {
    id: 2,
    price: 'KSh 85,000',
    title: 'Elegant 3BR Townhouse with Garden',
    loc: '5 min from Karen Shopping Centre',
    lat: -1.3333,
    lng: 36.7119,
    beds: 3,
    baths: 2,
    area: '145m²',
    type: 'Townhouse',
    isNew: false,
    desc: 'A spacious, well-finished townhouse in a quiet Karen gated community. Features 3 large bedrooms, en-suite master, fully equipped kitchen with breakfast bar, private garden, and domestic room. The compound has 24hr security, shared swimming pool, and 2 parking slots. Estate maintenance fee included. Ideal for families or expats.',
    photos: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=900&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80'
    ],
    landlord: {
      name: 'Jane Mwangi',
      initials: 'JM',
      rating: 4.7,
      totalRatings: 14,
      isTrusted: true,
      totalPosted: 12,
      totalBooked: 8,
      responseRate: 94,
      reviews: [
        { stars: 5, text: 'Exactly as described. Very responsive on calls.', author: 'Peter K.', time: '3 days ago' },
        { stars: 5, text: 'Beautiful garden. Kids love it.', author: 'Amina W.', time: '1 week ago' }
      ]
    },
    activity: { views: 156, saves: 12, bookings: 2 }
  },
  {
    id: 3,
    price: 'KSh 35,000',
    title: 'Bright 1BR near Westlands Roundabout',
    loc: '400m from Sarit Centre, Westlands',
    lat: -1.268,
    lng: 36.81,
    beds: 1,
    baths: 1,
    area: '48m²',
    type: 'Apartment',
    isNew: true,
    desc: 'A modern, bright one-bedroom apartment on the 3rd floor. Large windows let in natural light all day. Fitted wardrobe, tiled floor, modern bathroom, and compact but functional kitchen. 24hr security, elevator, CCTV, and a rooftop terrace. 5-minute walk to Sarit Centre and excellent matatu routes to the CBD.',
    photos: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80'
    ],
    landlord: {
      name: 'Sarah Wanjiku',
      initials: 'SW',
      rating: 4.9,
      totalRatings: 22,
      isTrusted: true,
      totalPosted: 8,
      totalBooked: 19,
      responseRate: 98,
      reviews: [
        { stars: 5, text: 'Perfect! Showed up early and the place was spotless.', author: 'Kevin O.', time: '5 days ago' },
        { stars: 5, text: 'Best landlord I have dealt with. Very professional.', author: 'Mary A.', time: '2 weeks ago' }
      ]
    },
    activity: { views: 310, saves: 27, bookings: 6 }
  }
];

// ── Data Access Functions ────────────────────────

// Fetch all active properties
async function fetchProperties(filters = {}) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    let results = [...MOCK_PROPS];
    
    // Basic client-side filtering for mock mode
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.loc.toLowerCase().includes(q)
      );
    }
    if (filters.minPrice) {
      results = results.filter(p => parseInt(p.price.replace(/[^0-9]/g, '')) >= filters.minPrice);
    }
    if (filters.maxPrice) {
      results = results.filter(p => parseInt(p.price.replace(/[^0-9]/g, '')) <= filters.maxPrice);
    }
    if (filters.beds && filters.beds !== 'Any') {
      if (filters.beds === 'Studio') {
        results = results.filter(p => p.beds === 0);
      } else if (filters.beds === '4+') {
        results = results.filter(p => p.beds >= 4);
      } else {
        results = results.filter(p => p.beds === parseInt(filters.beds));
      }
    }
    if (filters.baths && filters.baths !== 'Any') {
      if (filters.baths === '3+') {
        results = results.filter(p => p.baths >= 3);
      } else {
        results = results.filter(p => p.baths === parseFloat(filters.baths));
      }
    }
    return { data: results, error: null };
  }
  
  // Real Supabase query
  let query = supabaseClient.from('properties').select('*').eq('status', 'active');
  
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,loc.ilike.%${filters.search}%`);
  }
  if (filters.minPrice) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
  if (filters.beds && filters.beds !== 'Any') {
    if (filters.beds === 'Studio') query = query.eq('beds', 0);
    else if (filters.beds === '4+') query = query.gte('beds', 4);
    else query = query.eq('beds', parseInt(filters.beds));
  }
  if (filters.baths && filters.baths !== 'Any') {
    if (filters.baths === '3+') query = query.gte('baths', 3);
    else query = query.eq('baths', parseFloat(filters.baths));
  }
  
  query = query.order('created_at', { ascending: false });
  
  return await query;
}

// Fetch a single property by ID
async function fetchPropertyById(id) {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    const prop = MOCK_PROPS.find(p => p.id === id);
    return { data: prop || null, error: prop ? null : 'Not found' };
  }
  return await supabaseClient.from('properties').select('*').eq('id', id).single();
}

// Fetch current user's properties (for My Listings)
async function fetchMyProperties() {
  if (ENEO_CONFIG.useMockData || !supabaseClient) {
    return { data: MOCK_PROPS.slice(0, 2), error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return { data: [], error: 'Not authenticated' };
  return await supabaseClient.from('properties').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false });
}

// Create a booking
async function createBooking(propertyId) {
  if (ENEO_CONFIG.useMockData || !supabaseClient || ENEO_CONFIG.useMockAuth) {
    return { data: { id: Date.now() }, error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  return await supabaseClient.from('bookings').insert({
    property_id: propertyId,
    tenant_id: user.id,
    status: 'pending'
  });
}

// Save a notification alert
async function saveAlert(alertData) {
  if (ENEO_CONFIG.useMockData || !supabaseClient || ENEO_CONFIG.useMockAuth) {
    return { data: { id: Date.now() }, error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  return await supabaseClient.from('notify_alerts').insert({
    ...alertData,
    user_id: user.id
  });
}

// Fetch user's saved alerts
async function fetchAlerts() {
  if (ENEO_CONFIG.useMockData || !supabaseClient || ENEO_CONFIG.useMockAuth) {
    return { data: [], error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  return await supabaseClient.from('notify_alerts').select('*').eq('user_id', user.id);
}

// Sign up new user
async function signUp(email, password, name, phone) {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { data: { user: { id: 'mock-user-id', email } }, error: null };
  }
  return await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, phone }
    }
  });
}

// Sign in existing user
async function signIn(email, password) {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { data: { user: { id: 'mock-user-id', email } }, error: null };
  }
  return await supabaseClient.auth.signInWithPassword({ email, password });
}

// Sign out
async function signOut() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { error: null };
  }
  return await supabaseClient.auth.signOut();
}

// Get current user
async function getCurrentUser() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { user: { id: 'mock-user-id', email: 'jane.mwangi@gmail.com', user_metadata: { full_name: 'Jane Mwangi', phone: '+254 712 345 678' } } };
  }
  const { data } = await supabaseClient.auth.getUser();
  return data;
}

// Get user profile
async function getUserProfile() {
  if (ENEO_CONFIG.useMockAuth || !supabaseClient) {
    return { data: { account_id: 'usr_abc123xyz', name: 'Jane Mwangi', phone: '+254 712 345 678' }, error: null };
  }
  const { data: { user } } = await supabaseClient.auth.getUser();
  return await supabaseClient.from('users').select('*').eq('id', user.id).single();
}

// ═══ COMPATIBILITY ALIAS ══════════════════════════
const PROPS = MOCK_PROPS;

// ═══ APPLICATION STATE ════════════════════════════

let curProp = null;
let booked = false;
let photosAdded = false;
let locDone = false;
let savedProps = [];
let overlayCount = 0;
let browsingHistory = []; // [{propId, timestamp}]
let notifyAlerts = []; // Saved notification alerts
let nearMeActive = false;
let _tt; // Toast timeout reference

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

// Apply saved preference on load
(function initDarkMode() {
  const saved = localStorage.getItem('eneo-dark');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved !== null ? saved === '1' : prefersDark;
  if (isDark) document.documentElement.classList.add('dark');
  updateDarkUI(isDark);
})();

// ═══ LOGIN / LOGOUT ════════════════════════════════

async function doLogin(btn) {
  btn.innerHTML = '<span class="spin"></span> Signing in...';
  btn.disabled = true;

  // Get email/password from the active form
  const isSignIn = document.getElementById('form-in').style.display !== 'none';
  const formId = isSignIn ? 'form-in' : 'form-up';
  const form = document.getElementById(formId);
  const email = form.querySelector('input[type="email"]').value;
  const password = form.querySelector('input[type="password"]').value;

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
    toast(result.error.message || 'Login failed. Try again.', 'err');
    btn.innerHTML = isSignIn ? 'Sign In →' : 'Create Account →';
    btn.disabled = false;
    return;
  }

  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  renderFeed();
  updateSavedCountBadge();
  toast('Welcome to Eneo! 👋', 'ok');
}

async function doLogout() {
  await signOut();
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  // Reset state
  savedProps = [];
  browsingHistory = [];
  notifyAlerts = [];
  updateSavedCountBadge();
  toast('Signed out', 'ok');
}

// ═══ NAVIGATION ═══════════════════════════════════

function switchNav(m) {
  const modes = ['feed', 'posting', 'saved', 'history', 'account'];
  modes.forEach(k => {
    const page = document.getElementById('p-' + k);
    if (page) page.style.display = k === m ? '' : 'none';
    const snav = document.getElementById('snav-' + k);
    if (snav) snav.classList.toggle('active', k === m);
  });

  // Sync bottom mobile nav
  modes.forEach(k => {
    const mb = document.getElementById('mbnav-' + k);
    if (mb) mb.classList.toggle('active', k === m);
  });

  // Topbar titles
  const titles = {
    feed: 'Explore Listings',
    posting: 'My Listings',
    saved: 'Saved Properties',
    history: 'Browsing History',
    account: 'Account Settings'
  };
  document.getElementById('topbar-title').textContent = titles[m];

  const act = document.getElementById('topbar-actions');
  if (m === 'feed') {
    act.innerHTML = `
      <div class="tbar-chip" onclick="toast('📍 Westlands, Nairobi','ok')">📍 Westlands</div>
      <button class="tbar-icon-btn" onclick="toast('No new notifications','')">🔔</button>
    `;
  } else if (m === 'posting') {
    act.innerHTML = `
      <button class="new-post-btn" style="font-size:13px;padding:9px 16px;" onclick="openPostForm()">+ New Listing</button>
    `;
  } else if (m === 'saved') {
    act.innerHTML = `<button class="tbar-icon-btn" onclick="switchNav('feed')" title="Browse">🏠</button>`;
    renderSavedWorkspace();
  } else if (m === 'history') {
    act.innerHTML = `<button class="tbar-icon-btn" onclick="switchNav('feed')" title="Browse">🏠</button>`;
    renderHistory();
  } else {
    act.innerHTML = '';
  }

  // Render appropriate content
  if (m === 'feed') renderFeed();
  if (m === 'posting') renderPosting();
  if (m === 'saved') renderSavedWorkspace();
  if (m === 'history') renderHistory();
  if (m === 'account') renderAccount();

  document.getElementById('content-area').scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══ RENDER FEED ═══════════════════════════════════

async function renderFeed() {
  // Fetch properties from data layer
  const { data: properties, error } = await fetchProperties();
  
  if (error || !properties || properties.length === 0) {
    // Fallback to PROPS if fetch fails
    console.warn('Fetch failed, using PROPS fallback');
  }
  
  const props = properties && properties.length ? properties : PROPS;

  // Featured scroll
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
        <div class="feat-img">
          <img src="${prop.photos[0]}" alt="">
          <span class="feat-tag" style="${color}">${tag}</span>
        </div>
        <div class="feat-body">
          <div class="feat-price">${prop.price}<span style="font-size:11px;color:var(--text3);font-weight:400">/mo</span></div>
          <div class="feat-sub">🛏 ${prop.beds === 0 ? 'Studio' : prop.beds + 'BR'} &nbsp;·&nbsp; 📍 ${getNeighborhood(prop.loc)}</div>
        </div>
      </div>
    `).join('');
  }

  // Property grid
  const propGrid = document.getElementById('prop-grid');
  if (propGrid) {
    propGrid.innerHTML = props.map(p => createPropertyCardHTML(p)).join('');
  }

  // Re-attach save toggle states
  updateAllSaveToggles();
}

function getNeighborhood(loc) {
  const hoods = ['Kilimani', 'Westlands', 'Karen', 'South B', 'South C', 'Lavington', 'Kileleshwa'];
  for (const h of hoods) {
    if (loc.includes(h)) return h;
  }
  return loc.split(',')[0] || loc;
}

function createPropertyCardHTML(p) {
  const bedLabel = p.beds === 0 ? 'Studio' : p.beds;
  const badgeHTML = p.isNew
    ? '<span class="badge green">✨ New</span>'
    : '<span class="badge terra">🔥 Popular</span>';

  const dotsHTML = p.photos.map((_, i) =>
    `<span class="gdot${i === 0 ? ' active' : ''}"></span>`
  ).join('');

  const photosHTML = p.photos.map(src =>
    `<img src="${src}" alt="">`
  ).join('');

  return `
    <div class="pcard" data-prop-id="${p.id}" onclick="openDetail(${p.id})">
      <div class="pcard-img">
        <div class="pcard-gallery">
          ${photosHTML}
        </div>
        <div class="gallery-nav-dots">
          ${dotsHTML}
        </div>
        <button class="gal-arrow gal-prev" onclick="event.stopPropagation();galScroll(this,-1)">‹</button>
        <button class="gal-arrow gal-next" onclick="event.stopPropagation();galScroll(this,1)">›</button>
        <div class="pcard-overlay"></div>
        <div class="pcard-badges">
          ${badgeHTML}
          <span class="badge">🐾 Pets OK</span>
        </div>
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

function renderPosting() {
  // Active listings
  const ptActive = document.getElementById('pt-active');
  if (ptActive) {
    ptActive.innerHTML = `
      <div class="lcard">
        <div class="lcard-head">
          <img class="lthumb" src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=200&q=75" alt="">
          <div class="lmeta">
            <div class="ltitle">Modern 2BR Apartment, Kilimani</div>
            <div class="lprice">KSh 45,000/mo</div>
            <div class="ldate">📅 Posted 2 days ago</div>
          </div>
        </div>
        <div class="lcard-strip">
          <div class="ls">👁 <b>143</b>&nbsp;views</div>
          <div class="ls">📋 <b>2</b>&nbsp;bookings</div>
          <div class="ls" style="color:var(--terra)">⏱ 22hrs left</div>
        </div>
        <div class="booking-row">
          <div class="bk-av">JM</div>
          <div class="bk-info">
            <div class="bk-name">Jane Mwangi</div>
            <div class="bk-time">Booked 2 hrs ago · +254 712 345 678</div>
          </div>
          <button class="bk-call" onclick="toast('📞 Calling Jane Mwangi...','ok')">📞 Call</button>
        </div>
        <div class="booking-row">
          <div class="bk-av">AO</div>
          <div class="bk-info">
            <div class="bk-name">Alex Odhiambo</div>
            <div class="bk-time">Booked 5 hrs ago · +254 722 987 654</div>
          </div>
          <button class="bk-call" onclick="toast('📞 Calling Alex Odhiambo...','ok')">📞 Call</button>
        </div>
        <div class="lcard-actions">
          <button class="laction la-edit" onclick="openPostForm()">✏️ Edit</button>
          <button class="laction la-down" onclick="toast('Property taken down','err')">⬇️ Take Down</button>
        </div>
      </div>

      <div class="lcard">
        <div class="lcard-head">
          <img class="lthumb" src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&q=75" alt="">
          <div class="lmeta">
            <div class="ltitle">3BR Townhouse, Karen</div>
            <div class="lprice">KSh 85,000/mo</div>
            <div class="ldate">📅 Posted 6 days ago</div>
          </div>
        </div>
        <div class="lcard-strip">
          <div class="ls">👁 <b>67</b>&nbsp;views</div>
          <div class="ls">📋 <b>0</b>&nbsp;bookings</div>
          <div class="ls" style="color:var(--forest)">✅ Active</div>
        </div>
        <div style="padding:14px 16px;font-size:13px;color:var(--text3);border-top:1px solid var(--cream2);">
          No bookings yet. Good things take time — your tenant is looking.
        </div>
        <div class="lcard-actions">
          <button class="laction la-edit" onclick="openPostForm()">✏️ Edit</button>
          <button class="laction la-down" onclick="toast('Property taken down','err')">⬇️ Take Down</button>
        </div>
      </div>
    `;
  }

  // Drafts
  const ptDrafts = document.getElementById('pt-drafts');
  if (ptDrafts) {
    ptDrafts.innerHTML = `
      <div class="listings-grid">
        <div class="lcard" style="display:flex;align-items:center;gap:14px;padding:16px;">
          <img class="lthumb" src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&q=75" alt="">
          <div style="flex:1;min-width:0;">
            <div class="ltitle">Westlands 1BR (Draft)</div>
            <div class="ldate" style="margin-top:4px;">Last edited yesterday</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="laction la-edit" style="width:72px" onclick="openPostForm()">✏️ Edit</button>
            <button class="laction la-down" style="width:72px" onclick="toast('Draft deleted','err')">🗑️ Delete</button>
          </div>
        </div>
      </div>
      <div class="empty-box" style="padding-top:16px;">
        <p>Drafts let you finish a listing at your own pace.</p>
      </div>
    `;
  }
}

// ═══ RENDER ACCOUNT ════════════════════════════════

function renderAccount() {
  const acctSavedCount = document.getElementById('acct-saved-count');
  if (acctSavedCount) {
    acctSavedCount.textContent = savedProps.length + ' saved';
  }
}

// ═══ POSTING TABS ══════════════════════════════════

function ptab(t, el) {
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['active', 'drafts', 'removed'].forEach(k => {
    const tab = document.getElementById('pt-' + k);
    if (tab) tab.style.display = k === t ? '' : 'none';
  });
}

// ═══ IMAGE COMPRESSION (Canvas API) ════════════════

async function compressImage(file, maxSizeKB = 200) {
  return new Promise((resolve, reject) => {
    // Memory safety check — reject images over ~12 megapixels
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const megapixels = (img.width * img.height) / 1000000;
        if (megapixels > 12) {
          reject(new Error('Image too large. Please use a photo under 12 megapixels.'));
          return;
        }

        // Calculate target dimensions (max 1200px)
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG at 0.7 quality — strips EXIF automatically
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg'
            });
            console.log(`📸 Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
// ═══ POST FORM ═════════════════════════════════════

function openPostForm() {
  photosAdded = false;
  locDone = false;
  ['f-title', 'f-desc', 'f-beds', 'f-baths', 'f-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('thumb-grid').innerHTML = '';
  document.getElementById('pz').style.display = '';
  document.getElementById('lo-gps').className = 'loc-option lo-green';
  document.getElementById('lo-gps').innerHTML = `
    <span class="lo-icon">📍</span>
    <span>
      <span class="lo-main">Use my current location</span>
      <span class="lo-sub">Easiest if you're at the property right now</span>
    </span>
  `;
  document.getElementById('lo-manual').className = 'loc-option lo-neutral';
  document.getElementById('lo-manual').innerHTML = `
    <span class="lo-icon">🗺️</span>
    <span>
      <span class="lo-main">Enter coordinates manually</span>
      <span class="lo-sub">If you're far away or on a VPN</span>
    </span>
  `;
  document.getElementById('loc-msg').textContent = '';
  document.getElementById('form-progress').textContent = '0 / 5';
  document.getElementById('submit-btn').innerHTML = '🚀 &nbsp;Post Property';
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('form-overlay').classList.add('open');
  overlayOpened();
}

function confirmClose() {
  const title = document.getElementById('f-title').value;
  const desc = document.getElementById('f-desc').value;
  const has = title || desc || photosAdded;
  if (has) {
    openModal('m-cancel');
  } else {
    document.getElementById('form-overlay').classList.remove('open');
    overlayClosed();
  }
}

function saveDraft() {
  closeModal('m-cancel');
  document.getElementById('form-overlay').classList.remove('open');
  overlayClosed();
  toast('💾 Saved as draft', 'ok');
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
  const progress = fields.filter(Boolean).length;
  document.getElementById('form-progress').textContent = progress + ' / 5';
}

function addPhotos() {
  // Create a hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = async function() {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    photosAdded = true;
    document.getElementById('pz').style.display = 'none';
    const grid = document.getElementById('thumb-grid');
    
    // Show spinner placeholders
    grid.innerHTML = files.map((_, i) => `
      <div class="thumb-item" id="thumb-${i}">
        <div class="spin" style="border-color:rgba(27,77,52,.2);border-top-color:var(--forest);margin:auto;"></div>
      </div>
    `).join('') + `
      <div class="thumb-add" onclick="addPhotos()">+</div>
    `;

    // Compress each image
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        const url = URL.createObjectURL(compressed);
        const thumbEl = document.getElementById('thumb-' + i);
        if (thumbEl) {
          thumbEl.innerHTML = `
            <img src="${url}" alt="">
            <div class="thumb-x" onclick="removeThumb(this)">✕</div>
          `;
          // Store compressed file for later upload
          thumbEl._compressedFile = compressed;
        }
      } catch (err) {
        toast(err.message || 'Failed to compress image', 'err');
        const thumbEl = document.getElementById('thumb-' + i);
        if (thumbEl) thumbEl.remove();
      }
    }
    updateProgress();
  };
  input.click();
}

function removeThumb(el) {
  el.parentElement.remove();
  if (!document.querySelector('.thumb-item')) {
    photosAdded = false;
    document.getElementById('pz').style.display = '';
    document.getElementById('thumb-grid').innerHTML = '';
    updateProgress();
  }
}

function captureGPS() {
  const btn = document.getElementById('lo-gps');
  
  if (!navigator.geolocation) {
    toast('Geolocation not supported by your browser. Use manual entry.', 'err');
    return;
  }

  btn.innerHTML = `
    <span class="lo-icon">
      <span class="spin" style="border:2.5px solid rgba(27,77,52,.25);border-top-color:var(--forest)"></span>
    </span>
    <span><span class="lo-main">Detecting location...</span></span>
  `;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locDone = true;
      btn.className = 'loc-option lo-captured';
      btn.innerHTML = `
        <span class="lo-icon">✓</span>
        <span>
          <span class="lo-main">Location captured</span>
          <span class="lo-sub">Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}</span>
        </span>
      `;
      // Store coordinates for submission
      btn._coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      toast('📍 Location captured!', 'ok');
      updateProgress();
    },
    (error) => {
      btn.className = 'loc-option lo-green';
      btn.innerHTML = `
        <span class="lo-icon">📍</span>
        <span>
          <span class="lo-main">Use my current location</span>
          <span class="lo-sub">Easiest if you're at the property right now</span>
        </span>
      `;
      if (error.code === error.PERMISSION_DENIED) {
        toast('Location access denied. Please use manual entry.', 'err');
      } else {
        toast('Could not detect location. Please use manual entry.', 'err');
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function checkCoords() {
  const v = document.getElementById('coord-in').value.trim();
  const ok = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(v);
  const hint = document.getElementById('coord-hint');
  const btn = document.getElementById('cb-save');
  if (ok) {
    hint.style.color = 'var(--forest)';
    hint.textContent = '✓ Valid format';
    btn.classList.add('ready');
  } else if (v.length > 0) {
    hint.style.color = 'var(--terra)';
    hint.textContent = 'Invalid. Use: -1.2864, 36.8172';
    btn.classList.remove('ready');
  } else {
    hint.style.color = 'var(--text4)';
    hint.textContent = 'Paste latitude and longitude separated by a comma';
    btn.classList.remove('ready');
  }
}

function saveCoords() {
  const v = document.getElementById('coord-in').value.trim();
  locDone = true;
  closeModal('m-coords');
  const btn = document.getElementById('lo-manual');
  btn.className = 'loc-option lo-captured';
  btn.innerHTML = `
    <span class="lo-icon">✓</span>
    <span>
      <span class="lo-main">Coordinates saved</span>
      <span class="lo-sub">${v}</span>
    </span>
  `;
  toast('🗺️ Coordinates saved!', 'ok');
  updateProgress();
}

async function submitPost() {
  const title = document.getElementById('f-title').value;
  const price = document.getElementById('f-price').value;
  const desc = document.getElementById('f-desc').value;
  const beds = parseInt(document.getElementById('f-beds').value) || 0;
  const baths = parseFloat(document.getElementById('f-baths').value) || 0;

  if (!title || !price) {
    toast('Please fill in title and price', 'err');
    return;
  }
  if (!photosAdded) {
    toast('📸 Add at least one photo', 'err');
    return;
  }
  if (!locDone) {
    toast('📍 Add property location first', 'err');
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.innerHTML = '<span class="spin"></span> &nbsp;Posting...';
  btn.disabled = true;

  // Get coordinates
  let lat, lng;
  const gpsBtn = document.getElementById('lo-gps');
  if (gpsBtn._coords) {
    lat = gpsBtn._coords.lat;
    lng = gpsBtn._coords.lng;
  } else {
    // Parse from manual entry
    const coordText = document.getElementById('coord-in')?.value || '';
    const parts = coordText.split(',').map(s => parseFloat(s.trim()));
    lat = parts[0];
    lng = parts[1];
  }

  try {
    if (ENEO_CONFIG.useMockUpload) {
      // Mock mode — simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      btn.innerHTML = '✅ &nbsp;Posted!';
      toast('🎉 Your property is now live!', 'ok');
    } else {
      // Real upload to Cloudflare R2
      const thumbItems = document.querySelectorAll('.thumb-item');
      const photoUrls = [];

      for (const item of thumbItems) {
        if (item._compressedFile) {
          const file = item._compressedFile;
          const fileName = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const uploadUrl = `${ENEO_CONFIG.r2Endpoint}/${ENEO_CONFIG.r2BucketName}/${fileName}`;

          const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'image/jpeg',
              'Authorization': `Bearer ${ENEO_CONFIG.r2SecretAccessKey}`
            },
            body: file
          });

          if (!response.ok) throw new Error('Upload failed');
          photoUrls.push(`${ENEO_CONFIG.r2PublicUrl}/${fileName}`);
        }
      }

      // Insert into Supabase
      const { error } = await supabaseClient.from('properties').insert({
        title,
        description: desc,
        price: parseInt(price),
        beds,
        baths,
        latitude: lat,
        longitude: lng,
        photos: photoUrls,
        status: 'active'
      });

      if (error) throw error;
      btn.innerHTML = '✅ &nbsp;Posted!';
      toast('🎉 Your property is now live!', 'ok');
    }

    setTimeout(() => {
      document.getElementById('form-overlay').classList.remove('open');
      overlayClosed();
      switchNav('posting');
    }, 1100);

  } catch (err) {
    toast(err.message || 'Failed to post property. Try again.', 'err');
    btn.innerHTML = '🚀 &nbsp;Post Property';
    btn.disabled = false;
  }
}

// ═══ SAVE / BOOKMARK ═══════════════════════════════

function toggleSave(propId) {
  const idx = savedProps.indexOf(propId);
  if (idx > -1) {
    savedProps.splice(idx, 1);
    toast('Removed from saved', '');
  } else {
    savedProps.push(propId);
    toast('❤️ Saved!', 'ok');
  }
  updateAllSaveToggles();
  updateSavedCountBadge();
  // Update saved workspace if visible
  renderSavedWorkspace();
}

function updateAllSaveToggles() {
  document.querySelectorAll('.save-toggle').forEach(btn => {
    const pid = parseInt(btn.getAttribute('data-prop-id'));
    if (savedProps.includes(pid)) {
      btn.textContent = '❤️';
      btn.classList.add('saved');
    } else {
      btn.textContent = '♡';
      btn.classList.remove('saved');
    }
  });
}

function updateSavedCountBadge() {
  const count = savedProps.length;
  const badge = document.getElementById('snav-saved-count');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  }
  const acctEl = document.getElementById('acct-saved-count');
  if (acctEl) acctEl.textContent = count + ' saved';
}

// ═══ SAVED WORKSPACE ═══════════════════════════════

function renderSavedWorkspace() {
  const grid = document.getElementById('saved-grid');
  const empty = document.getElementById('saved-empty');
  const countLabel = document.getElementById('saved-count-label');
  const compareBar = document.getElementById('compare-bar');
  const comparisonView = document.getElementById('comparison-view');
  if (!grid) return;

  // Hide comparison view when re-rendering
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

  grid.innerHTML = savedProps.map(pid => {
    const p = PROPS.find(prop => prop.id === pid);
    if (!p) return '';
    const bedLabel = p.beds === 0 ? 'Studio' : p.beds;
    return `
      <div class="saved-card">
        <div class="check-wrap">
          <input type="checkbox" class="saved-check" data-prop-id="${pid}" onchange="updateCompareButton()">
        </div>
        <div class="saved-card-img">
          <img src="${p.photos[0]}" alt="">
        </div>
        <div class="saved-card-body">
          <div class="saved-card-price">${p.price} <small style="font-size:12px;color:var(--text3);font-weight:400">/mo</small></div>
          <div class="saved-card-title">${p.title}</div>
          <div class="saved-card-loc">📍 ${p.loc}</div>
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
  btn.textContent = checked.length >= 2 && checked.length <= 3
    ? `📊 Compare ${checked.length} Selected`
    : '📊 Compare Selected';
}

function compareSelected() {
  const checked = document.querySelectorAll('.saved-check:checked');
  const ids = Array.from(checked).map(cb => parseInt(cb.getAttribute('data-prop-id')));
  if (ids.length < 2 || ids.length > 3) return;

  const comparisonView = document.getElementById('comparison-view');
  if (!comparisonView) return;

  const propsToCompare = ids.map(id => PROPS.find(p => p.id === id)).filter(Boolean);

  const rows = [
    { label: 'Price', key: 'price' },
    { label: 'Type', key: 'type' },
    { label: 'Bedrooms', key: 'beds', fmt: v => v === 0 ? 'Studio' : v },
    { label: 'Bathrooms', key: 'baths' },
    { label: 'Area', key: 'area' },
    { label: 'Location', key: 'loc' }
  ];

  let html = '<table><thead><tr><th>Feature</th>';
  propsToCompare.forEach(p => {
    html += `<th class="comp-header">${p.title}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    html += `<tr><td><strong>${row.label}</strong></td>`;
    propsToCompare.forEach(p => {
      let val = row.key ? p[row.key] : '';
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

function openDetail(propId) {
  const p = PROPS.find(prop => prop.id === propId);
  if (!p) return;
  curProp = p;
  booked = false;
  trackView(propId);

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

  // Gallery
  const gal = document.getElementById('dt-gallery');
  gal.innerHTML = p.photos.map(src => `<img src="${src}" alt="">`).join('');

  const dots = document.getElementById('dt-dots');
  dots.innerHTML = p.photos.map((_, idx) =>
    `<div class="gdot${idx === 0 ? ' active' : ''}"></div>`
  ).join('');

  gal.onscroll = () => {
    const idx = Math.round(gal.scrollLeft / gal.clientWidth);
    dots.querySelectorAll('.gdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  };
  gal.scrollLeft = 0;
  dots.querySelectorAll('.gdot').forEach((d, i) => d.classList.toggle('active', i === 0));

  // Book button
  const btn = document.getElementById('book-btn');
  btn.innerHTML = '📅 Book This Property';
  btn.classList.remove('done');
  btn.disabled = false;
  document.getElementById('contact-reveal').classList.remove('show');

  // Landlord reputation
  renderLandlordCard(p);

  document.getElementById('detail-overlay').classList.add('open');
  overlayOpened();
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('open');
  overlayClosed();
}

function renderLandlordCard(p) {
  const ld = p.landlord;
  const act = p.activity;

  // Avatar and name
  document.getElementById('ld-av').textContent = ld.initials;
  document.getElementById('ld-name').textContent = ld.name;

  // Stars
  const fullStars = '★'.repeat(Math.floor(ld.rating));
  const emptyStars = '☆'.repeat(5 - Math.ceil(ld.rating));
  document.getElementById('ld-stars').textContent = fullStars + emptyStars;
  document.getElementById('ld-stars').style.color = 'var(--sand)';
  document.getElementById('ld-rating-num').textContent = ld.rating;
  document.getElementById('ld-rating-count').textContent = `(${ld.totalRatings} ratings)`;

  // Trusted badge
  const badge = document.getElementById('ld-badge');
  if (ld.isTrusted) {
    badge.innerHTML = '<span>🏅 Trusted</span>';
    badge.className = 'landlord-badge';
  } else {
    badge.innerHTML = '<span>🌱 New Landlord</span>';
    badge.className = 'landlord-badge new-landlord';
  }

  // Stats
  document.getElementById('ld-posted').textContent = ld.totalPosted;
  document.getElementById('ld-booked').textContent = ld.totalBooked;
  document.getElementById('ld-response').textContent = ld.responseRate + '%';

  // Property activity
  document.getElementById('pa-views').textContent = act.views;
  document.getElementById('pa-saves').textContent = act.saves;
  document.getElementById('pa-bookings').textContent = act.bookings;

  // Reviews
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

  booked = true;
  btn.innerHTML = '✅ Viewing Requested!';
  btn.classList.add('done');
  btn.disabled = false;
  document.getElementById('contact-reveal').classList.add('show');
  toast('✅ Booked! Call the landlord to confirm a time.', 'ok');
}

function openMap() {
  if (!curProp) return;
  toast('📍 Opening Google Maps...', 'ok');
  setTimeout(() => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${curProp.lat},${curProp.lng}`, '_blank');
  }, 600);
}

// ═══ GALLERY SCROLL ════════════════════════════════

function galScroll(el, dir) {
  const gallery = el.parentElement.querySelector('.pcard-gallery');
  if (!gallery) return;
  const w = gallery.clientWidth;
  gallery.scrollBy({ left: dir * w, behavior: 'smooth' });
}

// Delegated gallery scroll listener for dot updates
document.addEventListener('scroll', function (e) {
  const gallery = e.target.closest('.pcard-gallery');
  if (!gallery) return;
  const dots = gallery.parentElement.querySelectorAll('.gallery-nav-dots .gdot');
  if (!dots.length) return;
  const idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}, true);

// ═══ LIVE SEARCH ═══════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('feed-search');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      const query = searchInput.value.trim();
      
      // Debounce — wait 300ms after user stops typing
      searchTimeout = setTimeout(async () => {
        if (!query) {
          // Empty search — show all
          const { data: properties } = await fetchProperties();
          const props = properties || PROPS;
          const propGrid = document.getElementById('prop-grid');
          if (propGrid) {
            propGrid.innerHTML = props.map(p => createPropertyCardHTML(p)).join('');
          }
          updateAllSaveToggles();
          return;
        }
        
        // Filtered search via data layer
        const { data: properties } = await fetchProperties({ search: query });
        const props = properties || [];
        const propGrid = document.getElementById('prop-grid');
        if (propGrid) {
          propGrid.innerHTML = props.length 
            ? props.map(p => createPropertyCardHTML(p)).join('')
            : '<div class="empty-box"><div class="ei">🔍</div><p>No properties found matching "' + query + '"</p></div>';
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
  // Clear near-me if a county is selected
  if (val !== 'any') {
    nearMeActive = false;
    const nb = document.getElementById('f-nearme-btn');
    nb.classList.remove('active');
    document.getElementById('f-nearme-text').textContent = 'Use my current location';
    document.getElementById('f-nearme-icon').textContent = '📍';
  }
}

function filterNearMe() {
  nearMeActive = !nearMeActive;
  const btn = document.getElementById('f-nearme-btn');
  const icon = document.getElementById('f-nearme-icon');
  const txt = document.getElementById('f-nearme-text');
  if (nearMeActive) {
    btn.classList.add('active');
    icon.textContent = '⏳';
    txt.textContent = 'Detecting location...';
    // Simulate GPS detection
    setTimeout(() => {
      icon.textContent = '✅';
      txt.textContent = 'Near me — Westlands, Nairobi';
      // Clear county selection when near-me is active
      document.querySelectorAll('#ch-county .county-chip').forEach((c, i) => c.classList.toggle('on', i === 0));
    }, 1200);
  } else {
    btn.classList.remove('active');
    icon.textContent = '📍';
    txt.textContent = 'Use my current location';
  }
}

// ═══ PRICE SLIDERS (unified) ════════════════════════

function syncFromSliders(prefix) {
  const minR = document.getElementById(prefix + '-range-min');
  const maxR = document.getElementById(prefix + '-range-max');
  const minI = document.getElementById(prefix + '-min-input');
  const maxI = document.getElementById(prefix + '-max-input');
  if (!minR || !maxR) return;
  let minV = parseInt(minR.value);
  let maxV = parseInt(maxR.value);
  // Prevent crossing — give 5k gap
  if (minV >= maxV) {
    minV = Math.max(0, maxV - 5000);
    minR.value = minV;
  }
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
  let minV = Math.max(0, parseInt(minI.value) || 0);
  let maxV = Math.max(0, parseInt(maxI.value) || 300000);
  minV = Math.min(minV, 300000);
  maxV = Math.min(maxV, 300000);
  if (minV >= maxV) maxV = Math.min(minV + 5000, 300000);
  minI.value = minV;
  maxI.value = maxV;
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
  const minR = document.getElementById('f-range-min');
  const maxR = document.getElementById('f-range-max');
  const minI = document.getElementById('f-min-input');
  const maxI = document.getElementById('f-max-input');
  if (minR) minR.value = 0;
  if (maxR) maxR.value = 300000;
  if (minI) minI.value = 0;
  if (maxI) maxI.value = 300000;
  updatePriceFill('f', 0, 300000);

  nearMeActive = false;
  const nb = document.getElementById('f-nearme-btn');
  if (nb) nb.classList.remove('active');
  const ni = document.getElementById('f-nearme-icon');
  const nt = document.getElementById('f-nearme-text');
  if (ni) ni.textContent = '📍';
  if (nt) nt.textContent = 'Use my current location';

  ['ch-county', 'ch-beds', 'ch-baths', 'ch-type', 'ch-furnish'].forEach(id => {
    const chips = document.querySelectorAll('#' + id + ' .chip, #' + id + ' .county-chip');
    chips.forEach((c, i) => {
      c.classList.remove('on');
      if (i === 0) c.classList.add('on');
    });
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

  // Build filter object
  const filters = {};
  if (minV > 0) filters.minPrice = minV;
  if (maxV < 300000) filters.maxPrice = maxV;
  if (beds && beds !== 'Any') filters.beds = beds;
  if (baths && baths !== 'Any') filters.baths = baths;
  if (type && type !== 'Any') filters.type = type;
  if (furnish && furnish !== 'Any') filters.furnish = furnish;

  // Fetch filtered properties
  const { data: properties } = await fetchProperties(filters);
  const filteredProps = properties || PROPS;

  // Update the property grid
  const propGrid = document.getElementById('prop-grid');
  if (propGrid) {
    propGrid.innerHTML = filteredProps.map(p => createPropertyCardHTML(p)).join('');
  }
  updateAllSaveToggles();

  // Build toast message
  const parts = [];
  if (nearMeActive) parts.push('Near me');
  if (minV > 0 || maxV < 300000) {
    const fmt = v => v >= 300000 ? '300k+' : v === 0 ? '0' : (v >= 1000 ? (v / 1000) + 'k' : v);
    parts.push(`KSh ${fmt(minV)}–${fmt(maxV)}`);
  }
  if (type && type !== 'Any') parts.push(type);
  if (beds && beds !== 'Any') parts.push(beds + ' bed');
  if (baths && baths !== 'Any') parts.push(baths + ' bath');
  if (furnish && furnish !== 'Any') parts.push(furnish);

  const msg = parts.length ? '🔍 ' + parts.join(' · ') : 'Showing all listings';
  toast(msg, parts.length ? 'ok' : '');

  const fb = document.getElementById('filter-btn');
  if (fb) fb.classList.toggle('on', parts.length > 0);
}

// ═══ NOTIFY ME ═════════════════════════════════════

function openNotifyModal() {
  updatePriceFill('n', 0, 300000);
  renderNotifyAlerts();
  openModal('m-notify');
}

function saveNotifyAlert() {
  const county = document.querySelector('#nch-county .chip.on')?.textContent?.trim() || 'Anywhere';
  const type = document.querySelector('#nch-type .chip.on')?.textContent?.trim() || 'Any';
  const beds = document.querySelector('#nch-beds .chip.on')?.textContent?.trim() || 'Any';
  const match = document.querySelector('#nch-match .chip.on')?.textContent?.trim() || 'Exact';
  const how = document.querySelector('#nch-how .chip.on')?.textContent?.trim() || '📱 In-app';
  const minV = parseInt(document.getElementById('n-min-input')?.value || 0);
  const maxV = parseInt(document.getElementById('n-max-input')?.value || 300000);

  const fmt = v => v >= 300000 ? '300k+' : v === 0 ? '0' : (v >= 1000 ? (v / 1000) + 'k' : v);
  const priceLabel = (minV === 0 && maxV >= 300000) ? 'Any budget' : `KSh ${fmt(minV)}–${fmt(maxV)}`;
  const parts = [];
  if (county !== 'Anywhere') parts.push(county.replace(/^[^ ]+ /, ''));
  parts.push(priceLabel);
  if (type !== 'Any') parts.push(type);
  if (beds !== 'Any') parts.push(beds === 'Studio' ? 'Studio' : beds + ' bed');

  const label = parts.join(' · ');

  notifyAlerts.push({ county, minV, maxV, type, beds, match, how, label });

  const nb = document.getElementById('notify-btn');
  if (nb) nb.classList.add('active');

  closeModal('m-notify');
  toast(`🔔 Alert saved! We'll notify you via ${how.replace(/^[^ ]+ /, '').toLowerCase()}`, 'ok');
}

function renderNotifyAlerts() {
  const section = document.getElementById('notify-active-section');
  const list = document.getElementById('notify-alerts-list');
  if (!notifyAlerts.length) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  list.innerHTML = notifyAlerts.map((a, i) => `
    <div class="notify-alert-item">
      <div class="notify-alert-label">
        ${a.label}
        <div class="notify-alert-sub">${a.match} match · via ${a.how.replace(/^[^ ]+ /, '')}</div>
      </div>
      <button class="notify-alert-del" onclick="deleteNotifyAlert(${i})" title="Remove alert">✕</button>
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

// ═══ MODALS ════════════════════════════════════════

function openModal(id) {
  document.getElementById(id).classList.add('open');
  overlayOpened();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  overlayClosed();
}

function outsideCloseModal(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

function overlayClose(e, id) {
  if (e.target === document.getElementById(id)) {
    document.getElementById(id).classList.remove('open');
    overlayClosed();
  }
}

// ═══ ESCAPE KEY ════════════════════════════════════

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  // Close modals first
  const openModals = document.querySelectorAll('.modal-bg.open');
  if (openModals.length) {
    closeModal(openModals[openModals.length - 1].id);
    return;
  }
  // Then close post form
  if (document.getElementById('form-overlay').classList.contains('open')) {
    confirmClose();
    return;
  }
  // Then close detail panel
  if (document.getElementById('detail-overlay').classList.contains('open')) {
    closeDetail();
  }
});

// ═══ BROWSING HISTORY ══════════════════════════════

function trackView(propId) {
  // Remove existing entry for this prop (re-add at top)
  browsingHistory = browsingHistory.filter(h => h.propId !== propId);
  browsingHistory.unshift({ propId, timestamp: Date.now() });
  // Cap at 50 entries
  if (browsingHistory.length > 50) browsingHistory = browsingHistory.slice(0, 50);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  return days + 'd ago';
}

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' });
}

function renderHistory() {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!browsingHistory.length) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  // Group by day
  const groups = {};
  browsingHistory.forEach(h => {
    const label = dayLabel(h.timestamp);
    if (!groups[label]) groups[label] = [];
    groups[label].push(h);
  });

  list.innerHTML = Object.entries(groups).map(([day, items]) => `
    <div class="history-day">
      <div class="history-day-label">${day}</div>
      ${items.map(h => {
        const p = PROPS.find(prop => prop.id === h.propId);
        if (!p) return '';
        const bedLabel = p.beds === 0 ? 'Studio' : p.beds + ' bed';
        return `
        <div class="hcard" onclick="openDetail(${h.propId})">
          <img class="hcard-img" src="${p.photos[0]}" alt="">
          <div class="hcard-body">
            <div class="hcard-price">${p.price}</div>
            <div class="hcard-title">${p.title}</div>
            <div class="hcard-meta">
              <span>📍 ${p.loc}</span>
              <span>· ${bedLabel} · ${p.baths} bath</span>
            </div>
          </div>
          <div class="hcard-time">${timeAgo(h.timestamp)}</div>
          <button class="hcard-remove" title="Remove" onclick="event.stopPropagation();removeHistory(${h.propId})">✕</button>
        </div>`;
      }).join('')}
    </div>
  `).join('');
}

function removeHistory(propId) {
  browsingHistory = browsingHistory.filter(h => h.propId !== propId);
  renderHistory();
  if (!browsingHistory.length) toast('History cleared', '');
}

function clearHistory() {
  browsingHistory = [];
  renderHistory();
  toast('History cleared', '');
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
  const btn = document.getElementById('delete-final-btn');
  btn.disabled = !valid;
  btn.style.opacity = valid ? '1' : '.4';
}

function resetDeleteModal() {
  document.getElementById('delete-confirm-step').style.display = '';
  document.getElementById('delete-type-step').style.display = 'none';
  document.getElementById('delete-confirm-input').value = '';
}

function doDeleteAccount() {
  closeModal('m-delete-account');
  resetDeleteModal();
  setTimeout(() => {
    doLogout();
    toast('⏳ Account scheduled for deletion in 30 days', 'ok');
  }, 300);
}

// ═══ TOAST NOTIFICATIONS ════════════════════════════

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
  const SELECTORS = [
    '.content-area',
    '.detail-scroll',
    '.form-scroll',
    '.modal-card',
    '.login-right',
    '.featured-scroll'
  ];

  function applyMomentum(el) {
    if (!el || el._ms) return;
    el._ms = true;
    let drag = false,
        sy = 0, sx = 0,
        vy = 0, vx = 0,
        ly = 0, lx = 0,
        lt = 0,
        raf = null;

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    el.addEventListener('mousedown', e => {
      stop();
      drag = true;
      sy = e.clientY + el.scrollTop;
      sx = e.clientX + el.scrollLeft;
      ly = e.clientY;
      lx = e.clientX;
      lt = Date.now();
      vy = vx = 0;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    }, { passive: true });

    window.addEventListener('mousemove', e => {
      if (!drag) return;
      const now = Date.now(),
            dt = Math.max(now - lt, 1);
      vy = (ly - e.clientY) / dt * 14;
      vx = (lx - e.clientX) / dt * 14;
      ly = e.clientY;
      lx = e.clientX;
      lt = now;
      el.scrollTop = sy - e.clientY;
      el.scrollLeft = sx - e.clientX;
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (!drag) return;
      drag = false;
      el.style.cursor = '';
      el.style.userSelect = '';
      (function coast() {
        vy *= 0.88;
        vx *= 0.88;
        if (Math.abs(vy) < 0.25 && Math.abs(vx) < 0.25) {
          stop();
          return;
        }
        el.scrollTop += vy;
        el.scrollLeft += vx;
        raf = requestAnimationFrame(coast);
      })();
    }, { passive: true });

    el.addEventListener('wheel', e => {
      if (e.deltaMode !== 0) return;
      stop();
      vy = e.deltaY * 0.6;
      vx = e.deltaX * 0.6;
      (function glide() {
        vy *= 0.84;
        vx *= 0.84;
        if (Math.abs(vy) < 0.3 && Math.abs(vx) < 0.3) {
          stop();
          return;
        }
        el.scrollTop += vy;
        el.scrollLeft += vx;
        raf = requestAnimationFrame(glide);
      })();
    }, { passive: true });
  }

  function initAll() {
    SELECTORS.forEach(s => document.querySelectorAll(s).forEach(applyMomentum));
  }

  document.addEventListener('DOMContentLoaded', initAll);
  window.addEventListener('load', initAll);

  // Observe DOM changes to apply momentum to new scroll containers
  new MutationObserver(initAll).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
})();