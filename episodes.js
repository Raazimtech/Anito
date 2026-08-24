(() => {
  const $ = (s) => document.querySelector(s);
  let catalog = [];
  let currentId = '';
  let observer;

  const cleanName = (name = '') => name
    .split('/').pop()
    .replace(/\.(mp4|webm|ogv)$/i, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\b(480p|720p|1080p|2160p|h264|h265|x264|x265|avc|hevc)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const episodeNumber = (name = '', index = 0) => {
    const match = name.match(/(?:s\d+\s*)?(?:e|ep|episode|part|pt)\s*0*(\d+)/i) || name.match(/\b(\d{1,3})\b/);
    return match ? Number(match[1]) : index + 1;
  };

  const isPlayable = (file) => file && !file.private && file.name &&
    (/\.(mp4|webm|ogv)$/i.test(file.name) || /mpeg4|webm|ogg video|matroska/i.test(file.format || '')) &&
    !/thumb|sample|preview|metadata/i.test(file.name);

  const mimeFor = (file) => /webm/i.test(file.format || '') ? 'video/webm' : /\.ogv$/i.test(file.name) ? 'video/ogg' : 'video/mp4';

  const fileUrl = (id, file) => `https://archive.org/download/${encodeURIComponent(id)}/${file.name.split('/').map(encodeURIComponent).join('/')}`;

  function groupFiles(id, files) {
    const candidates = files.filter(isPlayable);
    const groups = new Map();
    candidates.forEach((file, index) => {
      const label = cleanName(file.name) || `Episode ${index + 1}`;
      const normalized = label.toLowerCase().replace(/\b(episode|ep|part|pt)\s*\d+\b/gi, '').replace(/\s+/g, ' ').trim();
      const key = normalized || `episode-${index + 1}`;
      const existing = groups.get(key);
      const better = !existing || (/\.mp4$/i.test(file.name) && !/\.mp4$/i.test(existing.name)) || Number(file.size || 0) > Number(existing.size || 0);
      if (better) groups.set(key, file);
    });

    return [...groups.values()]
      .map((file, index) => {
        const number = episodeNumber(file.name, index);
        const parsed = cleanName(file.name);
        const seasonMatch = file.name.match(/s(\d+)/i);
        const season = seasonMatch ? Number(seasonMatch[1]) : null;
        const explicit = file.name.match(/(?:e|ep|episode|part|pt)\s*0*(\d+)/i);
        const title = explicit ? `Episode ${Number(explicit[1])}` : (parsed || `Episode ${index + 1}`);
        return { id: `${id}:${file.name}`, name: file.name, label: title, number, season, url: fileUrl(id, file), mime: mimeFor(file), size: Number(file.size || 0) };
      })
      .sort((a, b) => (a.season || 0) - (b.season || 0) || a.number - b.number || a.label.localeCompare(b.label));
  }

  function renderEpisodes(items, id) {
    const panel = $('#episodePanel');
    const list = $('#episodeList');
    const count = $('#episodeCount');
    if (!panel || !list) return;
    currentId = id;
    if (items.length < 2) {
      panel.classList.add('hidden');
      list.innerHTML = '';
      return;
    }
    catalog = items;
    panel.classList.remove('hidden');
    count.textContent = `${items.length} episodes`;
    list.innerHTML = items.map((ep, i) => `
      <button class="episode-item ${i === 0 ? 'active' : ''}" type="button" data-episode-id="${encodeURIComponent(ep.id)}">
        <span class="episode-number">${String(i + 1).padStart(2, '0')}</span>
        <span class="episode-copy"><strong>${escapeHtml(ep.label)}</strong><small>${ep.season ? `Season ${ep.season} · ` : ''}${ep.mime.replace('video/','').toUpperCase()}</small></span>
        <span class="episode-play">▶</span>
      </button>`).join('');
    list.querySelectorAll('[data-episode-id]').forEach((button, index) => button.addEventListener('click', () => playEpisode(index)));
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  }

  function setStatus(text) {
    const status = $('#playerStatus');
    if (status) status.textContent = text;
  }

  function playEpisode(index) {
    const episode = catalog[index];
    const player = $('#videoPlayer');
    if (!episode || !player) return;
    player.pause();
    player.src = episode.url;
    player.type = episode.mime;
    player.load();
    setStatus(`${episode.label} · Loading…`);
    document.querySelectorAll('.episode-item').forEach((el, i) => el.classList.toggle('active', i === index));
    player.addEventListener('loadedmetadata', () => {
      setStatus(`${episode.label} · Ready to watch`);
      player.play().catch(() => {});
    }, { once: true });
  }

  async function inspectDetail() {
    const page = $('#movieDetailPage');
    const link = $('#playerSourceLink');
    if (!page || !link || page.classList.contains('hidden') || !link.href) return;
    const match = link.href.match(/\/details\/([^/?#]+)/);
    if (!match) return;
    const id = decodeURIComponent(match[1]);
    if (id === currentId) return;
    currentId = id;
    try {
      const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error('Episode metadata unavailable');
      const data = await response.json();
      renderEpisodes(groupFiles(id, Array.isArray(data.files) ? data.files : []), id);
    } catch (error) {
      console.warn('Episode scan failed', error);
      $('#episodePanel')?.classList.add('hidden');
    }
  }

  function smoothWatch() {
    const page = $('#movieDetailPage');
    if (!page) return;
    const loading = page.querySelector('.detail-loading');
    const player = $('#videoPlayer');
    player?.addEventListener('loadstart', () => loading?.classList.add('visible'));
    player?.addEventListener('loadeddata', () => loading?.classList.remove('visible'));
    player?.addEventListener('canplay', () => loading?.classList.remove('visible'));
    const previous = new MutationObserver(() => { if (!page.classList.contains('hidden')) inspectDetail(); });
    previous.observe(page, { attributes: true, attributeFilter: ['class'] });
  }

  function boot() {
    observer = new MutationObserver(() => inspectDetail());
    const page = $('#movieDetailPage');
    if (page) observer.observe(page, { childList: true, subtree: true, attributes: true });
    smoothWatch();
    window.addEventListener('load', inspectDetail);
  }

  boot();
})();
