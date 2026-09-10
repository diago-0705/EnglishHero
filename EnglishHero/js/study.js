const firebaseConfig = {
  apiKey: "AIzaSyA4bbUoXHi29YAjCgYrnuYRhZJ8_JEtalc",
  authDomain: "englishhero-d58c6.firebaseapp.com",
  projectId: "englishhero-d58c6",
  storageBucket: "englishhero-d58c6.firebasestorage.app",
  messagingSenderId: "437927020009",
  appId: "1:437927020009:web:30e18c99cfeec8ef4ef778",
  measurementId: "G-TZTCS02SK6"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

const container = document.getElementById("flashcard-container");

auth.onAuthStateChanged((user) => {
  if (user) {
    loadWords(user.uid);
  } else {
    window.location.replace("login.html?v=2026");
  }
});

function loadWords(uid) {
  db.collection("users").doc(uid).collection("words").orderBy("createdAt", "desc").get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = `<p style="color:#666;">目前還沒有單字喔！請先至「新增單字」建立單字庫。</p>`;
        return;
      }

      container.innerHTML = "";
      snapshot.forEach((doc) => {
        const item = doc.data();
        const card = document.createElement("div");
        card.className = "word-card";
        card.innerHTML = `
          <div class="folder-badge">📁 ${item.folder || "預設分類"}</div>
          <div class="en-word">${item.en}</div>
          <div class="ch-word" style="display:none;">${item.ch}</div>
          <small style="color:#94a3b8; display:block; margin-top:8px;">(點擊卡片看中文)</small>
        `;

        card.addEventListener("click", () => {
          const chEl = card.querySelector(".ch-word");
          chEl.style.display = (chEl.style.display === "none") ? "block" : "none";
        });

        container.appendChild(card);
      });
    })
    .catch((err) => {
      container.innerHTML = `<p style="color:#dc2626;">載入失敗：${err.message}</p>`;
    });
}
