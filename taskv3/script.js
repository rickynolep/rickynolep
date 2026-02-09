// ================== Mulai Web ================== //

// Tampilkan tugas
document.addEventListener("DOMContentLoaded", loadTask);

function loadTask() {
    const list = document.getElementById("taskList");
    const tasks = JSON.parse(localStorage.getItem("localTask")) || [];

    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task-card"; 
        taskDiv.dataset.id = task.id;

        taskDiv.innerHTML = `
            <div class="card-content">
                <span class="task-index">${index + 1}</span>
                <p class="task-text">${task.text}</p>
            </div>
            <button class="delete">❌</button>
        `;

        list.appendChild(taskDiv);
    });
}

// ================= Tugas Baru ================== //

// Deklarasi variable
const newMenu = document.querySelector(".new")
const newBtn = document.getElementById("newBtn")
const newSave = document.getElementById("newSave")
const newInput = document.getElementById("newInput")
const newCancel = document.getElementById("newCancel")

// Jika Tambah tugas
newBtn.addEventListener("click", function() {
    newMenu.classList.add("show")
});

// Jika dibatalkan
newCancel.addEventListener("click", function() {
    newMenu.classList.remove("show")
    newInput.value = ""
});

// Jika disimpan
newSave.addEventListener("click", function() {
    const taskValue = newInput.value.trim();
    if (!taskValue) return;

    let tasks = JSON.parse(localStorage.getItem("localTask")) || [];

    tasks.push({
        id: Date.now(),
        text: taskValue
    });

    localStorage.setItem("localTask", JSON.stringify(tasks));

    newInput.value = "";
    newMenu.classList.remove("show");
    loadTask();
});

// Tombol Hapus
document.getElementById("taskList").addEventListener("click", function(e) {
    if (!e.target.classList.contains("delete")) return;
    const taskDiv = e.target.closest(".task-card"); 
    
    if (taskDiv) {
        const id = Number(taskDiv.dataset.id);
        let tasks = JSON.parse(localStorage.getItem("localTask")) || [];
        tasks = tasks.filter(task => task.id !== id);
        localStorage.setItem("localTask", JSON.stringify(tasks));
        loadTask();
    }
});


// ================= Reset Menu ================== //

document.getElementById("reset").addEventListener("click", function(e) {
    if (!confirm("Tunggu bentar... Yakin nih? ini bakalan ngehapus SEMUA tugasmu loh!")) return;
    localStorage.removeItem("localTask");
    loadTask();
});

