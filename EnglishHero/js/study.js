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
let isFlipped = false;

const setupSection = document.getElementById("setup-section");
const folderSelect = document.getElementById("study-folder-select");
const btnStart = document.getElementById("btn-start-study");
const containerEl = document.getElementById("flashcard-container");

// 驗證登入並載入資料夾清單
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loadFolders(user.uid);
  } else {
    window.location.replace("login.html?v=2026");
  }
});

// 抓取使用者的所有資料夾並填入下拉選單
function loadFolders(uid) {
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
    })
    .catch((err) => {
      console.error("載入資料夾失敗：", err);
      folderSelect.innerHTML = `<option value="all">📁 全部單字 (載入失敗)</option>`;
    });
}

// 點擊「開始背單字」按鈕
if (btnStart) {
  btnStart.addEventListener("click", () => {
    if (!currentUser) return;
    const selectedFolder = folderSelect.value;
    
    // 隱藏設定區，顯示字卡區
    setupSection.style.display = "none";
    containerEl.style.display = "block";
    
    loadWordsToStudy(currentUser.uid, selectedFolder);
  });
}

// 根據選擇的資料夾讀取單字
function loadWordsToStudy(uid, folderName) {
  let query = db.collection("users").doc(uid).collection("words");
  
  if (folderName && folderName !== "all") {
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
          ch: data.ch || "",
          folder: data.folder || "預設分類"
        });
      });

      currentIndex = 0;
      isFlipped = false;
      renderCard();
    })
    .catch((err) => {
      console.error("讀取單字失敗：", err);
      containerEl.innerHTML = `
        <div class="word-card">
          <div style="color:red; text-align:center;">載入單字失敗，請重新整理</div>
        </div>
      `;
    });
}

// 渲染字卡（詞性永遠在右上角）
function renderCard() {
  if (!containerEl) return;

  if (wordsList.length === 0) {
    containerEl.innerHTML = `
      <div class="word-card" style="text-align: center;">
        <div style="font-size: 20px; color: #666; font-weight: bold;">這個分類目前沒有單字</div>
        <div style="font-size: 14px; color: #888; margin-top: 8px;">請先去新增單字頁加入單字！</div>
        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer;">⬅️ 重新選擇資料夾</button>
      </div>
    `;
    return;
  }

  const currentWord = wordsList[currentIndex];
  
  containerEl.innerHTML = `
    <div id="word-card-box" class="word-card">
      
      <span style="position: absolute; top: 16px; right: 20px; font-size: 14px; font-weight: bold; color: #0284c7; background: #e0f2fe; padding: 3px 10px; border-radius: 6px;">
        ${currentWord.pos || '未分類'}
      </span>
      
      <div class="folder-badge">📁 ${currentWord.folder}</div>
      
      <div style="margin-top: 12px; cursor: pointer;">
        ${!isFlipped ? `
          <div class="en-word">${currentWord.en}</div>
          <div style="font-size: 13px; color: #9ca3af; margin-top: 12px; text-align: center;">👆 點擊卡片看中文</div>
        ` : `
          <div class="ch-word">${currentWord.ch}</div>
          <div style="font-size: 13px; color: #9ca3af; margin-top: 12px; text-align: center;">👆 點擊卡片看英文</div>
        `}
      </div>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 14px;">
        <button id="btn-prev" style="padding: 8px 16px; background: #f3f4f6; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">⬅️ 上一張</button>
        <span style="font-size: 14px; color: #6b7280; font-weight: bold;">${currentIndex + 1} / ${wordsList.length}</span>
        <button id="btn-next" style="padding: 8px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">下一張 ➡️</button>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 10px;">
      <button onclick="location.reload()" style="background: none; border: none; color: #64748b; font-size: 14px; cursor: pointer; text-decoration: underline;">🔄 重新選擇其他資料夾</button>
    </div>
  `;

  // 綁定翻面
  const cardBox = document.getElementById("word-card-box");
  if (cardBox) {
    cardBox.addEventListener("click", (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isFlipped = !isFlipped;
      renderCard();
    });
  }

  // 上一張
  document.getElementById("btn-prev").addEventListener("click", (e) => {
    e.stopPropagation();
    if (wordsList.length === 0) return;
    currentIndex = (currentIndex - 1 + wordsList.length) % wordsList.length;
    isFlipped = false;
    renderCard();
  });

  // 下一張
  document.getElementById("btn-next").addEventListener("click", (e) => {
    e.stopPropagation();
    if (wordsList.length === 0) return;
    currentIndex = (currentIndex + 1) % wordsList.length;
    isFlipped = false;
    renderCard();
  });
}
