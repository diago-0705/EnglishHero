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
    window.location.replace("login.html?v=2086");
  }
});

// 直接使用你 GitHub Pages 的完整絕對網址
const PRESET_CONFIGS = {
  junior_2000: {
    folderName: "📖 國中基礎2000單",
    fileUrl: "https://joe-joe12.github.io/EnglishHero/EnglishHero/JSON/junior_2000.json"
  },
  cap_exam: {
    folderName: "🔥 國中會考高頻單",
    fileUrl: "https://joe-joe12.github.io/EnglishHero/EnglishHero/JSON/cap.json"
  }
};

window.importPreset = async function(presetKey) {
  const config = PRESET_CONFIGS[presetKey];
  if (!config) return;

  try {
    console.log("正在請求絕對網址：", config.fileUrl);
    const response = await fetch(config.fileUrl);
    
    if (!response.ok) {
      throw new Error(`伺服器回應失敗，狀態碼：${response.status}`);
    }

    const words = await response.json();

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
    alert("絕對路徑載入失敗：" + err.message);
  }
};
