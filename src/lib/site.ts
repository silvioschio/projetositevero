// Comportamentos do site no navegador.

// ---------- Header e menu ----------
const header = document.querySelector<HTMLElement>('.site-header');
if (header && !header.classList.contains('solid')) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
toggle?.addEventListener('click', () => links?.classList.toggle('open'));

// ---------- Origem do visitante (UTM / anúncio) ----------
// Guarda na sessão os parâmetros da primeira página visitada, para enviar junto com o lead.
const params = new URLSearchParams(location.search);
const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
if (utmKeys.some((k) => params.has(k))) {
  const utm: Record<string, string> = {};
  utmKeys.forEach((k) => params.get(k) && (utm[k] = params.get(k)!));
  sessionStorage.setItem('vero_utm', JSON.stringify(utm));
}
if (!sessionStorage.getItem('vero_ref')) sessionStorage.setItem('vero_ref', document.referrer || 'direto');

// ---------- Formulários de lead ----------
document.querySelectorAll<HTMLFormElement>('.lead-form form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const box = form.closest('.lead-form')!;
    box.classList.remove('error');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    const data: Record<string, unknown> = Object.fromEntries(new FormData(form));
    data.origem = form.dataset.origem;
    data.pagina = location.href;
    data.utm = JSON.parse(sessionStorage.getItem('vero_utm') || '{}');
    data.referrer = sessionStorage.getItem('vero_ref');

    try {
      const res = await fetch('/api/lead/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      box.classList.add('sent');
      form.dispatchEvent(new CustomEvent('lead:enviado', { bubbles: true }));
      // Evento para Google Analytics / Meta Pixel, se instalados
      (window as any).dataLayer?.push({ event: 'lead', origem: data.origem });
      (window as any).fbq?.('track', 'Lead', { content_name: data.origem });
    } catch {
      box.classList.add('error');
      btn.disabled = false;
      btn.textContent = label;
    }
  });
});

// ---------- Cliques no WhatsApp (para Google Analytics / Meta Pixel) ----------
document.querySelectorAll<HTMLAnchorElement>('[data-track]').forEach((a) =>
  a.addEventListener('click', () => {
    (window as any).dataLayer?.push({ event: a.dataset.track, corretor: a.dataset.corretor });
    (window as any).fbq?.('track', 'Contact', { content_name: a.dataset.corretor || a.dataset.track });
  }),
);

// ---------- Busca da home ----------
document.querySelectorAll<HTMLButtonElement>('.search-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.search-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const f = tab.closest('form');
    if (f) f.action = tab.dataset.action || '/imoveis/';
    const st = f?.querySelector<HTMLInputElement>('input[name=status]');
    if (st) st.value = tab.dataset.status || '';
  });
});

// ---------- Filtros da listagem ----------
const grid = document.querySelector<HTMLElement>('[data-listagem]');
if (grid) {
  const selects = document.querySelectorAll<HTMLSelectElement>('.filters select');
  const count = document.querySelector('.result-count');
  const empty = document.querySelector<HTMLElement>('.empty');
  // Aplica filtros vindos da URL (busca da home)
  selects.forEach((s) => {
    const v = params.get(s.name);
    if (v && [...s.options].some((o) => o.value === v)) s.value = v;
  });
  const apply = () => {
    const f = Object.fromEntries([...selects].map((s) => [s.name, s.value]));
    let n = 0;
    grid.querySelectorAll<HTMLElement>('.card').forEach((card) => {
      const d = card.dataset;
      const ok =
        (!f.cidade || d.cidade === f.cidade) &&
        (!f.tipo || d.tipo === f.tipo) &&
        (!f.suites || Number(d.suites) >= Number(f.suites)) &&
        (!f.status || d.status === f.status);
      card.style.display = ok ? '' : 'none';
      if (ok) n++;
    });
    document.querySelectorAll<HTMLElement>('[data-chip]').forEach((c) =>
      c.classList.toggle('active', (c.dataset.chip ?? '') === (f.cidade ?? '')));
    if (count) count.textContent = `${n} imóve${n === 1 ? 'l' : 'is'} encontrado${n === 1 ? '' : 's'}`;
    if (empty) empty.style.display = n ? 'none' : 'block';
  };
  selects.forEach((s) => s.addEventListener('change', apply));
  apply();
}

// ---------- Galeria (lightbox) ----------
const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const fotos = JSON.parse(gallery.getAttribute('data-gallery') || '[]') as { src: string; alt: string }[];
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<button class="lb-close" aria-label="Fechar">×</button><button class="lb-prev" aria-label="Anterior">‹</button><img alt=""><button class="lb-next" aria-label="Próxima">›</button>';
  document.body.appendChild(lb);
  const img = lb.querySelector('img')!;
  let idx = 0;
  const show = (i: number) => {
    idx = (i + fotos.length) % fotos.length;
    img.src = fotos[idx].src;
    img.alt = fotos[idx].alt;
  };
  gallery.querySelectorAll<HTMLAnchorElement>('a').forEach((a, i) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      show(i);
      lb.classList.add('open');
    }),
  );
  lb.querySelector('.lb-close')!.addEventListener('click', () => lb.classList.remove('open'));
  lb.querySelector('.lb-prev')!.addEventListener('click', () => show(idx - 1));
  lb.querySelector('.lb-next')!.addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => e.target === lb && lb.classList.remove('open'));
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
}
