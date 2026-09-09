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

// 確保 Firebase 實例初始化
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// 監聽 DOM 載入與 Auth 狀態
document.addEventListener("DOMContentLoaded", () => {
  const userDisplay = document.getElementById("user-display");
  const btnLogout = document.getElementById("btn-logout");

  auth.onAuthStateChanged((user) => {
    console.log("當前使用者狀態：", user);
    if (user) {
      // 取得 Email 前綴或名稱
      const emailName = user.email ? user.email.split("@")[0] : "使用者";
      const displayName = user.displayName || emailName;
      
      if (userDisplay) {
        userDisplay.textContent = `👋 你好，${displayName}`;
      }
    } else {
      // 未登入才導向登入頁
      window.location.replace("login.html");
    }
  });

  // 登出按鈕事件
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      auth.signOut().then(() => {
        window.location.replace("login.html");
      }).catch((err) => {
        console.error("登出失敗：", err);
      });
    });
  }
});
