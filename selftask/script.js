// ===================
// Sumber data dari localStorage
// ===================
let tasks = [];                 // akan diisi dari localStorage
let hasAnimatedCards = false;   // animasi kartu hanya saat load pertama

// Motivational messages untuk empty state
const emptyStateMessages = [
  "Kerjakan tugasnya yaaa!",
  "Tugasnya ga bakalan selesai sendiri loh!",
  "Jangan males-malesan dong!",
  "Saatnya produktif nih!",
  "Tunjukin keseriusanmu!",
  "Buruan selesaiin tugasnya!",
  "Nggak ada tugas? Buat yang baru aja!",
  "Ayo semangat ngerjain!"
];

function getRandomEmptyMessage() {
  return emptyStateMessages[Math.floor(Math.random() * emptyStateMessages.length)];
}

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

// Helper: load tasks dari localStorage
function loadTasksFromStorage() {
  const stored = localStorage.getItem('allTasks');
  return stored ? JSON.parse(stored) : [];
}

// Helper: save tasks ke localStorage
function saveTasksToStorage(tasksList) {
  localStorage.setItem('allTasks', JSON.stringify(tasksList));
}

async function loadTasksFromStorage_UI() {
  const disclaimer = document.getElementById('disclaimer');
  const info = document.getElementById('info');
  const footerLU = document.getElementById('footer-last-updated');
  const footerEl = document.getElementById('footer');
  const pill = document.getElementById('pill');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    // Fake loading 2 detik
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Load dari localStorage
    tasks = loadTasksFromStorage();
    
    if (!tasks.length) {
      // Default empty state dengan random message
      if (disclaimer) disclaimer.textContent = getRandomEmptyMessage();
      if (info) info.textContent = "Ketuk tombol + untuk menambah tugas baru";
    } else {
      if (disclaimer) disclaimer.textContent = "Update data secara manual di sini";
      if (info) info.textContent = "Ketuk tugas untuk menandainya sebagai selesai";
    }

    // Update last updated timestamp
    if (footerLU) {
      const lastUpdate = localStorage.getItem('lastUpdated');
      if (lastUpdate) {
        footerLU.textContent = `Terakhir diperbaharui: ${lastUpdate}`;
      } else {
        footerLU.textContent = `Terakhir diperbaharui: Baru saja`;
      }
    }

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
    const footerEl = document.getElementById('footer');
    const pill = document.getElementById('pill');
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
  loadTasksFromStorage_UI();
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
// Delete task
// ===================
function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasksToStorage(tasks);
  
  // Hapus juga dari completed tasks
  let completed = getCompletedTasks();
  completed = completed.filter(id => id !== taskId);
  saveCompletedTasks(completed);
  
  renderTasks();
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
// Hidden flag helper
// ===================
function normalizeHidden(v) {
  const s = String(v ?? '0').trim().toLowerCase();
  // true kalau 1/true/yes, selain itu dianggap false (tampil)
  return s === '1' || s === 'true' || s === 'yes';
}

// ===================
// Task Modal
// ===================
function openTaskModal(task) {
  const modal = document.createElement('div');
  modal.className = 'task-modal-overlay';
  modal.innerHTML = `
    <div class="task-modal">
      <div class="task-modal-header">
        <h3 class="task-modal-title">${task.title}</h3>
        <button class="task-modal-close" aria-label="Tutup">&times;</button>
      </div>
      <div class="task-modal-body">
        <div class="task-modal-detail">
          <span class="task-modal-category">${task.category}</span>
          <span class="task-modal-deadline">${task.deadlineDate || '-'}</span>
        </div>
      </div>
      <div class="task-modal-actions">
        <button class="task-modal-btn task-modal-btn-complete" data-action="complete">
          ${isCompleted(task.id) ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
        </button>
        <button class="task-modal-btn task-modal-btn-delete" data-action="delete">
          Hapus
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.task-modal-close');
  const completeBtn = modal.querySelector('[data-action="complete"]');
  const deleteBtn = modal.querySelector('[data-action="delete"]');

  // Debug: check if deleteBtn exists
  if (!deleteBtn) {
    console.error('Delete button not found!');
  }

  function closeModal() {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 200);
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  completeBtn.addEventListener('click', () => {
    toggleCompleted(task.id);
    closeModal();
  });

  deleteBtn.addEventListener('click', () => {
    deleteTask(task.id);
    closeModal();
  });

  // Trigger animation
  requestAnimationFrame(() => modal.classList.add('is-visible'));
}
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
          <span class="category">${task.category}</span>
        </div>
        <div class="deadline-group">
          <span class="deadline ${deadlineClass}">${deadlineText}</span>
          <span class="deadline-date">${task.deadlineDate || '-'}</span>
        </div>
      </div>
      <div class="card-title${isCompleted(task.id) ? ' completed' : ''}">${task.title}</div>
      ${isCompleted(task.id) ? '<div class="completed-text">Ditandai sebagai selesai</div>' : ''}
    `;

    card.addEventListener('click', () => openTaskModal(task));
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
    renderAddTaskForm();
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

// ===================
// Render Add Task Form
// ===================
function renderAddTaskForm() {
  const formContainer = document.getElementById('jadwal-table');
  formContainer.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 20px; font-family: Unbounded; font-size: 1.4rem;">Tambah Tugas Baru</h2>
    <form id="add-task-form" style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label for="task-category" style="text-align: left; font-size: 0.9rem; color: #ccc;">Jenis Tugas</label>
        <input type="text" id="task-category" placeholder="Contoh: Matematika, Bahasa Indonesia" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #555; background: #333; color: #eee; font-family: inherit;" required />
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label for="task-title" style="text-align: left; font-size: 0.9rem; color: #ccc;">Detail Tugas</label>
        <input type="text" id="task-title" placeholder="Contoh: PR halaman 5" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #555; background: #333; color: #eee; font-family: inherit;" required />
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label for="task-deadline" style="text-align: left; font-size: 0.9rem; color: #ccc;">Deadline (DD Bulan YYYY)</label>
        <input type="text" id="task-deadline" placeholder="Contoh: 15 Februari 2026" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #555; background: #333; color: #eee; font-family: inherit;" required />
      </div>
      <button type="submit" style="padding: 10px 16px; margin-top: 8px; border-radius: 8px; border: none; background: #43a9f9; color: #000; font-weight: 600; cursor: pointer; font-family: inherit; font-size: 1rem; transition: background 0.3s;">Tambah Tugas</button>
    </form>
  `;

  const form = document.getElementById('add-task-form');
  form.addEventListener('submit', handleAddTask);
}

function handleAddTask(e) {
  e.preventDefault();
  const category = document.getElementById('task-category').value.trim();
  const title = document.getElementById('task-title').value.trim();
  const deadlineDate = document.getElementById('task-deadline').value.trim();

  if (!category || !title || !deadlineDate) {
    alert('Semua field harus diisi');
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    category: category,
    title: title,
    deadlineDate: deadlineDate,
    hidden: false
  };

  tasks.push(newTask);
  saveTasksToStorage(tasks);
  
  // Update last updated
  const now = new Date();
  const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(now);
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  localStorage.setItem('lastUpdated', `${timeStr}, ${dateStr}`);

  renderTasks();
  
  // Update status text jika ini task pertama
  if (tasks.length === 1) {
    const disclaimer = document.getElementById('disclaimer');
    const info = document.getElementById('info');
    if (disclaimer) disclaimer.textContent = "Update data secara manual di sini";
    if (info) info.textContent = "Ketuk tugas untuk menandainya sebagai selesai";
  }
  
  // Reset form
  document.getElementById('task-category').value = '';
  document.getElementById('task-title').value = '';
  document.getElementById('task-deadline').value = '';

  // Close pill
  const pill = document.getElementById('pill');
  if (pill.classList.contains('is-expanded')) {
    const pillClose = document.getElementById('pill-close');
    pillClose.click();
  }
}
