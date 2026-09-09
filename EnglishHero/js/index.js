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

const userDisplay = document.getElementById("user-display");
const btnLogout = document.getElementById("btn-logout");

// 監聽登入狀態
auth.onAuthStateChanged((user) => {
  if (user) {
    // 取得 Email 前綴或名字
    const name = user.displayName || user.email.split("@")[0];
    if (userDisplay) {
      userDisplay.textContent = `👋 你好，${name}`;
    }
  } else {
    // 未登入直接跳轉至登入頁
    window.location.replace("login.html");
  }
});

// 登出按鈕
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    auth.signOut().then(() => {
      window.location.replace("login.html");
    });
  });
}
