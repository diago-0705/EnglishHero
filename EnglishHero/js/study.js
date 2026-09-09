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

let currentUserEmail = "";
let rootFolder = null;
let currentPath = []; // 存放資料夾 id 路徑陣列
let currentCardIndex = 0;

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUserEmail = user.email;
    loadUserData();
    currentPath = ["root"];
    renderView();
  } else {
    window.location.replace("login.html");
  }
});

function getStorageKey() {
  return `english_hero_tree_${currentUserEmail}`;
}

function loadUserData() {
  const saved = localStorage.getItem(getStorageKey());
  if (saved) {
    rootFolder = JSON.parse(saved);
  } else {
    // 預設樹狀結構
    rootFolder = {
      id: "root",
      name: "根目錄",
      words: [],
      subfolders: [
        {
          id: "folder_toeic",
          name: "TOEIC 多益",
          words: [
            { word: "contract", translation: "合約" },
            { word: "negotiate", translation: "協商" }
          ],
          subfolders: [
            {
              id: "folder_toeic_part1",
              name: "商務對話核心",
              words: [{ word: "agenda", translation: "議程" }],
              subfolders: []
            }
          ]
        },
        {
          id: "folder_daily",
          name: "日常會話",
          words: [
            { word: "apple", translation: "蘋果" },
            { word: "courage", translation: "勇氣" }
          ],
          subfolders: []
        }
      ]
    };
    saveUserData();
  }
}

function saveUserData() {
  localStorage.setItem(getStorageKey(), JSON.stringify(rootFolder));
}

// 根據 path 陣列取得當前目錄物件
function getCurrentFolder() {
  let curr = rootFolder;
  for (let i = 1; i < currentPath.length; i++) {
    curr = curr.subfolders.find(f => f.id === currentPath[i]);
    if (!curr) break;
  }
  return curr || rootFolder;
}

// DOM
const breadcrumbBar = document.getElementById("breadcrumb-bar");
const subfolderList = document.getElementById("subfolder-list");
const wordTableBody = document.getElementById("word-table-body");
const flashcardSection = document.getElementById("flashcard-section");
const cardInner = document.getElementById("card-inner");
const cardWord = document.getElementById("card-word");
const cardTranslation = document.getElementById("card-translation");
const cardCounter = document.getElementById("card-counter");
const btnPrevCard = document.getElementById("btn-prev-card");
const btnNextCard = document.getElementById("btn-next-card");
const btnSpeak = document.getElementById("btn-speak");
const btnCreateSubfolder = document.getElementById("btn-create-subfolder");
const btnAddWord = document.getElementById("btn-add-word");

function renderView() {
  const current = getCurrentFolder();
  renderBreadcrumb();
  renderSubfolders(current);
  renderWords(current);
}

// 麵包屑導航
function renderBreadcrumb() {
  breadcrumbBar.innerHTML = "";
  let curr = rootFolder;
  
  const rootSpan = document.createElement("span");
  rootSpan.className = "crumb-item";
  rootSpan.textContent = "📁 根目錄";
  rootSpan.onclick = () => {
    currentPath = ["root"];
    currentCardIndex = 0;
    renderView();
  };
  breadcrumbBar.appendChild(rootSpan);

  for (let i = 1; i < currentPath.length; i++) {
    curr = curr.subfolders.find(f => f.id === currentPath[i]);
    if (!curr) break;
    
    const sep = document.createElement("span");
    sep.textContent = " / ";
    breadcrumbBar.appendChild(sep);

    const crumb = document.createElement("span");
    crumb.className = "crumb-item";
    crumb.textContent = curr.name;
    const pathIdx = i;
    crumb.onclick = () => {
      currentPath = currentPath.slice(0, pathIdx + 1);
      currentCardIndex = 0;
      renderView();
    };
    breadcrumbBar.appendChild(crumb);
  }
}

// 渲染子資料夾清單
function renderSubfolders(current) {
  subfolderList.innerHTML = "";
  if (!current.subfolders || current.subfolders.length === 0) {
    subfolderList.innerHTML = `<p class="empty-tip">無子資料夾</p>`;
    return;
  }

  current.subfolders.forEach((sub) => {
    const item = document.createElement("div");
    item.className = "folder-item";
    item.innerHTML = `
      <div class="folder-info" onclick="navigateToFolder('${sub.id}')">
        <span class="folder-icon">📁</span>
        <h3>${sub.name}</h3>
        <p>${sub.words ? sub.words.length : 0} 個單字 · ${sub.subfolders ? sub.subfolders.length : 0} 個子資料夾</p>
      </div>
      <button class="btn-delete-folder" onclick="deleteSubfolder('${sub.id}', event)">刪除</button>
    `;
    subfolderList.appendChild(item);
  });
}

window.navigateToFolder = function(folderId) {
  currentPath.push(folderId);
  currentCardIndex = 0;
  renderView();
};

// 建立子資料夾
btnCreateSubfolder.addEventListener("click", () => {
  const name = prompt("請輸入子資料夾名稱：");
  if (!name || !name.trim()) return;

  const current = getCurrentFolder();
  if (!current.subfolders) current.subfolders = [];

  current.subfolders.push({
    id: "f_" + Date.now(),
    name: name.trim(),
    words: [],
    subfolders: []
  });

  saveUserData();
  renderView();
});

// 刪除子資料夾
window.deleteSubfolder = function(folderId, e) {
  e.stopPropagation();
  if (!confirm("確定要刪除此資料夾及其內含的全部內容嗎？")) return;
  const current = getCurrentFolder();
  current.subfolders = current.subfolders.filter(f => f.id !== folderId);
  saveUserData();
  renderView();
};

// 渲染單字清單與卡片
function renderWords(current) {
  wordTableBody.innerHTML = "";

  if (!current.words || current.words.length === 0) {
    flashcardSection.classList.add("hidden");
    wordTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;padding:20px;">此資料夾尚無單字</td></tr>`;
    return;
  }

  flashcardSection.classList.remove("hidden");
  updateFlashcard(current);

  current.words.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.word}</strong></td>
      <td>${item.translation}</td>
      <td style="text-align:center;">
        <button class="btn-del-sm" onclick="deleteWord(${index})">刪除</button>
      </td>
    `;
    wordTableBody.appendChild(tr);
  });
}

// 新增單字
btnAddWord.addEventListener("click", () => {
  const word = prompt("請輸入英文單字：");
  if (!word || !word.trim()) return;

  const translation = prompt("請輸入中文解釋：");
  if (!translation || !translation.trim()) return;

  const current = getCurrentFolder();
  if (!current.words) current.words = [];
  current.words.push({ word: word.trim(), translation: translation.trim() });

  saveUserData();
  renderView();
});

window.deleteWord = function(index) {
  const current = getCurrentFolder();
  current.words.splice(index, 1);
  if (currentCardIndex >= current.words.length) {
    currentCardIndex = Math.max(0, current.words.length - 1);
  }
  saveUserData();
  renderView();
};

// 翻卡與切換
function updateFlashcard(current) {
  if (!current.words || current.words.length === 0) return;
  const item = current.words[currentCardIndex];
  cardWord.textContent = item.word;
  cardTranslation.textContent = item.translation;
  cardCounter.textContent = `${currentCardIndex + 1} / ${current.words.length}`;
  cardInner.classList.remove("flipped");
}

cardInner.addEventListener("click", (e) => {
  if (e.target.id === "btn-speak") return;
  cardInner.classList.toggle("flipped");
});

btnPrevCard.addEventListener("click", () => {
  const current = getCurrentFolder();
  if (!current.words || current.words.length === 0) return;
  currentCardIndex = (currentCardIndex - 1 + current.words.length) % current.words.length;
  updateFlashcard(current);
});

btnNextCard.addEventListener("click", () => {
  const current = getCurrentFolder();
  if (!current.words || current.words.length === 0) return;
  currentCardIndex = (currentCardIndex + 1) % current.words.length;
  updateFlashcard(current);
});

// 發音
btnSpeak.addEventListener("click", (e) => {
  e.stopPropagation();
  const current = getCurrentFolder();
  if (!current.words || current.words.length === 0) return;
  const word = current.words[currentCardIndex].word;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
});