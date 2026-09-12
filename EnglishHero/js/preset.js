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
    window.location.replace("login.html?v=2076");
  }
});

// 定義精選題庫的詳細單字內容
const PRESET_DATABASES = {
  junior_2000: {
    folderName: "📖 國中基礎2000單",
    words: [
      { en: "ability", pos: "n.", ch: "能力" },
      { en: "active", pos: "adj.", ch: "活躍的" },
      { en: "advantage", pos: "n.", ch: "優點、優勢" },
      { en: "ancient", pos: "adj.", ch: "古代的" },
      { en: "bottom", pos: "n.", ch: "底部" },
      { en: "climate", pos: "n.", ch: "氣候" }
    ]
  },
  cap_exam: {
    folderName: "🔥 國中會考高頻單",
    words: [
      { en: "frequent", pos: "adj.", ch: "頻繁的" },
      { en: "gather", pos: "v.", ch: "聚集、收集" },
      { en: "idiom", pos: "n.", ch: "慣用語、成語" },
      { en: "journey", pos: "n.", ch: "旅行、旅程" },
      { en: "maintain", pos: "v.", ch: "維持、保養" },
      { en: "observe", pos: "v.", ch: "觀察、遵守" }
    ]
  }
};

// 點擊加入特定題庫
window.importPreset = function(presetKey) {
  const preset = PRESET_DATABASES[presetKey];
  if (!preset) return;

  if (!confirm(`確定要將「${preset.folderName}」共 ${preset.words.length} 個單字加入您的資料庫嗎？`)) {
    return;
  }

  const batch = db.batch();
  const userWordsRef = db.collection("users").doc(currentUser.uid).collection("words");

  preset.words.forEach(w => {
    const newDocRef = userWordsRef.doc();
    batch.set(newDocRef, {
      en: w.en,
      pos: w.pos,
      ch: w.ch,
      folder: preset.folderName
    });
  });

  batch.commit().then(() => {
    alert(`成功加入「${preset.folderName}」！您現在可以回到首頁或背單字頁面進行學習。`);
  }).catch(err => {
    alert("加入失敗：" + err.message);
  });
};
