// Minimal, dependency-free i18n loader for static sites
(function () {
  const supported = ['en', 'tr', 'ru'];
  const defaultLang = 'en';

  function pathLang() {
    const segs = window.location.pathname.replace(/^\//, '').split('/');
    if (segs[0] && supported.includes(segs[0])) return segs[0];
    return null;
  }

  function pathPage() {
    const segs = window.location.pathname.replace(/^\//, '').split('/');
    // expected paths: /en/privacy/ or /tr/terms/
    if (segs[0] && supported.includes(segs[0]) && segs[1]) return segs[1].replace(/\/.*/, '');
    // fallback when served as /privacy.html or /terms.html
    const file = window.location.pathname.split('/').pop();
    if (file.includes('privacy')) return 'privacy';
    if (file.includes('terms')) return 'terms';
    return 'privacy';
  }

  function getNested(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
  }

  function applyTranslations(data) {
    if (!data) return;
    if (data.title) document.title = data.title;
    // replace all nodes with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getNested(data, key);
      if (val !== null) {
        // allow HTML when element has data-i18n-html
        if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
        else el.textContent = val;
      }
    });
    // content slot replace
    const slot = document.getElementById('i18n-content');
    if (slot && data.content) slot.innerHTML = data.content;
  }

  function buildLangSwitcher(currentLang, page) {
    const container = document.getElementById('lang-switcher');
    if (!container) return;
    container.innerHTML = '';
    supported.forEach(l => {
      const a = document.createElement('a');
      a.href = `/${l}/${page}`;
      a.textContent = l.toUpperCase();
      a.className = 'lang-link' + (l === currentLang ? ' active' : '');
      a.addEventListener('click', e => {
        // persist choice
        localStorage.setItem('lang', l);
      });
      container.appendChild(a);
      if (l !== supported[supported.length - 1]) container.appendChild(document.createTextNode(' | '));
    });
  }

  function insertHreflangs(page) {
    const head = document.head;
    supported.forEach(l => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l;
      link.href = `${window.location.origin}/${l}/${page}`;
      head.appendChild(link);
    });
    // x-default
    const def = document.createElement('link');
    def.rel = 'alternate';
    def.hreflang = 'x-default';
    def.href = `${window.location.origin}/${defaultLang}/${page}`;
    head.appendChild(def);
  }

  async function init() {
    const p = pathPage();
    const urlLang = pathLang();
    const stored = localStorage.getItem('lang');
    const lang = urlLang || stored || defaultLang;

    // if user is on a non-localized path (no lang in url) redirect to persisted/lang
    if (!urlLang) {
      const newPath = `/${lang}/${p}`;
      if (window.location.pathname.replace(/\/+$/,'') !== newPath) {
        window.history.replaceState({}, '', newPath);
      }
    }

    insertHreflangs(p);
    buildLangSwitcher(lang, p);

    try {
      const res = await fetch(`/i18n/${lang}/${p}.json`, {cache: 'no-cache'});
      if (!res.ok) throw new Error('Missing translation');
      const data = await res.json();
      applyTranslations(data);
    } catch (e) {
      // fallback to default
      if (lang !== defaultLang) {
        try {
          const res2 = await fetch(`/i18n/${defaultLang}/${p}.json`, {cache: 'no-cache'});
          const data2 = await res2.json();
          applyTranslations(data2);
        } catch (_) { console.error('Failed to load fallback translations'); }
      } else console.error('Failed to load translations', e);
    }
  }

  // run after DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
