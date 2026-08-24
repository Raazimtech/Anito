(() => {
  const { createClient } = window.supabase;
  const cfg = window.MOVIED_CONFIG;
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const state = {
    user: null, session: null, authMode: 'signin', movies: [], page: 1,
    query: 'feature films', activeMovie: null, activeSource: null,
    history: new Map(), watchlist: new Set(), installPrompt: null, searchTimer: null,
    playerTimer: null
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[c]));
  const toast = (message) => {
    const el = $('#toast'); if (!el) return;
    el.textContent = message; el.classList.add('show'); clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2600);
  };
  const formatYear = (year) => year && String(year).match(/^\d{4}$/) ? year : '—';
  const formatTime = (seconds = 0) => {
    if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) return '';
    const mins = Math.floor(Number(seconds) / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h${rem ? ` ${rem}m` : ''}`;
  };

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
    const meta = [formatYear(movie.year), movie.duration ? formatTime(movie.duration) : ''].filter(Boolean).join(' · ');
    return `<button class="movie-card" type="button" data-movie-id="${escapeHtml(movie.id)}" aria-label="Open ${escapeHtml(movie.title)}">
      <div class="poster">
        ${movie.poster ? `<img src="${escapeHtml(movie.poster)}" alt="Poster for ${escapeHtml(movie.title)}" loading="lazy">` : `<div class="poster-fallback">${escapeHtml(movie.title)}</div>`}
        <span class="play-badge">▶</span>
        ${progress ? `<span class="progress"><span style="width:${pct}%"></span></span>` : ''}
      </div>
      <div class="movie-title">${escapeHtml(movie.title)}</div>
      <div class="movie-sub">${escapeHtml(meta || 'Movie')}${compact ? ' · Resume' : ''}</div>
    </button>`;
  }

  function findMovie(id) {
    return state.movies.find(m => m.id === id)
      || [...state.history.values()].find(m => m.movie_id === id && m.title)
      || [...state.watchlist].map(wid => state.movies.find(m => m.id === wid)).find(Boolean);
  }

  function bindMovieClicks(scope = document) {
    scope.querySelectorAll('[data-movie-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const movie = findMovie(btn.dataset.movieId);
        if (movie) openMovie(movie);
        else loadMovieById(btn.dataset.movieId);
      });
    });
  }

  async function loadMovieById(id) {
    try {
      const response = await fetch(`${cfg.archiveMetadata}${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error('Metadata request failed');
      const data = await response.json();
      const movie = normalizeItem(data);
      if (movie) openMovie(movie);
    } catch (error) {
      console.error(error); toast('Could not open that movie.');
    }
  }

  function stripHtml(text) {
    const d = document.createElement('div'); d.innerHTML = text || ''; return d.textContent || '';
  }

  function normalizeItem(item) {
    if (!item || !item.metadata || !item.metadata.title) return null;
    const meta = item.metadata;
    const title = Array.isArray(meta.title) ? meta.title[0] : meta.title;
    const year = String(meta.year || meta.date || '').slice(0, 4);
    const description = Array.isArray(meta.description) ? meta.description[0] : (meta.description || '');
    const subject = Array.isArray(meta.subject) ? meta.subject : String(meta.subject || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
    const id = meta.identifier || item.identifier;
    return {
      id, title, year, description: stripHtml(description).slice(0, 1400),
      poster: `https://archive.org/services/img/${encodeURIComponent(id)}`,
      detailUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
      creator: Array.isArray(meta.creator) ? meta.creator.join(', ') : (meta.creator || ''),
      language: Array.isArray(meta.language) ? meta.language.join(', ') : (meta.language || ''),
      genre: subject.slice(0, 4), item
    };
  }

  function normalizeSearchDoc(doc) {
    const id = doc.identifier;
    return {
      id,
      title: Array.isArray(doc.title) ? doc.title[0] : (doc.title || id),
      year: String(doc.year || doc.date || '').slice(0, 4),
      description: stripHtml(Array.isArray(doc.description) ? doc.description[0] : (doc.description || '')).slice(0, 700),
      poster: `https://archive.org/services/img/${encodeURIComponent(id)}`,
      detailUrl: `https://archive.org/details/${encodeURIComponent(id)}`
    };
  }

  async function getMovieMetadata(movie) {
    const response = await fetch(`${cfg.archiveMetadata}${encodeURIComponent(movie.id)}`);
    if (!response.ok) throw new Error('Movie metadata failed');
    return response.json();
  }

  async function findPlayableSource(movie, data = null) {
    const payload = data || await getMovieMetadata(movie);
    const files = Array.isArray(payload.files) ? payload.files : [];
    const playable = files
      .filter(f => !f.private && f.name)
      .filter(f => /\.(mp4|webm|ogv)$/i.test(f.name) || /mpeg4|webm|ogg video|matroska/i.test(f.format || ''))
      .filter(f => !/thumb|sample|preview/i.test(f.name))
      .sort((a, b) => {
        const aMp4 = /\.mp4$/i.test(a.name) ? 0 : 1;
        const bMp4 = /\.mp4$/i.test(b.name) ? 0 : 1;
        return aMp4 - bMp4 || Number(b.size || 0) - Number(a.size || 0);
      });
    if (!playable.length) return null;
    const file = playable[0];
    const url = `https://archive.org/download/${encodeURIComponent(movie.id)}/${file.name.split('/').map(encodeURIComponent).join('/')}`;
    return {
      url,
      mime: /webm/i.test(file.format || '') ? 'video/webm' : file.name.toLowerCase().endsWith('.ogv') ? 'video/ogg' : 'video/mp4',
      size: Number(file.size || 0)
    };
  }

  async function searchMovies(reset = true) {
    if (reset) state.page = 1;
    const rows = 20;
    const query = `(mediatype:movies) AND (${state.query})`;
    const params = new URLSearchParams({
      q: query, fl: 'identifier,title,description,year,date', rows: String(rows),
      page: String(state.page), output: 'json', sort: 'downloads desc'
    });
    const grid = $('#movieGrid');
    if (reset) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Finding movies…</div>`;
    try {
      const res = await fetch(`${cfg.archiveSearch}?${params}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const incoming = (data.response?.docs || []).map(normalizeSearchDoc).filter(m => m.id && m.title);
      const dedupe = new Map(state.movies.map(m => [m.id, m]));
      incoming.forEach(m => dedupe.set(m.id, m));
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
    if (movie) $('#heroPoster').style.backgroundImage = `url("${movie.poster}")`;
  }

  function renderHistory() {
    const grid = $('#historyGrid');
    const entries = [...state.history.values()].sort((a, b) => new Date(b.last_watched_at) - new Date(a.last_watched_at));
    if (!state.user) {
      grid.innerHTML = ''; $('#historyEmpty').textContent = 'Sign in and your viewing history will appear here.'; $('#historyEmpty').classList.remove('hidden'); return;
    }
    if (!entries.length) {
      grid.innerHTML = ''; $('#historyEmpty').textContent = 'No movies yet. Start watching and your history will appear here.'; $('#historyEmpty').classList.remove('hidden'); return;
    }
    $('#historyEmpty').classList.add('hidden');
    grid.innerHTML = entries.map(row => movieCard({ id: row.movie_id, title: row.title, year: '', poster: row.poster_url }, true)).join('');
    bindMovieClicks(grid);
  }

  function renderWatchlist() {
    const grid = $('#watchlistGrid');
    const entries = [...state.watchlist].map(id => state.movies.find(m => m.id === id)).filter(Boolean);
    if (!state.user) {
      grid.innerHTML = ''; $('#watchlistEmpty').textContent = 'Sign in to save movies to your watchlist.'; $('#watchlistEmpty').classList.remove('hidden'); return;
    }
    if (!entries.length) {
      grid.innerHTML = ''; $('#watchlistEmpty').textContent = 'Your saved movies will appear here.'; $('#watchlistEmpty').classList.remove('hidden'); return;
    }
    $('#watchlistEmpty').classList.add('hidden'); grid.innerHTML = entries.map(m => movieCard(m)).join(''); bindMovieClicks(grid);
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
      $('#accountAvatar').textContent = 'M'; $('#accountAction').textContent = 'Sign in';
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
      if (!state.movies.some(m => m.id === row.movie_id)) state.movies.push({ id: row.movie_id, title: row.title, year: '', poster: row.poster_url, detailUrl: `https://archive.org/details/${row.movie_id}` });
    });
    renderHistory(); renderWatchlist();
  }

  async function saveProgress(movie, player) {
    if (!state.user || !movie) return;
    const payload = {
      user_id: state.user.id, movie_id: movie.id, title: movie.title,
      poster_url: movie.poster, backdrop_url: movie.poster,
      source_url: state.activeSource?.url || null,
      progress_seconds: Math.floor(player.currentTime || 0),
      duration_seconds: Number.isFinite(player.duration) ? Math.floor(player.duration) : 0,
      last_watched_at: new Date().toISOString()
    };
    const { error } = await sb.from('movied_history').upsert(payload, { onConflict: 'user_id,movie_id' });
    if (!error) state.history.set(movie.id, payload); else console.warn('History save failed', error);
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

  function setMovieDetail(movie, data, source) {
    const meta = data?.metadata || {};
    const creator = movie.creator || (Array.isArray(meta.creator) ? meta.creator.join(', ') : meta.creator || '');
    const subject = Array.isArray(meta.subject) ? meta.subject : String(meta.subject || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
    const year = movie.year || String(meta.year || meta.date || '').slice(0,4);
    const desc = movie.description || stripHtml(Array.isArray(meta.description) ? meta.description[0] : (meta.description || ''));
    const duration = source?.size ? '' : '';
    $('#playerTitle').textContent = movie.title;
    $('#playerYear').textContent = formatYear(year);
    $('#playerCreator').textContent = creator || 'Unknown';
    $('#playerGenres').innerHTML = subject.slice(0, 4).map(s => `<span class="detail-chip">${escapeHtml(s)}</span>`).join('');
    $('#playerDescription').textContent = desc || 'No description is available for this movie.';
    $('#playerPoster').src = movie.poster || '';
    $('#playerPoster').alt = `Poster for ${movie.title}`;
    $('#playerSourceLink').href = movie.detailUrl || '#';
    $('#playerStatus').textContent = source ? 'Ready to watch' : 'Looking for a playable video…';
    if (duration) $('#playerDuration').textContent = duration;
  }

  async function openMovie(movie) {
    if (!movie?.id) return;
    state.activeMovie = movie;
    showMoviePage();
    const player = $('#videoPlayer');
    player.pause(); player.removeAttribute('src'); player.load();
    setMovieDetail(movie, movie.item || null, null);
    updatePlayerSaveButton();
    $('#movieDetailPage').scrollTo({ top: 0, behavior: 'instant' });
    try {
      const data = movie.item?.metadata ? movie.item : await getMovieMetadata(movie);
      const enriched = normalizeItem(data) || movie;
      Object.assign(movie, enriched, { item: data });
      state.activeMovie = movie;
      const source = await findPlayableSource(movie, data);
      state.activeSource = source;
      setMovieDetail(movie, data, source);
      if (!source) {
        $('#playerStatus').textContent = 'No browser-playable video file was found for this item.';
        return;
      }
      player.src = source.url;
      player.type = source.mime;
      player.poster = movie.poster || '';
      player.load();
      player.addEventListener('loadedmetadata', () => {
        const saved = state.history.get(movie.id);
        if (saved?.progress_seconds && saved.progress_seconds < player.duration - 10) {
          try { player.currentTime = saved.progress_seconds; } catch {}
          $('#playerStatus').textContent = 'Resume from where you left off.';
        } else {
          $('#playerStatus').textContent = 'Ready to watch';
        }
      }, { once: true });
    } catch (error) {
      console.error(error);
      $('#playerStatus').textContent = 'We could not load playback for this movie.';
    }
  }

  function showMoviePage() {
    $('#movieDetailPage').classList.remove('hidden');
    document.body.classList.add('movie-page-open');
    document.body.style.overflow = 'hidden';
  }

  function closePlayer() {
    const player = $('#videoPlayer');
    if (state.activeMovie && state.user && player.currentTime > 2) saveProgress(state.activeMovie, player);
    player.pause(); player.removeAttribute('src'); player.load();
    $('#movieDetailPage').classList.add('hidden');
    document.body.classList.remove('movie-page-open'); document.body.style.overflow = '';
    state.activeMovie = null; state.activeSource = null;
  }

  function updatePlayerSaveButton() {
    const btn = $('#savePlayerBtn');
    if (!state.activeMovie) return;
    btn.textContent = state.watchlist.has(state.activeMovie.id) ? '♥ Saved' : '♡ Save to list';
  }

  function openAuth(mode = state.authMode) {
    state.authMode = mode;
    const signup = mode === 'signup';
    $('#authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
    $('#authCopy').textContent = signup ? 'Create a free Movied account to keep your history and watchlist synced.' : 'Sign in to keep your history and watchlist synced.';
    $('#authSubmit').textContent = signup ? 'Create account' : 'Sign in';
    $('#toggleAuthMode').textContent = signup ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    $('#authMessage').textContent = ''; $('#authModal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    setTimeout(() => $('#emailInput').focus(), 60);
  }

  function closeAuth() {
    $('#authModal').classList.add('hidden');
    if ($('#movieDetailPage').classList.contains('hidden')) document.body.style.overflow = '';
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = $('#emailInput').value.trim();
    const password = $('#passwordInput').value;
    $('#authSubmit').disabled = true; $('#authMessage').textContent = 'Working…';
    try {
      if (state.authMode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) $('#authMessage').textContent = 'Account created. Check your email if confirmation is enabled.';
        else { toast('Account created.'); closeAuth(); }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        closeAuth(); toast('Welcome back.');
      }
    } catch (error) {
      $('#authMessage').textContent = error?.message || 'Authentication failed.';
    } finally { $('#authSubmit').disabled = false; }
  }

  async function signOut() {
    await sb.auth.signOut(); toast('Signed out.');
  }

  function wireUI() {
    window.addEventListener('hashchange', handleHash);
    $('#browseBtn')?.addEventListener('click', () => { location.hash = '#browse'; });
    $('#randomBtn')?.addEventListener('click', () => {
      const movie = state.movies[Math.floor(Math.random() * state.movies.length)];
      if (movie) openMovie(movie); else { location.hash = '#browse'; }
    });
    $('#authBtn')?.addEventListener('click', () => openAuth('signin'));
    $('#avatarBtn')?.addEventListener('click', () => { location.hash = '#account'; });
    $('#accountAction')?.addEventListener('click', () => state.user ? signOut() : openAuth());
    $('#authForm')?.addEventListener('submit', handleAuthSubmit);
    $('#toggleAuthMode')?.addEventListener('click', () => openAuth(state.authMode === 'signup' ? 'signin' : 'signup'));
    $$('#authModal [data-close-modal]').forEach(el => el.addEventListener('click', closeAuth));
    $('#savePlayerBtn')?.addEventListener('click', () => toggleWatchlist(state.activeMovie));
    $('#closeMoviePage')?.addEventListener('click', closePlayer);
    $('#movieDetailBack')?.addEventListener('click', closePlayer);
    $('#playerBackdrop')?.addEventListener('click', closePlayer);
    $('#videoPlayer')?.addEventListener('timeupdate', () => {
      const player = $('#videoPlayer');
      if (!state.activeMovie || !state.user || !Number.isFinite(player.currentTime)) return;
      clearTimeout(state.playerTimer);
      state.playerTimer = setTimeout(() => saveProgress(state.activeMovie, player), 2400);
    });
    $('#videoPlayer')?.addEventListener('ended', () => { if (state.activeMovie && state.user) saveProgress(state.activeMovie, $('#videoPlayer')); });
    $('#searchInput')?.addEventListener('input', (e) => {
      state.query = e.target.value.trim() || 'feature films'; clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => searchMovies(true), 360);
    });
    $$('#filterRow .filter-chip').forEach(btn => btn.addEventListener('click', () => {
      $$('#filterRow .filter-chip').forEach(b => b.classList.remove('active')); btn.classList.add('active');
      state.query = btn.dataset.query; if ($('#searchInput')) $('#searchInput').value = ''; searchMovies(true);
    }));
    $('#loadMore')?.addEventListener('click', () => { state.page += 1; searchMovies(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#movieDetailPage').classList.contains('hidden')) closePlayer(); else if (e.key === 'Escape' && !$('#authModal').classList.contains('hidden')) closeAuth(); });
  }

  async function initAuth() {
    const { data } = await sb.auth.getSession();
    state.session = data.session; state.user = data.session?.user || null;
    renderAccount(); await loadUserData();
    sb.auth.onAuthStateChange(async (_event, session) => {
      state.session = session; state.user = session?.user || null;
      renderAccount(); await loadUserData();
    });
  }

  function setupInstall() {
    const install = $('#installBtn');
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); state.installPrompt = e; install?.classList.remove('hidden'); });
    install?.addEventListener('click', async () => {
      if (!state.installPrompt) return;
      state.installPrompt.prompt(); await state.installPrompt.userChoice; state.installPrompt = null; install.classList.add('hidden');
    });
    window.addEventListener('appinstalled', () => { install?.classList.add('hidden'); });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.warn);
  }

  async function boot() {
    wireUI(); setupInstall(); handleHash(); await initAuth(); await searchMovies(true);
  }

  boot();
})();
