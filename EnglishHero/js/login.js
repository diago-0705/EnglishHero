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

// DOM 元素
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authMessage = document.getElementById("auth-message");

const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");

const regEmailInput = document.getElementById("reg-email");
const regPasswordInput = document.getElementById("reg-password");

function showMessage(msg, isError = true) {
  if (authMessage) {
    authMessage.textContent = msg;
    authMessage.className = `auth-msg ${isError ? 'error' : 'success'}`;
    authMessage.classList.remove("hidden");
  } else {
    alert(msg);
  }
}

// 頁籤切換
if (tabLogin && tabRegister) {
  tabLogin.onclick = () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    if (loginForm) loginForm.classList.remove("hidden");
    if (registerForm) registerForm.classList.add("hidden");
  };

  tabRegister.onclick = () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    if (registerForm) registerForm.classList.remove("hidden");
    if (loginForm) loginForm.classList.add("hidden");
  };
}

// 登入送出
if (loginForm) {
  loginForm.onsubmit = function (e) {
    e.preventDefault();
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      alert("請輸入電子郵件與密碼！");
      return;
    }

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("登入成功！即將跳轉到首頁");
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("登入錯誤細節：", error);
        alert(`登入失敗：${error.message}`);
      });
  };
}

// 註冊送出
if (registerForm) {
  registerForm.onsubmit = function (e) {
    e.preventDefault();
    const email = regEmailInput.value.trim();
    const password = regPasswordInput.value;

    if (!email || !password) {
      alert("請輸入電子郵件與密碼！");
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("註冊成功！即將跳轉到首頁");
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("註冊錯誤細節：", error);
        alert(`註冊失敗：${error.message}`);
      });
  };
}
