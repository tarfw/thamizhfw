import { getTimeline, getIncidents, getMemorials, getTestimonies, getConventions, getLegalDocs, getMediaMentions } from "../data/api";

let DATA: { timeline: any[]; incidents: any[]; memorials: any[]; testimonies: any[]; conventions: any[]; legalDocs: any[]; media: any[] } = { timeline: [], incidents: [], memorials: [], testimonies: [], conventions: [], legalDocs: [], media: [] };
let currentData: { title: string; date: string; description: string; category: string } = { title: '', date: '', description: '', category: '' };

async function load() {
  const [timeline, incidents, memorials, testimonies, conventions, legalDocs, media] = await Promise.all([
    getTimeline(), getIncidents(), getMemorials(), getTestimonies(), getConventions(), getLegalDocs(), getMediaMentions()
  ]);
  DATA = { timeline, incidents, memorials, testimonies, conventions, legalDocs, media };
  renderSidebar();
  renderPanel();
}

function renderSidebar() {
  const list = document.getElementById('sidebarList')!;
  const sections = [
    { key: 'incidents', label: 'Incidents', items: DATA.incidents.map((i: any) => ({
      title: i.title, meta: (i.date || '—') + ' · ' + (i.location || '—'), target: 'inc-' + i.id
    })) },
    { key: 'timeline', label: 'Timeline', items: DATA.timeline.map((e: any) => ({
      title: e.title, meta: e.date + ' · ' + e.category, target: 'tl-' + e.id
    })) },
    { key: 'memorial', label: 'Memorial', items: DATA.memorials.map((m: any) => ({
      title: m.victimName, meta: 'Age ' + (m.age || '—') + (m.village ? ' · ' + m.village : '')
    })) },
    { key: 'legal', label: 'Legal', items: [
      ...DATA.conventions.map((c: any) => ({ title: c.name, meta: c.type })),
      ...DATA.legalDocs.map((d: any) => ({ title: d.title, meta: d.source || '—' }))
    ] }
  ];

  let html = '';
  sections.forEach((sec, si) => {
    html += `<div class="list-section${si === 0 ? ' active' : ''}" data-list="${sec.key}">`;
    if (sec.items.length > 0) {
      sec.items.forEach((item, ii) => {
        const targetAttr = item.target ? `data-target="${item.target}"` : '';
        html += `<div class="list-item" ${targetAttr}>
          <div class="li-title">${esc(item.title)}</div>
          <div class="li-meta">${esc(item.meta)}</div>
        </div>`;
      });
    } else {
      html += `<div class="list-item"><div class="li-title" style="color:#7a7f8a">No ${sec.label.toLowerCase()}</div></div>`;
    }
    html += '</div>';
  });
  list.innerHTML = html;
  bindSidebarEvents();
}

function esc(s: string) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function bindSidebarEvents() {
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.list-section').forEach(l => l.classList.toggle('active', (l as HTMLElement).dataset.list === (tab as HTMLElement).dataset.tab));
      showPanel('overview');
    });
  });
  document.querySelectorAll('.list-item[data-target]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      showPanel((item as HTMLElement).dataset.target!);
    });
  });
  if (DATA.incidents.length > 0) showPanel('inc-' + DATA.incidents[0].id);
}

function showPanel(id: string) {
  document.querySelectorAll('.p-section').forEach(p => p.classList.remove('active'));
  const target = document.querySelector(`[data-panel="${id}"]`);
  if (target) target.classList.add('active');
  if (id.startsWith('inc-')) {
    const inc = DATA.incidents.find((i: any) => 'inc-' + i.id === id);
    if (inc) currentData = { title: inc.title, date: inc.date, description: inc.description, category: inc.category };
  }
}

function renderPanel() {
  const container = document.getElementById('panelContent')!;
  let html = '';
  DATA.incidents.forEach((inc: any, i: number) => {
    const relatedMedia = DATA.media.filter((m: any) => m.title && m.title.toLowerCase().includes(inc.title.toLowerCase()));
    html += `<div class="p-section${i === 0 ? ' active' : ''}" data-panel="inc-${inc.id}">
      <div class="p-header">
        <div class="p-label">Incident</div>
        <h1 class="p-title">${esc(inc.title)}</h1>
        <p class="p-desc">${esc(inc.description || 'No description provided.')}</p>
      </div>
      <div class="detail-card">
        <div class="detail-date">${esc(inc.date || 'Date unknown')} — ${esc(inc.location || 'Location unknown')}</div>
        <div class="detail-desc">${esc(inc.description || 'No description provided.')}</div>
        <div class="detail-meta">
          <span>${inc.evidenceCount} evidence items</span>
          <span>${inc.witnessCount} witnesses</span>
          <span>Category: ${esc(inc.category || '—')}</span>
        </div>
      </div>
      <div class="media-section">
        <div class="media-label">Related Media Coverage</div>
        ${relatedMedia.length > 0 ? `<div class="media-grid">${relatedMedia.map((m: any) => `
          <div class="media-card">
            <div class="m-source">${esc(m.source)}</div>
            <div class="m-title">${esc(m.title)}</div>
            <div class="m-summary">${esc(m.summary ? m.summary.substring(0, 140) + '...' : '')}</div>
            <div class="m-date">${esc(m.publishedAt || '')}</div>
          </div>`).join('')}</div>` : '<div class="empty">No related media coverage</div>'}
      </div>
    </div>`;
  });

  html += `<div class="p-section" data-panel="overview">
    <div class="p-header">
      <div class="p-label">Overview</div>
      <h1 class="p-title">Archive <em>Dashboard</em></h1>
      <p class="p-desc">Select an incident from the left panel to view details and related media.</p>
    </div>`;

  if (DATA.timeline.length > 0) {
    html += `<div><div class="media-label">Recent Timeline Events</div><div class="tl-detail">`;
    DATA.timeline.slice(0, 5).forEach((ev: any) => {
      html += `<div class="tl-row"><div class="tl-date">${esc(ev.date)}</div><div>
        <div class="tl-title">${esc(ev.title)}</div>
        <div class="tl-desc">${esc(ev.description ? ev.description.substring(0, 100) + '...' : '')}</div>
        <div class="tl-tags"><span class="tl-tag">${esc(ev.category)}</span></div>
      </div></div>`;
    });
    html += `</div></div>`;
  }

  if (DATA.memorials.length > 0) {
    html += `<div><div class="media-label">Memorialized Victims</div><div class="memorial">`;
    DATA.memorials.forEach((m: any) => {
      html += `<div class="memorial-card">
        <div class="v-name">${esc(m.victimName)}</div>
        <div class="v-age">Age ${m.age || '—'}</div>
        <div class="v-place">${esc(m.village || '')}${m.district ? ', ' + esc(m.district) : ''}</div>
      </div>`;
    });
    html += `</div></div>`;
  }

  if (DATA.conventions.length > 0 || DATA.legalDocs.length > 0) {
    html += `<div><div class="media-label">Legal Framework</div><div class="legal-grid">`;
    DATA.conventions.forEach((c: any) => {
      html += `<div class="legal-card"><div class="l-type">${esc(c.type)}</div><div class="l-name">${esc(c.name)}</div></div>`;
    });
    DATA.legalDocs.forEach((d: any) => {
      html += `<div class="legal-card"><div class="l-type">${esc(d.source || 'Legal Document')}</div><div class="l-name">${esc(d.title)}</div></div>`;
    });
    html += `</div></div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
  if (DATA.incidents.length > 0) {
    currentData = { title: DATA.incidents[0].title, date: DATA.incidents[0].date, description: DATA.incidents[0].description, category: DATA.incidents[0].category };
  }
}

let loadedImage: HTMLImageElement | null = null;
const img = new Image();
img.crossOrigin = 'anonymous';
img.onload = () => { loadedImage = img; };
img.src = '/img/refugee.jpg';

function drawCard() {
  const canvas = document.getElementById('cardCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  if (loadedImage) ctx.drawImage(loadedImage, 0, 0, 1080, 1080);
  else { ctx.fillStyle = '#F5F0EB'; ctx.fillRect(0, 0, 1080, 1080); }
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 100);
  ctx.fillStyle = '#000'; ctx.font = '900 36px "IBM Plex Sans", sans-serif'; ctx.fillText('TAMIL EELAM GENOCIDE', 60, 60);
  ctx.textAlign = 'right'; ctx.fillStyle = '#333'; ctx.font = '600 18px "IBM Plex Mono", monospace'; ctx.fillText('tamilgenocide.org', 1020, 60); ctx.textAlign = 'left';
  ctx.fillStyle = '#111'; ctx.fillRect(0, 880, 1080, 200);
  ctx.fillStyle = '#fff'; ctx.font = '700 32px "IBM Plex Sans", sans-serif'; ctx.fillText(currentData.title || 'Untitled Incident', 60, 950);
  if (currentData.date) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 14px "IBM Plex Mono", monospace'; ctx.fillText(currentData.date, 60, 990); }
  if (currentData.description) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '400 13px "IBM Plex Sans", sans-serif'; ctx.fillText(currentData.description.substring(0, 80), 60, 1020); }
}

(document as any).generateCard = function(_platform: string) {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  drawCard(); document.getElementById('cardModal')!.classList.add('show');
};
(document as any).closeModal = function() { document.getElementById('cardModal')!.classList.remove('show'); };
(document as any).downloadCard = function() {
  const c = document.getElementById('cardCanvas') as HTMLCanvasElement;
  const l = document.createElement('a'); l.download = 'tamil-eelam-genocide-card.png'; l.href = c.toDataURL('image/png'); l.click();
};
(document as any).shareTwitter = function() {
  drawCard(); const t = encodeURIComponent(currentData.title + ' — Tamil Eelam Genocide\n\ntamilgenocide.org');
  window.open('https://twitter.com/intent/tweet?text=' + t, '_blank', 'width=600,height=400');
};
(document as any).shareWhatsApp = function() {
  drawCard(); const t = encodeURIComponent(currentData.title + ' — Tamil Eelam Genocide\n\ntamilgenocide.org');
  window.open('https://wa.me/?text=' + t, '_blank');
};

document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('.dropdown')) document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
});

load();
