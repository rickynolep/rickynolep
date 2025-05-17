let chatHistory = [];
let apiKey = "AIzaSyAZC6stZsv9YEwW0irv-AuKd0Nb2_cN6vw"; // Isi kalau kamu mau pakai Gemini API

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.getElementById("searchInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      search();
    }
  });

  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  document.getElementById("searchBtn").addEventListener("click", search);
});

async function sendMessage() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chat");
  const userMsg = input.value.trim();
  if (!userMsg) return;

  chat.innerHTML += `<p class="user"><strong>Kamu:</strong> ${userMsg}</p>`;
  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  // Simpan ke chat history
  chatHistory.push({ role: "user", parts: [{ text: userMsg }] });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: chatHistory })
      }
    );

    const data = await res.json();

    if (data.candidates && data.candidates.length > 0) {
      let aiReply = data.candidates[0].content.parts[0].text;
      aiReply = aiReply.replace(/\*\*(.*?)\*\*/g, "$1");
      aiReply = aiReply.replace(/\*(.*?)\*/g, "$1");

      chat.innerHTML += `<p class="ai"><strong>HYZEN:</strong> ${aiReply}</p>`;
      chat.scrollTop = chat.scrollHeight;

      chatHistory.push({ role: "model", parts: [{ text: aiReply }] });
    } else {
      chat.innerHTML += `<p class="ai"><strong>HYZEN:</strong> ❌ Gagal dapetin jawaban dari AI.</p>`;
    }

  } catch (err) {
    console.error(err);
    chat.innerHTML += `<p class="ai"><strong>HYZEN:</strong> ❌ Error: ${err.message}</p>`;
  }
}

function search() {
  const input = document.getElementById("searchInput").value.trim();
  if (input) {
    alert(`Mencari: ${input} 🔍`);
  }
}
