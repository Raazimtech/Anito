(() => {
  const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';
  const MIN_YEAR = 2000;
  const MAX_YEAR = new Date().getUTCFullYear();

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    try {
      const rawUrl = typeof input === 'string' ? input : input?.url;
      if (rawUrl && rawUrl.startsWith(ARCHIVE_SEARCH)) {
        const url = new URL(rawUrl);
        const currentQuery = url.searchParams.get('q') || 'mediatype:movies';
        const modernConstraint = `year:[${MIN_YEAR} TO ${MAX_YEAR}]`;

        if (!currentQuery.includes('year:[')) {
          url.searchParams.set('q', `(${currentQuery}) AND ${modernConstraint}`);
        }

        // Release year is a much better default ranking for Movied than archive popularity.
        url.searchParams.set('sort', 'year desc');
        return originalFetch(url.toString(), init);
      }
    } catch (error) {
      console.warn('Movied catalogue filter fallback:', error);
    }
    return originalFetch(input, init);
  };
})();
