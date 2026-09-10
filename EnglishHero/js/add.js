// === Firebase 專案設定 ===
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

// 驗證登入狀態
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
  } else {
    window.location.replace("login.html");
  }
});

const addForm = document.getElementById("add-word-form");
const msgEl = document.getElementById("add-msg");

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    showMessage("請先登入！", true);
    return;
  }

  const folder = document.getElementById("word-folder").value.trim();
  const en = document.getElementById("word-en").value.trim();
  const ch = document.getElementById("word-ch").value.trim();

  showMessage("儲存中...", false);

  // 將資料寫入 Firestore (路徑: users/{使用者ID}/words/{隨機ID})
  db.collection("users").doc(currentUser.uid).collection("words").add({
    folder: folder,
    en: en,
    ch: ch,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    showMessage("✅ 新增成功！", false);
    // 為了方便連續輸入，只清空單字跟中文，保留資料夾名稱
    document.getElementById("word-en").value = "";
    document.getElementById("word-ch").value = "";
    document.getElementById("word-en").focus(); // 游標自動跳回英文輸入框
  })
  .catch((error) => {
    console.error("寫入資料庫失敗：", error);
    showMessage("❌ 儲存失敗：" + error.message, true);
  });
});

function showMessage(text, isError) {
  msgEl.textContent = text;
  msgEl.className = isError ? "msg error" : "msg success";
  msgEl.style.color = isError ? "#dc2626" : "#16a34a";
  setTimeout(() => { msgEl.textContent = ""; }, 3000);
}
