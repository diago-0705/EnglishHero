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
    window.location.replace("login.html?v=2085");
  }
});

const PRESET_CONFIGS = {
  junior_2000: {
    folderName: "📖 國中基礎2000單",
    fileUrl: "./JSON/junior_2000.json"
  },
  cap_exam: {
    folderName: "🔥 國中會考高頻單",
    fileUrl: "./JSON/cap.json"
  }
};

window.importPreset = async function(presetKey) {
  const config = PRESET_CONFIGS[presetKey];
  if (!config) return;

  try {
    // 秀出實際嘗試抓取的完整網址讓你知道
    const targetUrl = new URL(config.fileUrl, window.location.href).href;
    console.log("正在嘗試抓取：", targetUrl);

    const response = await fetch(config.fileUrl);
    
    // 如果伺服器回傳不是 200，把狀態碼跟網址跳出來看
    if (!response.ok) {
      throw new Error(`HTTP 錯誤碼: ${response.status} (${response.statusText})，網址: ${targetUrl}`);
    }

    const text = await response.text();
    
    // 檢查抓到的內容是不是被 GitHub 導向到 404 HTML 頁面
    if (text.trim().startsWith("<!DOCTYPE html>") || text.includes("<title>GitHub</title>")) {
      throw new Error("抓到了 HTML 頁面（代表檔案不存在或路徑錯誤被導向 404）");
    }

    const words = JSON.parse(text);

    if (!confirm(`確定要將「${config.folderName}」共 ${words.length} 個單字加入您的資料庫嗎？`)) {
      return;
    }

    const batch = db.batch();
    const userWordsRef = db.collection("users").doc(currentUser.uid).collection("words");

    words.forEach(w => {
      const newDocRef = userWordsRef.doc();
      batch.set(newDocRef, {
        en: w.en,
        pos: w.pos || "n.",
        ch: w.ch,
        folder: config.folderName
      });
    });

    await batch.commit();
    alert(`成功加入「${config.folderName}」！`);
  } catch (err) {
    console.error(err);
    alert("詳細錯誤訊息：" + err.message);
  }
};
