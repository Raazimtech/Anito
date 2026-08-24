(() => {
  const { createClient } = window.supabase;
  const cfg = window.MOVIED_CONFIG;
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

  const state = {
    user: null,
    session: null,
    authMode: 'signin',
    movies: [],
    page: 1,
    query: 'feature films',
    activeMovie: null,
    activeSource: null,
    history: new Map(),
    watchlist: new Set(),
    installPrompt: null,
    searchTimer: null
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('show'), 2600); };
  const formatYear = (year) => year && String(year).match(/^\d{4}$/) ? year : '—';

  function showSection(id) {
    $$('.page-section').forEach(el => el.classList.toggle('active-section', el.id === id));
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.section === id));
    if (id === 'history') renderHistory();
    if (id === 'watchlist') renderWatchlist();
    if (id === 'account') renderAccount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleHash() {
    const id = location.hash.replace('#', '') || 'home';
    const target = ['home','browse','history','watchlist','account'].includes(id) ? id : 'home';
    showSection(target);
  }

  function movieCard(movie, compact = false) {
    const progress = state.history.get(movie.id);
    const pct = progress && progress.duration_seconds ? Math.min(100, (progress.progress_seconds / progress.duration_seconds) * 100) : 0;
    return `<button class="movie-card" type="button" data-movie-id="${escapeHtml(movie.id)}" aria-label="Watch ${escapeHtml(movie.title)}">
      <div class="poster">
        ${movie.poster ? `<img src="${escapeHtml(movie.poster)}" alt="Poster for ${escapeHtml(movie.title)}" loading="lazy">` : `<div class="poster-fallback">${escapeHtml(movie.title)}</div>`}
        <span class="play-badge">▶</span>
        ${progress ? `<span class="progress"><span style="width:${pct}%"></span></span>` : ''}
      </div>
      <div class="movie-title">${escapeHtml(movie.title)}</div>
      <div class="movie-sub">${escapeHtml(formatYear(movie.year))}${compact ? ' · Resume' : ''}</div>
    </button>`;
  }

  function bindMovieClicks(scope = document) {
    scope.querySelectorAll('[data-movie-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const movie = state.movies.find(m => m.id === btn.dataset.movieId) || [...state.history.values()].find(m => m.movie_id === btn.dataset.movieId) || [...state.watchlist].map(id => state.movies.find(m => m.id === id)).find(Boolean);
        if (movie) openMovie(movie);
        else loadMovieById(btn.dataset.movieId);
      });
    });
  }

  async function loadMovieById(id) {
    try {
      const data = await fetch(`${cfg.archiveMetadata}${encodeURIComponent(id)}`).then(r => r.json());
      const movie = normalizeItem(data);
      if (movie) openMovie(movie);
    } catch { toast('Could not open that movie.'); }
  }

  function normalizeItem(item) {
    if (!item || !item.metadata || !item.metadata.title) return null;
    const meta = item.metadata;
    const title = Array.isArray(meta.title) ? meta.title[0] : meta.title;
    const year = String(meta.year || meta.date || '').slice(0,4);
    const description = Array.isArray(meta.description) ? meta.description[0] : (meta.description || '');
    const id = item.metadata.identifier || item.identifier;
    return {
      id,
      title,
      year,
      description: stripHtml(description).slice(0, 700),
      poster: `https://archive.org/services/img/${encodeURIComponent(id)}`,
      detailUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
      item
    };
  }

  function stripHtml(text) {
    const d = document.createElement('div'); d.innerHTML = text || ''; return d.textContent || '';
  }

  function normalizeSearchDoc(doc) {
    const id = doc.identifier;
    return {
      id,
      title: Array.isArray(doc.title) ? doc.title[0] : (doc.title || id),
      year: String(doc.year || doc.date || '').slice(0,4),
      description: stripHtml(Array.isArray(doc.description) ? doc.description[0] : (doc.description || '')).slice(0,700),
      poster: `https://archive.org/services/img/${encodeURIComponent(id)}`,
      detailUrl: `https://archive.org/details/${encodeURIComponent(id)}`
    };
  }

  async function findPlayableSource(movie) {
    const data = await fetch(`${cfg.archiveMetadata}${encodeURIComponent(movie.id)}`).then(r => r.json());
    const files = Array.isArray(data.files) ? data.files : [];
    const playable = files
      .filter(f => !f.private && f.name)
      .filter(f => /\.(mp4|webm|ogv)$/i.test(f.name) || /mpeg4|webm|ogg video|matroska/i.test(f.format || ''))
      .filter(f => !/thumb|sample|preview/i.test(f.name))
      .sort((a,b) => (/\.mp4$/i.test(a.name) ? 0 : 1) - (/\.mp4$/i.test(b.name) ? 0 : 1));
    if (!playable.length) return null;
    const file = playable[0];
    const url = `https://archive.org/download/${encodeURIComponent(movie.id)}/${file.name.split('/').map(encodeURIComponent).join('/')}`;
    return { url, mime: file.format && /webm/i.test(file.format) ? 'video/webm' : file.name.toLowerCase().endsWith('.ogv') ? 'video/ogg' : 'video/mp4', size: file.size || 0 };
  }

  async function searchMovies(reset = true) {
    if (reset) state.page = 1;
    const rows = 20;
    const query = `(mediatype:movies) AND (${state.query})`;
    const params = new URLSearchParams({ q: query, fl: 'identifier,title,description,year,date', rows: String(rows), page: String(state.page), output: 'json', sort: 'downloads desc' });
    const grid = $('#movieGrid');
    if (reset) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Finding movies…</div>`;
    try {
      const res = await fetch(`${cfg.archiveSearch}?${params}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const incoming = (data.response?.docs || []).map(normalizeSearchDoc).filter(m => m.id && m.title);
      const dedupe = new Map(state.movies.map(m => [m.id,m])); incoming.forEach(m => dedupe.set(m.id,m));
      state.movies = [...dedupe.values()];
      renderMovieGrid(incoming, reset);
      $('#loadMore').classList.toggle('hidden', incoming.length < rows);
      pickHero();
    } catch (error) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Movie search is temporarily unavailable. Try again.</div>`;
      console.error(error);
    }
  }

  function renderMovieGrid(items, reset = true) {
    const grid = $('#movieGrid');
    const html = items.length ? items.map(m => movieCard(m)).join('') : `<div class="empty-state" style="grid-column:1/-1">No movies found. Try a different search.</div>`;
    if (reset) grid.innerHTML = html; else grid.insertAdjacentHTML('beforeend', html);
    bindMovieClicks(grid);
  }

  function pickHero() {
    const movie = state.movies.find(m => m.poster) || state.movies[0];
    if (!movie) return;
    $('#heroPoster').style.backgroundImage = `url("${movie.poster}")`;
  }

  function renderHistory() {
    const grid = $('#historyGrid');
    const entries = [...state.history.values()].sort((a,b) => new Date(b.last_watched_at) - new Date(a.last_watched_at));
    if (!state.user) { grid.innerHTML = ''; $('#historyEmpty').textContent = 'Sign in and your viewing history will appear here.'; $('#historyEmpty').classList.remove('hidden'); return; }
    if (!entries.length) { grid.innerHTML = ''; $('#historyEmpty').textContent = 'No movies yet. Start watching and your history will appear here.'; $('#historyEmpty').classList.remove('hidden'); return; }
    $('#historyEmpty').classList.add('hidden');
    grid.innerHTML = entries.map(row => movieCard({ id: row.movie_id, title: row.title, year: '', poster: row.poster_url }, true)).join('');
    bindMovieClicks(grid);
  }

  function renderWatchlist() {
    const grid = $('#watchlistGrid');
    const entries = [...state.watchlist].map(id => state.movies.find(m => m.id === id)).filter(Boolean);
    if (!state.user) { grid.innerHTML = ''; $('#watchlistEmpty').textContent = 'Sign in to save movies to your watchlist.'; $('#watchlistEmpty').classList.remove('hidden'); return; }
    if (!entries.length) { grid.innerHTML = ''; $('#watchlistEmpty').textContent = 'Your saved movies will appear here.'; $('#watchlistEmpty').classList.remove('hidden'); return; }
    $('#watchlistEmpty').classList.add('hidden');
    grid.innerHTML = entries.map(m => movieCard(m)).join('');
    bindMovieClicks(grid);
  }

  function renderAccount() {
    if (state.user) {
      const email = state.user.email || 'Movied member';
      $('#accountTitle').textContent = 'You’re signed in';
      $('#accountEmail').textContent = email;
      $('#accountAvatar').textContent = email[0].toUpperCase();
      $('#accountAction').textContent = 'Sign out';
      $('#authBtn').classList.add('hidden'); $('#avatarBtn').classList.remove('hidden'); $('#avatarBtn').textContent = email[0].toUpperCase();
    } else {
      $('#accountTitle').textContent = 'Welcome to Movied';
      $('#accountEmail').textContent = 'Sign in to save your history and watchlist.';
      $('#accountAvatar').textContent = 'M';
      $('#accountAction').textContent = 'Sign in';
      $('#authBtn').classList.remove('hidden'); $('#avatarBtn').classList.add('hidden');
    }
  }

  async function loadUserData() {
    state.history.clear(); state.watchlist.clear();
    if (!state.user) { renderHistory(); renderWatchlist(); return; }
    const [{ data: history }, { data: saved }] = await Promise.all([
      sb.from('movied_history').select('*').order('last_watched_at', { ascending: false }),
      sb.from('movied_watchlist').select('*').order('created_at', { ascending: false })
    ]);
    (history || []).forEach(row => state.history.set(row.movie_id, row));
    (saved || []).forEach(row => {
      state.watchlist.add(row.movie_id);
      if (!state.movies.some(m => m.id === row.movie_id)) state.movies.push({ id: row.movie_id, title: row.title, year:'', poster: row.poster_url, detailUrl:`https://archive.org/details/${row.movie_id}` });
    });
    renderHistory(); renderWatchlist();
  }

  async function saveProgress(movie, player) {
    if (!state.user || !movie) return;
    const payload = {
      user_id: state.user.id,
      movie_id: movie.id,
      title: movie.title,
      poster_url: movie.poster,
      backdrop_url: movie.poster,
      source_url: state.activeSource?.url || null,
      progress_seconds: Math.floor(player.currentTime || 0),
      duration_seconds: Number.isFinite(player.duration) ? Math.floor(player.duration) : 0,
      last_watched_at: new Date().toISOString()
    };
    const { error } = await sb.from('movied_history').upsert(payload, { onConflict: 'user_id,movie_id' });
    if (error) console.warn('History save failed', error);
    else state.history.set(movie.id, payload);
  }

  async function toggleWatchlist(movie) {
    if (!state.user) { openAuth(); return; }
    if (state.watchlist.has(movie.id)) {
      const { error } = await sb.from('movied_watchlist').delete().eq('user_id', state.user.id).eq('movie_id', movie.id);
      if (!error) { state.watchlist.delete(movie.id); toast('Removed from saved.'); }
    } else {
      const { error } = await sb.from('movied_watchlist').insert({ user_id: state.user.id, movie_id: movie.id, title: movie.title, poster_url: movie.poster, backdrop_url: movie.poster });
      if (!error) { state.watchlist.add(movie.id); toast('Saved to your watchlist.'); } else toast('Could not save that movie.');
    }
    updatePlayerSaveButton(); renderWatchlist();
  }

  async function openMovie(movie) {
    if (!movie?.id) return;
    state.activeMovie = movie;
    $('#playerTitle').textContent = movie.title;
    $('#playerStatus').textContent = 'Checking playback…';
    $('#videoPlayer').removeAttribute('src');
    $('#videoPlayer').load();
    updatePlayerSaveButton();
    $('#playerModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    try {
      const source = await findPlayableSource(movie);
      if (!source) throw new Error('No playable video file found');
      state.activeSource = source;
      const player = $('#videoPlayer');
      player.src = source.url;
      player.type = source.mime;
      player.load();
      player.addEventListener('loadedmetadata', () => {
        const saved = state.history.get(movie.id);
        if (saved?.progress_seconds && saved.progress_seconds < player.duration - 10) player.currentTime = saved.progress_seconds;
        $('#playerStatus').textContent = saved?.progress_seconds ? 'Resuming where you left off.' : 'Ready to watch.';
      }, { once: true });
      player.play().catch(() => {});
    } catch (error) {
      $('#playerStatus').textContent = 'This movie has no browser-playable file available.';
      console.error(error);
    }
  }

  function updatePlayerSaveButton() {
    const btn = $('#savePlayerBtn');
    if (!state.activeMovie) return;
    btn.textContent = state.watchlist.has(state.activeMovie.id) ? '♥ Saved' : '♡ Save';
  }

  function closePlayer() {
    const player = $('#videoPlayer');
    if (state.activeMovie && state.user && player.currentTime > 2) saveProgress(state.activeMovie, player);
    player.pause(); player.removeAttribute('src'); player.load();
    $('#playerModal').classList.add('hidden'); document.body.style.overflow = '';
    state.activeMovie = null; state.activeSource = null;
  }

  function openAuth(mode = state.authMode) {
    state.authMode = mode;
    const signup = mode === 'signup';
    $('#authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
    $('#authCopy').textContent = signup ? 'Create a free Movied account to keep your history and watchlist synced.' : 'Sign in to keep your history and watchlist synced.';
    $('#authSubmit').textContent = signup ? 'Create account' : 'Sign in';
    $('#toggleAuthMode').textContent = signup ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    $('#authMessage').textContent = '';
    $('#authModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#emailInput').focus(), 60);
  }

  function closeAuth() { $('#authModal').classList.add('hidden'); document.body.style.overflow = ''; }

  async function handleAuth(event) {
    event.preventDefault();
    const email = $('#emailInput').value.trim();
    const password = $('#passwordInput').value;
    const msg = $('#authMessage');
    $('#authSubmit').disabled = true;
    msg.textContent = 'Working…';
    try {
      const result = state.authMode === 'signup'
        ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split('#')[0] } })
        : await sb.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (state.authMode === 'signup' && !result.data.session) {
        msg.textContent = 'Account created. Check your email if confirmation is enabled.';
      } else {
        msg.textContent = 'Signed in.'; closeAuth(); toast('Welcome to Movied.');
      }
    } catch (error) {
      msg.textContent = error.message || 'Authentication failed.';
    } finally { $('#authSubmit').disabled = false; }
  }

  function setupPwa() {
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); state.installPrompt = event; $('#installBtn').classList.remove('hidden'); });
    $('#installBtn').addEventListener('click', async () => {
      if (!state.installPrompt) return;
      state.installPrompt.prompt();
      await state.installPrompt.userChoice;
      state.installPrompt = null;
      $('#installBtn').classList.add('hidden');
    });
    window.addEventListener('appinstalled', () => toast('Movied is installed.'));
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.warn);
  }

  function setupNavigation() {
    window.addEventListener('hashchange', handleHash);
    $$('#filterRow .filter-chip').forEach(chip => chip.addEventListener('click', () => {
      $$('#filterRow .filter-chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); state.query = chip.dataset.query; searchMovies(true);
    }));
    $('#browseBtn').addEventListener('click', () => { location.hash = '#browse'; });
    $('#randomBtn').addEventListener('click', () => { const movie = state.movies[Math.floor(Math.random() * Math.max(state.movies.length,1))]; if (movie) openMovie(movie); else { location.hash='#browse'; toast('Give me a moment to load some movies.'); } });
    $('#loadMore').addEventListener('click', () => { state.page += 1; searchMovies(false); });
    $('#searchInput').addEventListener('input', event => { clearTimeout(state.searchTimer); const value = event.target.value.trim(); state.searchTimer = setTimeout(() => { state.query = value || 'feature films'; searchMovies(true); }, 350); });
  }

  function setupModals() {
    $('[data-close-modal]').addEventListener('click', closeAuth);
    $$('.modal').forEach(modal => modal.addEventListener('click', e => { if (e.target.dataset.closeModal !== undefined) closeAuth(); }));
    $('[data-close-player]').addEventListener('click', closePlayer);
    $('#playerModal').addEventListener('click', e => { if (e.target.dataset.closePlayer !== undefined) closePlayer(); });
    $('#savePlayerBtn').addEventListener('click', () => state.activeMovie && toggleWatchlist(state.activeMovie));
    $('#authForm').addEventListener('submit', handleAuth);
    $('#toggleAuthMode').addEventListener('click', () => openAuth(state.authMode === 'signin' ? 'signup' : 'signin'));
    $('#authBtn').addEventListener('click', () => openAuth('signin'));
    $('#accountAction').addEventListener('click', async () => { if (state.user) await sb.auth.signOut(); else openAuth(); });
    $('#avatarBtn').addEventListener('click', () => { location.hash='#account'; });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#playerModal').classList.contains('hidden')) closePlayer(); else if (!$('#authModal').classList.contains('hidden')) closeAuth(); } });
    let lastSave = 0;
    $('#videoPlayer').addEventListener('timeupdate', () => { const now = Date.now(); if (now-lastSave > 15000) { lastSave = now; saveProgress(state.activeMovie, $('#videoPlayer')); } });
    $('#videoPlayer').addEventListener('ended', () => saveProgress(state.activeMovie, $('#videoPlayer')));
  }

  async function init() {
    setupNavigation(); setupModals(); setupPwa(); handleHash();
    const { data: { session } } = await sb.auth.getSession();
    state.session = session; state.user = session?.user || null;
    renderAccount(); await loadUserData();
    sb.auth.onAuthStateChange(async (_event, sessionValue) => {
      state.session = sessionValue; state.user = sessionValue?.user || null; renderAccount(); await loadUserData();
    });
    await searchMovies(true);
  }

  init().catch(err => { console.error(err); toast('Movied loaded with limited data.'); });
})();
