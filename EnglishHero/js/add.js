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

let currentUser = null;

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
  } else {
    window.location.replace("login.html?v=2026");
  }
});

const addForm = document.getElementById("add-word-form");
const msgEl = document.getElementById("add-msg");

if (addForm) {
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const folder = document.getElementById("word-folder").value.trim();
    const en = document.getElementById("word-en").value.trim();
    const ch = document.getElementById("word-ch").value.trim();

    msgEl.textContent = "儲存中...";
    msgEl.className = "msg";

    db.collection("users").doc(currentUser.uid).collection("words").add({
      folder: folder,
      en: en,
      ch: ch,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      msgEl.textContent = "✅ 新增成功！";
      msgEl.className = "msg success";
      document.getElementById("word-en").value = "";
      document.getElementById("word-ch").value = "";
      document.getElementById("word-en").focus();
      setTimeout(() => { msgEl.textContent = ""; }, 2500);
    })
    .catch((err) => {
      msgEl.textContent = `❌ 儲存失敗：${err.message}`;
      msgEl.className = "msg error";
    });
  });
}
