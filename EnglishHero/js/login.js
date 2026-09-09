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

// 切換頁籤：登入 vs 註冊
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

function showMessage(msg, isError = true) {
  authMessage.textContent = msg;
  authMessage.className = `auth-msg ${isError ? 'error' : 'success'}`;
  authMessage.classList.remove("hidden");
}

function clearMessage() {
  authMessage.textContent = "";
  authMessage.classList.add("hidden");
}

// 監聽「登入」表單送出
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearMessage();

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    showMessage("請輸入電子郵件與密碼！", true);
    return;
  }

  // 呼叫 Firebase 登入 API
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      showMessage("登入成功！正在跳轉...", false);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    })
    .catch((error) => {
      console.error("登入失敗：", error);
      let errMsg = "登入失敗，請確認帳號密碼。";
      if (error.code === "auth/user-not-found") {
        errMsg = "此帳號尚未註冊，請先切換至「註冊帳號」。";
      } else if (error.code === "auth/wrong-password") {
        errMsg = "密碼輸入錯誤，請重新確認。";
      } else if (error.code === "auth/invalid-email") {
        errMsg = "電子郵件格式不正確。";
      } else if (error.code === "auth/too-many-requests") {
        errMsg = "嘗試次數過多，請稍後再試。";
      } else {
        errMsg = `登入錯誤：${error.message}`;
      }
      showMessage(errMsg, true);
    });
});

// 監聽「註冊」表單送出
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearMessage();

  const email = regEmailInput.value.trim();
  const password = regPasswordInput.value;

  if (!email || !password) {
    showMessage("請輸入電子郵件與密碼！", true);
    return;
  }

  // 呼叫 Firebase 註冊 API
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      showMessage("註冊成功！正在為您導向首頁...", false);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    })
    .catch((error) => {
      console.error("註冊失敗：", error);
      let errMsg = "註冊失敗。";
      if (error.code === "auth/email-already-in-use") {
        errMsg = "此電子郵件已被註冊，請直接點選「登入」。";
      } else if (error.code === "auth/weak-password") {
        errMsg = "密碼強度不足，請至少輸入 6 位字元。";
      } else if (error.code === "auth/invalid-email") {
        errMsg = "電子郵件格式不正確。";
      } else {
        errMsg = `註冊錯誤：${error.message}`;
      }
      showMessage(errMsg, true);
    });
});
// 監聽「登入」表單送出
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearMessage();

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    showMessage("請輸入電子郵件與密碼！", true);
    return;
  }

  // 設定持久化為 LOCAL（永久記住登入狀態）
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      return auth.signInWithEmailAndPassword(email, password);
    })
    .then((userCredential) => {
      showMessage("登入成功！正在跳轉...", false);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    })
    .catch((error) => {
      console.error("登入失敗：", error);
      let errMsg = "登入失敗，請確認帳號密碼。";
      if (error.code === "auth/user-not-found") {
        errMsg = "此帳號尚未註冊，請先切換至「註冊帳號」。";
      } else if (error.code === "auth/wrong-password") {
        errMsg = "密碼輸入錯誤，請重新確認。";
      } else if (error.code === "auth/invalid-email") {
        errMsg = "電子郵件格式不正確。";
      } else {
        errMsg = `登入錯誤：${error.message}`;
      }
      showMessage(errMsg, true);
    });
});
