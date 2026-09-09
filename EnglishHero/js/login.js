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

// 初始化 Firebase
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

function showMessage(text, isError = true) {
  if (!authMessage) return;
  authMessage.textContent = text;
  authMessage.className = `auth-msg ${isError ? "error" : "success"}`;
}

function clearMessage() {
  if (!authMessage) return;
  authMessage.textContent = "";
  authMessage.className = "auth-msg hidden";
}

// 僅在登入頁面元素存在時才綁定事件
if (tabLogin && tabRegister && loginForm && registerForm) {
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    clearMessage();
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    clearMessage();
  });

  // 登入邏輯
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      showMessage("登入成功！正在前往首頁...", false);
      window.location.replace("index.html");
    } catch (error) {
      let msg = "登入失敗：" + error.message;
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        msg = "帳號或密碼錯誤，請重新確認。";
      }
      showMessage(msg, true);
    }
  });

  // 註冊邏輯
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    try {
      await auth.createUserWithEmailAndPassword(email, password);
      showMessage("註冊成功！正在前往首頁...", false);
      window.location.replace("index.html");
    } catch (error) {
      let msg = "註冊失敗：" + error.message;
      if (error.code === "auth/email-already-in-use") {
        msg = "此電子郵件已被註冊，請直接登入。";
      } else if (error.code === "auth/weak-password") {
        msg = "密碼強度不足，請至少輸入 6 位字元。";
      } else if (error.code === "auth/invalid-email") {
        msg = "請輸入有效的電子郵件格式。";
      }
      showMessage(msg, true);
    }
  });
}