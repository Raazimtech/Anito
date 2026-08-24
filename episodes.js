(() => {
  const $ = (s) => document.querySelector(s);
  let catalog = [];
  let currentId = '';
  let lastPageVisible = false;

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  const cleanName = (name = '') => name.split('/').pop().replace(/\.(mp4|webm|ogv)$/i, '').replace(/[._-]+/g, ' ').replace(/\b(480p|720p|1080p|2160p|h264|h265|x264|x265|avc|hevc)\b/gi, '').replace(/\s+/g, ' ').trim();
  const episodeNumber = (name = '', index = 0) => {
    const match = name.match(/(?:s\d+\s*)?(?:e|ep|episode|part|pt)\s*0*(\d+)/i) || name.match(/\b(\d{1,3})\b/);
    return match ? Number(match[1]) : index + 1;
  };
  const isPlayable = (file) => file && !file.private && file.name && (/\.(mp4|webm|ogv)$/i.test(file.name) || /mpeg4|webm|ogg video|matroska/i.test(file.format || '')) && !/thumb|sample|preview|metadata/i.test(file.name);
  const mimeFor = (file) => /webm/i.test(file.format || '') ? 'video/webm' : /\.ogv$/i.test(file.name) ? 'video/ogg' : 'video/mp4';
  const fileUrl = (id, file) => `https://archive.org/download/${encodeURIComponent(id)}/${file.name.split('/').map(encodeURIComponent).join('/')}`;

  function injectStyles() {
    if ($('#episodes-style')) return;
    const style = document.createElement('style');
    style.id = 'episodes-style';
    style.textContent = `
      .movie-detail-page{opacity:0;transition:opacity .18s ease}
      .movie-detail-page:not(.hidden){opacity:1}
      .detail-media-wrap,.detail-content,.episode-panel{animation:moviedRise .28s ease both}
      .episode-panel{margin-top:22px;padding:22px;border:1px solid #2e2e34;border-radius:18px;background:#111114}
      .episode-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:14px}
      .episode-head h2{font-size:25px;margin:0;letter-spacing:-.04em}
      .episode-count{font-size:12px;color:#8e8c87}
      .episode-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:290px;overflow:auto;padding-right:3px;scrollbar-width:thin}
      .episode-item{display:grid;grid-template-columns:40px 1fr 28px;align-items:center;gap:10px;min-height:62px;padding:9px 11px;border:1px solid #2b2b30;border-radius:13px;background:#17171a;color:#f6f3ec;text-align:left;transition:background .16s ease,border-color .16s ease,transform .16s ease}
      .episode-item:hover{background:#202025;border-color:#414149;transform:translateY(-1px)}
      .episode-item.active{background:#242428;border-color:#5a5a61;box-shadow:inset 3px 0 0 #ffb000}
      .episode-number{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#222227;color:#aaa8a3;font-size:11px;font-weight:800}
      .episode-item.active .episode-number{background:#ffb000;color:#17130a}
      .episode-copy{min-width:0;display:flex;flex-direction:column;gap:4px}
      .episode-copy strong{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .episode-copy small{font-size:10px;color:#888680;text-transform:uppercase;letter-spacing:.08em}
      .episode-play{font-size:13px;color:#77756f;text-align:center}.episode-item.active .episode-play{color:#ffb000}
      @keyframes moviedRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @media(max-width:760px){.episode-panel{margin-top:16px;padding:16px;border-radius:15px}.episode-list{grid-template-columns:1fr;max-height:310px}.episode-item{min-height:58px}}
    `;
    document.head.appendChild(style);
  }

  function setStatus(text) { const status = $('#playerStatus'); if (status) status.textContent = text; }

  function groupFiles(id, files) {
    const candidates = files.filter(isPlayable);
    const groups = new Map();
    candidates.forEach((file, index) => {
      const label = cleanName(file.name) || `Episode ${index + 1}`;
      const key = label.toLowerCase().replace(/\b(episode|ep|part|pt)\s*\d+\b/gi, '').replace(/\s+/g, ' ').trim() || `episode-${index + 1}`;
      const existing = groups.get(key);
      const better = !existing || (/\.mp4$/i.test(file.name) && !/\.mp4$/i.test(existing.name)) || Number(file.size || 0) > Number(existing.size || 0);
      if (better) groups.set(key, file);
    });
    return [...groups.values()].map((file, index) => {
      const explicit = file.name.match(/(?:e|ep|episode|part|pt)\s*0*(\d+)/i);
      const seasonMatch = file.name.match(/s(\d+)/i);
      return {
        id: `${id}:${file.name}`, name: file.name,
        label: explicit ? `Episode ${Number(explicit[1])}` : (cleanName(file.name) || `Episode ${index + 1}`),
        number: episodeNumber(file.name, index), season: seasonMatch ? Number(seasonMatch[1]) : null,
        url: fileUrl(id, file), mime: mimeFor(file)
      };
    }).sort((a,b) => (a.season || 0) - (b.season || 0) || a.number - b.number || a.label.localeCompare(b.label));
  }

  function renderEpisodes(items, id) {
    const panel = $('#episodePanel'), list = $('#episodeList'), count = $('#episodeCount');
    if (!panel || !list) return;
    currentId = id; catalog = items;
    if (items.length < 2) { panel.classList.add('hidden'); list.innerHTML = ''; return; }
    panel.classList.remove('hidden'); count.textContent = `${items.length} episodes`;
    list.innerHTML = items.map((ep, i) => `<button class="episode-item ${i === 0 ? 'active' : ''}" type="button" data-episode-index="${i}"><span class="episode-number">${String(i + 1).padStart(2, '0')}</span><span class="episode-copy"><strong>${escapeHtml(ep.label)}</strong><small>${ep.season ? `Season ${ep.season} · ` : ''}${ep.mime.replace('video/','').toUpperCase()}</small></span><span class="episode-play">▶</span></button>`).join('');
    list.querySelectorAll('[data-episode-index]').forEach(button => button.addEventListener('click', () => playEpisode(Number(button.dataset.episodeIndex))));
  }

  function playEpisode(index, autoplay = true) {
    const episode = catalog[index], player = $('#videoPlayer');
    if (!episode || !player) return;
    player.pause(); player.src = episode.url; player.type = episode.mime; player.load(); player.dataset.episodeIndex = String(index);
    setStatus(`${episode.label} · Loading…`);
    document.querySelectorAll('.episode-item').forEach((el, i) => el.classList.toggle('active', i === index));
    player.addEventListener('loadedmetadata', () => { setStatus(`${episode.label} · Ready to watch`); if (autoplay) player.play().catch(() => {}); }, { once:true });
  }

  async function inspectDetail() {
    const page = $('#movieDetailPage'), link = $('#playerSourceLink');
    if (!page || !link || page.classList.contains('hidden') || !link.href) return;
    const match = link.href.match(/\/details\/([^/?#]+)/); if (!match) return;
    const id = decodeURIComponent(match[1]); if (id === currentId) return; currentId = id;
    try {
      const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error('Episode metadata unavailable');
      const data = await response.json(); renderEpisodes(groupFiles(id, Array.isArray(data.files) ? data.files : []), id);
    } catch (error) { console.warn('Episode scan failed', error); $('#episodePanel')?.classList.add('hidden'); }
  }

  function boot() {
    injectStyles();
    const page = $('#movieDetailPage'), player = $('#videoPlayer'); if (!page || !player) return;
    new MutationObserver(() => {
      const visible = !page.classList.contains('hidden');
      if (visible !== lastPageVisible) { lastPageVisible = visible; if (visible) { currentId = ''; inspectDetail(); } }
    }).observe(page, { attributes:true, attributeFilter:['class'] });
    player.addEventListener('loadstart', () => $('#movieDetailPage .detail-loading')?.classList.add('visible'));
    player.addEventListener('loadeddata', () => $('#movieDetailPage .detail-loading')?.classList.remove('visible'));
    player.addEventListener('canplay', () => $('#movieDetailPage .detail-loading')?.classList.remove('visible'));
    player.addEventListener('ended', () => {
      const next = Number(player.dataset.episodeIndex || 0) + 1;
      if (catalog[next]) playEpisode(next, true);
    });
    window.addEventListener('load', inspectDetail);
  }

  boot();
})();
