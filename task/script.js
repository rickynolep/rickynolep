// ===================
// Sumber data dari CSV publish-to-web
// ===================
let tasks = []; // akan diisi dari CSV

// Ganti dengan link publish-to-web CSV milikmu (yang .../pub?output=csv)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCvNsf3gz_RXNFc4vGAb6C5Lv4OYDZSan2dNcRvbvg3rODjCqG1LpklElMMXvRcNTkOP68v_NW81KD/pub?output=csv';

// Parser CSV sederhana (cukup bila kolom tidak mengandung koma bertanda-kutip)
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

async function loadTasksFromCSV() {
  const loading = document.getElementById('loading');
  const loadtext = document.getElementById('load-text');
  loading.classList.remove('hidden');
  loadtext.classList.remove('hidden');
  try {
    const url = `${CSV_URL}&t=${Date.now()}`; // cache-busting
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch gagal');
    const csv = await res.text();
    const rows = parseCSV(csv);
    tasks = rows
      .filter(r => r.title)
      .map(r => ({
        id: r.id || crypto.randomUUID(),
        category: r.category || '',
        title: r.title || '',
        deadlineDate: r.deadlineDate || ''
      }));
    renderTasks();
  } catch (e) {
    console.error('Gagal muat data tugas', e);
    // Bisa tambahkan fallback atau tampil pesan error
  } finally {
    loading.classList.add('hidden'); // sembunyikan loading saat selesai
    loadtext.classList.add('hidden'); // sembunyikan loading saat selesai
  }
}


// ===================
// Pemetaan kategori dan jam pelajaran
// ===================
const categoryMap = {
  "AGH": "Agama Hindu",
  "BID": "Bahasa Indonesia",
  "BEN": "Bahasa Inggris",
  "BBL": "Bahasa Bali",
  "DTM1": "DPK TKJ 1 (Selasa)",
  "DTM2": "DPK TKJ 1 (Jumat)",
  "DTP": "DPK TKJ 2",
  "INF": "Informatika",
  "KKA": "KKA",
  "PAS": "Projek IPAS",
  "PJK": "PJOK",
  "MTK": "Matematika",
  "PKN": "PKN",
  "SJH": "Sejarah",
  "SEN": "Seni Budaya"
};

const timeMap = {
  "AGH": "4-6",
  "BID": "8-10",
  "BEN": "7-8",
  "BBL": "9-10",
  "DTM1": "4-7",
  "DTM2": "5-6",
  "DTP": "1-6",
  "INF": "7-10",
  "KKA": "7-8",
  "PAS": "1-5",
  "PJK": "1-3",
  "MTK": "1-3",
  "PKN": "7-8",
  "SJH": "9-10",
  "SEN": "9-10"
};

// ===================
// Completed state (localStorage)
// ===================
function getCompletedTasks() {
  return JSON.parse(localStorage.getItem('completedTasks') || '[]');
}

function saveCompletedTasks(arr) {
  localStorage.setItem('completedTasks', JSON.stringify(arr));
}

function isCompleted(taskId) {
  return getCompletedTasks().includes(taskId);
}

function toggleCompleted(taskId) {
  let completed = getCompletedTasks();
  if (completed.includes(taskId)) {
    completed = completed.filter(id => id !== taskId);
  } else {
    completed.push(taskId);
  }
  saveCompletedTasks(completed);
  renderTasks();
}

// ===================
// Util tanggal ID dan deadline
// ===================
function parseTanggalIndonesiaToDate(dateStr) {
  const bulan = {
    "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
    "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
  };
  const [dayStr, monthStr, yearStr] = (dateStr || '').split(' ');
  const day = parseInt(dayStr, 10);
  const month = bulan[monthStr];
  const year = parseInt(yearStr, 10);
  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return new Date('Invalid');
  return new Date(year, month, day);
}

function calculateDeadline(detailDateStr) {
  const today = new Date();
  const deadlineDate = parseTanggalIndonesiaToDate(detailDateStr);
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

// ===================
// Render UI
// ===================
function renderTasks() {
  const container = document.getElementById('task-container');
  if (!container) return;
  container.innerHTML = '';

  const completedTasks = tasks.filter(task => isCompleted(task.id));
  const activeTasks = tasks.filter(task => !isCompleted(task.id));

  function getTaskDate(task) {
    return parseTanggalIndonesiaToDate(task.deadlineDate);
  }

  activeTasks.sort((a, b) => getTaskDate(a) - getTaskDate(b));
  completedTasks.sort((a, b) => getTaskDate(a) - getTaskDate(b));

  const sortedTasks = [...activeTasks, ...completedTasks];

  sortedTasks.forEach(task => {
    const categoryFull = categoryMap[task.category] || "Error (Data ga bener)";
    const time = timeMap[task.category] || "-";

    const today = new Date();
    const deadlineDate = parseTanggalIndonesiaToDate(task.deadlineDate);
    deadlineDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    const deadlineText = calculateDeadline(task.deadlineDate);
    const deadlineClass = getDeadlineClass(diffDays);

    const card = document.createElement('div');
    card.className = 'card';
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

  // Perbarui shadow footer setiap render
  updateFooterShadow();
}

// ===================
// Footer shadow (opsional)
// ===================
const footer = document.getElementById('footer');

function updateFooterShadow() {
  if (!footer) return;
  const doc = document.documentElement;
  const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight;
  const hasOverflow = doc.scrollHeight > window.innerHeight;
  footer.classList.toggle('footer--shadow', hasOverflow && !atBottom);
}

window.addEventListener('scroll', updateFooterShadow, { passive: true });
window.addEventListener('resize', updateFooterShadow);

// ===================
// Boot
// ===================
document.addEventListener('DOMContentLoaded', loadTasksFromCSV);