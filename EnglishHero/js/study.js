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
let wordsList = [];
let currentIndex = 0;

const folderSelect = document.getElementById("study-folder-select");
const flashcard = document.getElementById("flashcard");
const wordEnEl = document.getElementById("word-en");
const wordChEl = document.getElementById("word-ch");
const cardCountEl = document.getElementById("card-count");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnFlip = document.getElementById("btn-flip");

// 驗證登入並載入資料夾清單
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loadStudyFolders(user.uid);
  } else {
    window.location.replace("login.html?v=2026");
  }
});

// 載入使用者的資料夾選項
function loadStudyFolders(uid) {
  db.collection("users").doc(uid).collection("words").get()
    .then((snapshot) => {
      const foldersSet = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.folder) foldersSet.add(data.folder);
      });

      folderSelect.innerHTML = `<option value="all">📁 全部單字</option>`;
      foldersSet.forEach(folderName => {
        const opt = document.createElement("option");
        opt.value = folderName;
        opt.textContent = folderName;
        folderSelect.appendChild(opt);
      });

      // 預設載入全部單字開始背誦
      loadWordsToStudy(uid, "all");
    })
    .catch((err) => {
      console.error("載入資料夾失敗：", err);
    });
}

// 根據選擇的資料夾抓取單字
function loadWordsToStudy(uid, folderName) {
  let query = db.collection("users").doc(uid).collection("words");
  
  if (folderName !== "all") {
    query = query.where("folder", "==", folderName);
  }

  query.get()
    .then((snapshot) => {
      wordsList = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        wordsList.push({
          id: doc.id,
          en: data.en || "",
          pos: data.pos || "",
          ch: data.ch || ""
        });
      });

      currentIndex = 0;
      renderCard();
    })
    .catch((err) => {
      console.error("讀取單字失敗：", err);
    });
}

// 切換資料夾事件
if (folderSelect) {
  folderSelect.addEventListener("change", (e) => {
    if (currentUser) {
      loadWordsToStudy(currentUser.uid, e.target.value);
    }
  });
}

// 渲染當前字卡（讓正面與背面都顯示詞性）
function renderCard() {
  if (wordsList.length === 0) {
    wordEnEl.innerHTML = "這個分類目前沒有單字";
    wordChEl.innerHTML = "請先去新增單字頁加入單字！";
    cardCountEl.textContent = "0 / 0";
    return;
  }

  const currentWord = wordsList[currentIndex];
  
  // 讓正面與背面都動態疊加詞性標籤
  const frontContainer = flashcard.querySelector(".card-front");
  const backContainer = flashcard.querySelector(".card-back");

  // 更新正面內容與詞性
  frontContainer.innerHTML = `
    <span style="position: absolute; top: 14px; right: 18px; font-size: 15px; font-weight: bold; color: #3b82f6; background: #eff6ff; padding: 2px 8px; border-radius: 6px;">${currentWord.pos || ''}</span>
    <div id="word-en" style="font-size: 32px; font-weight: bold; color: #1e293b;">${currentWord.en}</div>
  `;

  // 更新背面內容與詞性
  backContainer.innerHTML = `
    <span style="position: absolute; top: 14px; right: 18px; font-size: 15px; font-weight: bold; color: #3b82f6; background: #eff6ff; padding: 2px 8px; border-radius: 6px;">${currentWord.pos || ''}</span>
    <div id="word-ch" style="font-size: 28px; font-weight: bold; color: #0f172a;">${currentWord.ch}</div>
  `;

  // 重設翻面狀態
  flashcard.classList.remove("flipped");
  
  // 更新計數器
  cardCountEl.textContent = `${currentIndex + 1} / ${wordsList.length}`;
}

// 點擊字卡翻面
if (flashcard) {
  flashcard.addEventListener("click", () => {
    flashcard.classList.toggle("flipped");
  });
}

// 上一張
if (btnPrev) {
  btnPrev.addEventListener("click", () => {
    if (wordsList.length === 0) return;
    currentIndex = (currentIndex - 1 + wordsList.length) % wordsList.length;
    renderCard();
  });
}

// 下一張
if (btnNext) {
  btnNext.addEventListener("click", () => {
    if (wordsList.length === 0) return;
    currentIndex = (currentIndex + 1) % wordsList.length;
    renderCard();
  });
}

// 翻面按鈕
if (btnFlip) {
  btnFlip.addEventListener("click", () => {
    flashcard.classList.toggle("flipped");
  });
}
