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
let currentWord = null;

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loadDailyWord();
  } else {
    window.location.replace("login.html?v=2087");
  }
});

async function loadDailyWord() {
  try {
    const response = await fetch("./JSON/cap.json");
    if (!response.ok) throw new Error("無法載入題庫");
    const words = await response.json();

    // 根據今天的日期（例如 2026-09-12）轉換成數字，確保今天整天抓到同一個單字
    const todayStr = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % words.length;
    currentWord = words[index];

    // 渲染到畫面上
    document.getElementById("word-en").innerText = currentWord.en;
    document.getElementById("word-pos").innerText = currentWord.pos || "n.";
    document.getElementById("word-ch").innerText = currentWord.ch;

  } catch (err) {
    document.getElementById("word-en").innerText = "讀取失敗";
    document.getElementById("word-ch").innerText = err.message;
  }
}

// 收藏單字到使用者的 Firestore 個人字庫
window.addToMyWords = async function() {
  if (!currentWord) return;

  try {
    const userWordsRef = db.collection("users").doc(currentUser.uid).collection("words");
    await userWordsRef.add({
      en: currentWord.en,
      pos: currentWord.pos || "n.",
      ch: currentWord.ch,
      folder: "🌟 每日單字收藏"
    });
    alert(`成功將「${currentWord.en}」加入您的個人字庫！`);
  } catch (err) {
    alert("加入失敗：" + err.message);
  }
};
