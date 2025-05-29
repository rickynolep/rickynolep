let chatHistory = [];
// === Cookie Utilities ===
function getCookie(name) {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
}

function saveChatHistoryToCookie() {
  document.cookie = "chatHistory=" + encodeURIComponent(JSON.stringify(chatHistory)) + "; path=/";
}

// === Chat History Load ===

const savedHistory = getCookie("chatHistory");
if (savedHistory) {
  try {
    chatHistory = JSON.parse(savedHistory);
    for (const msg of chatHistory) {
      tambahPesan(msg.parts[0].text, msg.role === "user" ? "user" : "ai");
    }
  } catch (e) {
    console.error("Gagal load chat dari cookie:", e);
  }
}

let apiKey = "AIzaSyAZC6stZsv9YEwW0irv-AuKd0Nb2_cN6vw"; // Ganti kalo perlu

// === On Page Load ===
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chat");
  const sendBtn = document.getElementById("sendBtn");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  sendBtn.addEventListener("click", sendMessage);
  searchBtn.addEventListener("click", search);

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      search();
    }
  });
});

// === Send Chat Message ===
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chat");
  const userMsg = input.value.trim();
  if (!userMsg) return;

  tambahPesan(userMsg, "user");
  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  chatHistory.push({ role: "user", parts: [{ text: userMsg }] });
  saveChatHistoryToCookie();

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

      // Format markdown ringan ke HTML
      aiReply = aiReply
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/\n/g, "<br>");

      tambahPesan(aiReply, "ai");
      chatHistory.push({ role: "model", parts: [{ text: aiReply }] });
      saveChatHistoryToCookie();
    } else {
      tambahPesan("❌ Gagal dapetin jawaban dari AI.", "ai");
    }

  } catch (err) {
    console.error(err);
    tambahPesan(`❌ Error: ${err.message}`, "ai");
  }
}

// === Add Chat Bubble ===
function tambahPesan(text, type) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = `chat-message ${type}`;
  div.innerHTML = `<div class="bubble ${type}">${text}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// === Search Dummy ===
function search() {
  const input = document.getElementById("searchInput").value.trim();
  if (input) {
    alert(`Mencari: ${input} 🔍`);
  }
}