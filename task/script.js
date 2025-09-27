// ===================
// Sumber data dari CSV publish-to-web
// ===================
let tasks = [];                 // akan diisi dari CSV
let hasAnimatedCards = false;   // animasi kartu hanya saat load pertama

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCvNsf3gz_RXNFc4vGAb6C5Lv4OYDZSan2dNcRvbvg3rODjCqG1LpklElMMXvRcNTkOP68v_NW81KD/pub?output=csv';
const JADWAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCvNsf3gz_RXNFc4vGAb6C5Lv4OYDZSan2dNcRvbvg3rODjCqG1LpklElMMXvRcNTkOP68v_NW81KD/pub?gid=0&output=csv'; // ganti gid sesuai sheet jadwal

function parseCSV(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || '');
    return obj;
  });
}

// Helper: tunggu transisi (default: opacity) selesai dengan fallback timeout
function waitTransition(el, prop = 'opacity', timeout = 1000) {
  return new Promise(resolve => {
    if (!el) return resolve();
    let done = false;
    const end = (e) => {
      if (e && e.propertyName && e.propertyName !== prop) return;
      if (done) return;
      done = true;
      el.removeEventListener('transitionend', end);
      resolve();
    };
    el.addEventListener('transitionend', end);
    setTimeout(() => {
      if (done) return;
      done = true;
      el.removeEventListener('transitionend', end);
      resolve();
    }, timeout);
  });
}

// Crossfade: loading-layer -> text-layer (status)
async function crossfadeStatus() {
  const loadingLayer = document.getElementById('loading-layer');
  const textLayer = document.getElementById('text-layer');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!loadingLayer || !textLayer) return;

  if (reduceMotion) {
    loadingLayer.classList.remove('is-visible');
    textLayer.classList.add('is-visible');
    return;
  }

  // Pastikan state awal
  loadingLayer.classList.add('is-visible');
  textLayer.classList.remove('is-visible');

  // Paksa reflow agar state awal ter-apply
  void loadingLayer.offsetHeight;

  // Trigger crossfade pada frame berikutnya
  await new Promise(r => requestAnimationFrame(() => {
    loadingLayer.classList.remove('is-visible');  // fade-out
    textLayer.classList.add('is-visible');        // fade-in
    r();
  }));

  // Tunggu transisi selesai (opacity)
  await Promise.all([waitTransition(loadingLayer), waitTransition(textLayer)]);
}

async function loadTasksFromCSV() {
  const disclaimer = document.getElementById('disclaimer');
  const info = document.getElementById('info');
  const footerLU = document.getElementById('footer-last-updated');
  const footerEl = document.getElementById('footer');
  const pill = document.getElementById('pill');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    const url = `${CSV_URL}&t=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch gagal');

    const csv = await res.text();
    const rows = parseCSV(csv);

    // Last updated dari Sheet (kolom header "lastUpdated")
    const luRaw = (rows.find(r => r.lastUpdated && r.lastUpdated.trim()) || {}).lastUpdated || '';
    if (luRaw && footerLU) {
      const luDate = parseDDMMYYYY_HHmmss(luRaw);
      if (luDate && !Number.isNaN(luDate.getTime())) {
        footerLU.textContent = `Last Updated: ${formatLastUpdated(luDate)}`;
        if (disclaimer) disclaimer.textContent = "Data diupdate oleh Ricky, jadi tolong ingetin kalo lupa. Mwehhweh..";
        if (info) info.textContent = "Ketuk tugas untuk menandainya sebagai selesai";
      }
    }

    // Map data
    tasks = rows.filter(r => r.title).map(r => ({
      id: r.id || crypto.randomUUID(),
      category: r.category || '',
      title: r.title || '',
      deadlineDate: r.deadlineDate || ''
    }));

    // Render kartu (awal: .is-hidden jika pertama)
    renderTasks();

    // Crossfade status (spinner -> teks status)
    await crossfadeStatus();

    // Reveal kartu berurutan (sekali di load pertama)
    if (!hasAnimatedCards) {
      revealCards(80);
      hasAnimatedCards = true;
    }

    if (footerEl) {
      requestAnimationFrame(() => footerEl.classList.add('is-visible'));
    }
    if (pill) {
      requestAnimationFrame(() => pill.classList.add('is-visible'));
    }

    if (!reduceMotion) {
      [disclaimer, info].filter(Boolean).forEach((el, i) => {
        el.style.transition = 'opacity 300ms ease, transform 300ms ease';
        el.style.transitionDelay = `${100 + i * 100}ms`;
      });
    }
  } catch (e) {
    console.error('Gagal muat data tugas', e);
    // Fallback: tetap tampilkan UI
    const loadingLayer = document.getElementById('loading-layer');
    const textLayer = document.getElementById('text-layer');
    loadingLayer?.classList.remove('is-visible');
    textLayer?.classList.add('is-visible');
    if (footerEl) footerEl.classList.add('is-visible');
    if (pill) pill.classList.add('is-visible');
  }
}

// Fade-in berurutan untuk kartu setelah loading/status
function revealCards(stagger = 80) {
  const cards = document.querySelectorAll('.card.is-hidden');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  cards.forEach((card, i) => {
    if (!reduceMotion) {
      card.style.transitionDelay = `${i * stagger}ms`;
    }
    requestAnimationFrame(() => {
      card.classList.remove('is-hidden');
    });
    const onEnd = (e) => {
      if (e.propertyName === 'opacity') {
        card.style.transitionDelay = '';
        card.removeEventListener('transitionend', onEnd);
      }
    };
    card.addEventListener('transitionend', onEnd);
  });
}

// Fade-in halaman saat siap
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('is-ready'));
  loadTasksFromCSV();
});

// ===================
// Pemetaan kategori dan jam pelajaran
// ===================
const categoryMap = {
  "AGH": "Agama Hindu","BID": "Bahasa Indonesia","BEN": "Bahasa Inggris","BBL": "Bahasa Bali",
  "DTM1": "DPK TKJ 1 (Selasa)","DTM2": "DPK TKJ 1 (Jumat)","DTP": "DPK TKJ 2","INF": "Informatika",
  "KKA": "KKA","PAS": "Projek IPAS","PJK": "PJOK","MTK": "Matematika","PKN": "PKN","SJH": "Sejarah","SEN": "Seni Budaya"
};

// Ubah timeMap agar sesuai dengan tabel baru (jam pelajaran per hari)
const timeMap = {
  // Senin
  "PJK": "1-3",
  "AGH": "4-6",
  "PKN": "7-8",
  "SJH": "9-10",
  // Selasa
  "MTK": "1-3",
  "DTM1": "4-7",
  "BID": "8-10",
  // Rabu
  "PAS": "1-6",
  "BEN": "7-8",
  "BBL": "9-10",
  // Kamis
  "DTP": "1-6",
  "KKA": "7-8",
  "SEN": "9-10",
  // Jumat
  "KKL": "1-4",
  "DTM2": "5-6",
  "INF": "7-10",
  // Break
  "break1": "-",
  "break2": "-"
};

// ===================
// Completed state (localStorage)
// ===================
function getCompletedTasks() { return JSON.parse(localStorage.getItem('completedTasks') || '[]'); }
function saveCompletedTasks(arr) { localStorage.setItem('completedTasks', JSON.stringify(arr)); }
function isCompleted(taskId) { return getCompletedTasks().includes(taskId); }
function toggleCompleted(taskId) {
  let completed = getCompletedTasks();
  if (completed.includes(taskId)) completed = completed.filter(id => id !== taskId);
  else completed.push(taskId);
  saveCompletedTasks(completed);
  renderTasks(); // tidak menambah .is-hidden lagi karena hasAnimatedCards = true
}

// ===================
// Util tanggal ID dan deadline
// ===================
function parseTanggalIndonesiaToDate(dateStr) {
  const bulan = { "Januari":0,"Februari":1,"Maret":2,"April":3,"Mei":4,"Juni":5,"Juli":6,"Agustus":7,"September":8,"Oktober":9,"November":10,"Desember":11 };
  const [dayStr, monthStr, yearStr] = (dateStr || '').split(' ');
  const day = parseInt(dayStr, 10); const month = bulan[monthStr]; const year = parseInt(yearStr, 10);
  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return new Date('Invalid');
  return new Date(year, month, day);
}

function calculateDeadline(detailDateStr) {
  const today = new Date(); const deadlineDate = parseTanggalIndonesiaToDate(detailDateStr);
  today.setHours(0,0,0,0); deadlineDate.setHours(0,0,0,0);
  const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  if (Number.isNaN(diffDays)) return 'Tanggal tidak valid';
  if (diffDays > 1) return `${diffDays} hari lagi`;
  if (diffDays === 1) return `1 hari lagi`;
  if (diffDays === 0) return `Hari ini`;
  return `Lewat ${-diffDays} hari`;
}

function getDeadlineClass(diffDays) {
  if (Number.isNaN(diffDays)) return 'deadline-normal';
  if (diffDays <= 1) return 'deadline-critical';
  if (diffDays <= 2) return 'deadline-warning';
  return 'deadline-normal';
}

function parseDDMMYYYY_HHmmss(s) {
  if (!s) return null;
  const [dmy, hms] = s.split(' '); if (!dmy || !hms) return null;
  const [dd, mm, yyyy] = dmy.split('/').map(n => parseInt(n, 10));
  const [HH, MM, SS] = hms.split(':').map(n => parseInt(n, 10));
  if ([dd, mm, yyyy, HH, MM, SS].some(Number.isNaN)) return null;
  return new Date(yyyy, mm - 1, dd, HH, MM, SS);
}

function formatLastUpdated(dateObj) {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return '';
  const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(dateObj);
  const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  return `${timeStr}, ${dateStr}`;
}

function setFooterLastUpdated(raw) {
  const el = document.getElementById('footer-last-updated'); if (!el) return;
  const d = parseDDMMYYYY_HHmmss(raw); if (!d) return;
  el.textContent = `Last Updated: ${formatLastUpdated(d)}`;
}

// ===================
// Render UI
// ===================
function renderTasks() {
  const container = document.getElementById('task-container'); if (!container) return;
  container.innerHTML = '';

  const completedTasks = tasks.filter(task => isCompleted(task.id));
  const activeTasks = tasks.filter(task => !isCompleted(task.id));

  function getTaskDate(task) { return parseTanggalIndonesiaToDate(task.deadlineDate); }

  activeTasks.sort((a, b) => getTaskDate(a) - getTaskDate(b));
  completedTasks.sort((a, b) => getTaskDate(a) - getTaskDate(b));

  const sortedTasks = [...activeTasks, ...completedTasks];

  sortedTasks.forEach(task => {
    const categoryFull = categoryMap[task.category] || "Error (Data ga bener)";
    const time = timeMap[task.category] || "-";
    const today = new Date(); const deadlineDate = parseTanggalIndonesiaToDate(task.deadlineDate);
    deadlineDate.setHours(0,0,0,0); today.setHours(0,0,0,0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    const deadlineText = calculateDeadline(task.deadlineDate);
    const deadlineClass = getDeadlineClass(diffDays);

    const card = document.createElement('div');
    card.className = hasAnimatedCards ? 'card' : 'card is-hidden';
    if (isCompleted(task.id)) card.classList.add('completed');

    card.innerHTML = `
      <div class="card-header">
        <div class="category-group">
          <span class="category">${categoryFull}</span>
          <span class="time">Jam ke ${time}</span>
        </div>
        <div class="deadline-group">
          <span class="deadline ${deadlineClass}">${deadlineText}</span>
          <span class="deadline-date">${task.deadlineDate || '-'}</span>
        </div>
      </div>
      <div class="card-title${isCompleted(task.id) ? ' completed' : ''}">${task.title}</div>
      ${isCompleted(task.id) ? '<div class="completed-text">Ditandai sebagai selesai</div>' : ''}
    `;

    card.addEventListener('click', () => toggleCompleted(task.id));
    container.appendChild(card);
  });

  updateFooterShadow();
}

// ===================
// Footer shadow
// ===================
const footer = document.getElementById('footer');

function getFooterH() { return footer ? footer.getBoundingClientRect().height : 0; }

function updateFooterShadow() {
  if (!footer) return;
  const doc = document.documentElement;
  const effective = Math.max(doc.scrollHeight - getFooterH(), 0);
  const hasOverflow = effective > window.innerHeight;
  const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= effective - 1;
  footer.classList.toggle('footer--shadow', hasOverflow && !atBottom);
}

window.addEventListener('scroll', updateFooterShadow, { passive: true });
window.addEventListener('resize', updateFooterShadow);

// ===================
// Button
// ===================
document.addEventListener('DOMContentLoaded', function() {
  const pill = document.getElementById('pill');
  const pillClose = document.getElementById('pill-close');

  const COOLDOWN_MS = 500;
  let cooldownTimer = null;

  function startCooldown() {
    pill.classList.add('is-cooldown');
    clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(() => {
      pill.classList.remove('is-cooldown');
    }, COOLDOWN_MS);
  }

  function openPill() {
    if (pill.classList.contains('is-cooldown')) return;
    if (pill.classList.contains('is-expanded')) return;
    pill.classList.add('is-expanded');
    pill.setAttribute('aria-expanded', 'true');
    renderJadwalTable?.();
    document.body.style.overflow = 'hidden';
  }

  function closePill() {
    if (!pill.classList.contains('is-expanded')) return;
    pill.classList.remove('is-expanded');
    pill.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    startCooldown();
  }

  pill.addEventListener('click', (e) => {
    if (e.target.closest('.pillcontent') || e.target.closest('#pill-close')) return;
    openPill();
  });

  pillClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closePill();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pill.classList.contains('is-expanded')) {
      closePill();
    }
  });
});

async function fetchJadwalPelajaran() {
  try {
    const res = await fetch(`${JADWAL_CSV_URL}&t=${Date.now()}`);
    if (!res.ok) throw new Error('Gagal fetch jadwal');
    const csv = await res.text();
    return parseCSV(csv); // gunakan parseCSV yang sudah ada
  } catch (e) {
    console.error('Gagal muat jadwal pelajaran', e);
    return [];
  }
}

// ===================
// Render Lesson Schedule
// ===================
async function renderLessonSchedule() {
  const scheduleContainer = document.getElementById('jadwal-table');
  scheduleContainer.innerHTML = `<h2 class="jadwal-title">Jadwal Pelajaran</h2><div class="jadwal-loading">Loading...</div>`;

  const jadwalRows = await fetchJadwalPelajaran();

  function mapCategory(cat) {
    return categoryMap[cat] || (cat?.toLowerCase().includes('break') ? cat : cat || '-');
  }

  function renderKiri() {
    return `
      <div class="jadwal-table-group kiri">
        <table>
          <thead>
            <tr>
              <th>Jam</th>
              <th>Waktu</th>
              <th>Senin</th>
              <th>Selasa</th>
              <th>Rabu</th>
              <th>Kamis</th>
            </tr>
          </thead>
          <tbody>
            ${jadwalRows.map(row => `
              <tr>
                <td>${row.num1 || '-'}</td>
                <td>${row.time1 || '-'}</td>
                <td>${mapCategory(row.senin)}</td>
                <td>${mapCategory(row.selasa)}</td>
                <td>${mapCategory(row.rabu)}</td>
                <td>${mapCategory(row.kamis)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderKanan() {
    return `
      <div class="jadwal-table-group kanan">
        <table>
          <thead>
            <tr>
              <th>Jam</th>
              <th>Waktu</th>
              <th>Jumat</th>
            </tr>
          </thead>
          <tbody>
            ${jadwalRows.map(row => `
              <tr>
                <td>${row.num2 || '-'}</td>
                <td>${row.time2 || '-'}</td>
                <td>${mapCategory(row.jumat)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  scheduleContainer.innerHTML = `
    <h1 class="jadwal-title">Jadwal Pelajaran</h1>
    <div class="jadwal-tables-wrapper force-side">
      ${renderKiri()}
      ${renderKanan()}
    </div>
  `;
}

renderLessonSchedule();