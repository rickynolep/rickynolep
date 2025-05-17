let chatHistory = [];
let apiKey = "";

// Ambil API Key dari input saat user ngetik
document.getElementById("apiKeyInput").addEventListener("change", (e) => {
  apiKey = e.target.value.trim();
});

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chat");

  const userMsg = input.value.trim();
  if (!userMsg) return;
  if (!apiKey) {
    alert("Masukkan API Key dulu bro!");
    return;
  }

  // Tampilkan pesan user
  chat.innerHTML += `<p class="user"><strong>Kamu:</strong> ${userMsg}</p>`;
  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  // Tambahkan pesan user ke history
  chatHistory.push({ role: "user", parts: [{ text: userMsg }] });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: chatHistory
        })
      }
    );

    const data = await res.json();

    if (data.candidates && data.candidates.length > 0) {
      let aiReply = data.candidates[0].content.parts[0].text;
      aiReply = aiReply.replace(/\*\*(.*?)\*\*/g, "$1");
    aiReply = aiReply.replace(/\*(.*?)\*/g, "$1");

      chat.innerHTML += `<p class="ai"><strong>HYZEN:</strong> ${aiReply}</p>`;
      chat.scrollTop = chat.scrollHeight;

      // Tambahkan jawaban AI ke history
      chatHistory.push({ role: "model", parts: [{ text: aiReply }] });
    } else {
      chat.innerHTML += `<p class="ai"><strong>HYZEN:</strong> ❌ Gagal dapetin jawaban dari AI.</p>`;
    }

  } catch (err) {
    console.error(err);
    chat.innerHTML += `<p class="ai"><strong>HYZEN:</strong> ❌ Error: ${err.message}</p>`;
  }
}
document.getElementById("userInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // Biar gak bikin baris baru
    sendMessage(); // Panggil fungsi kirim
  }
});
