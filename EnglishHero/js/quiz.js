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

let allWordsList = []; // 存放從雲端抓回來的全部單字

const tabFill = document.getElementById("tab-fill");
const tabMatch = document.getElementById("tab-match");
const modeFill = document.getElementById("mode-fill");
const modeMatch = document.getElementById("mode-match");
const quizFolderSelect = document.getElementById("quiz-folder-select");

const fillQuestion = document.getElementById("fill-question");
const fillAnswer = document.getElementById("fill-answer");
const btnCheckFill = document.getElementById("btn-check-fill");
const fillFeedback = document.getElementById("fill-feedback");

const matchBoard = document.getElementById("match-board");
const btnResetMatch = document.getElementById("btn-reset-match");

auth.onAuthStateChanged((user) => {
  if (user) {
    fetchAllUserData(user.uid);
  } else {
    window.location.replace("login.html?v=2026");
  }
});

// 1. 載入使用者的全部單字與資料夾清單
function fetchAllUserData(uid) {
  db.collection("users").doc(uid).collection("words").get()
    .then((snapshot) => {
      allWordsList = [];
      const foldersSet = new Set();

      snapshot.forEach(doc => {
        const data = doc.data();
        allWordsList.push(data);
        if (data.folder) {
          foldersSet.add(data.folder);
        }
      });

      // 建立資料夾下拉選單
      quizFolderSelect.innerHTML = `<option value="ALL">全部資料夾 (綜合測驗)</option>`;
      foldersSet.forEach(folderName => {
        const opt = document.createElement("option");
        opt.value = folderName;
        opt.textContent = folderName;
        quizFolderSelect.appendChild(opt);
      });

      if (allWordsList.length === 0) {
        fillQuestion.textContent = "單字庫為空，請先至「新增單字」建立單字！";
        return;
      }

      // 初始化開始測驗
      initCurrentMode();
    })
    .catch((err) => {
      fillQuestion.textContent = "資料載入失敗：" + err.message;
    });
}

// 根據目前選擇的資料夾過濾單字
function getFilteredWords() {
  const selectedFolder = quizFolderSelect.value;
  if (selectedFolder === "ALL") {
    return allWordsList;
  }
  return allWordsList.filter(item => item.folder === selectedFolder);
}

// 切換資料夾時重新開始測驗
quizFolderSelect.addEventListener("change", () => {
  initCurrentMode();
});

// 模式切換
tabFill.addEventListener("click", () => {
  tabFill.classList.add("active");
  tabMatch.classList.remove("active");
  modeFill.classList.remove("hidden");
  modeMatch.classList.add("hidden");
  initCurrentMode();
});

tabMatch.addEventListener("click", () => {
  tabMatch.classList.add("active");
  tabFill.classList.remove("active");
  modeMatch.classList.remove("hidden");
  modeFill.classList.add("hidden");
  initCurrentMode();
});

function initCurrentMode() {
  if (tabFill.classList.contains("active")) {
    startFillGame();
  } else {
    startMatchGame();
  }
}

// --- 填空邏輯 ---
let currentFillWord = null;

function startFillGame() {
  const currentList = getFilteredWords();
  if (currentList.length === 0) {
    fillQuestion.textContent = "此資料夾中沒有單字！";
    fillAnswer.value = "";
    return;
  }
  fillAnswer.value = "";
  fillFeedback.textContent = "";
  const randomIndex = Math.floor(Math.random() * currentList.length);
  currentFillWord = currentList[randomIndex];
  fillQuestion.textContent = currentFillWord.ch;
  fillAnswer.focus();
}

btnCheckFill.addEventListener("click", checkFillAnswer);
fillAnswer.addEventListener("keypress", (e) => {
  if (e.key === "Enter") checkFillAnswer();
});

function checkFillAnswer() {
  if (!currentFillWord) return;
  const userInput = fillAnswer.value.trim().toLowerCase();
  if (!userInput) return;

  if (userInput === currentFillWord.en.toLowerCase()) {
    fillFeedback.textContent = "✅ 答對了！";
    fillFeedback.style.color = "#16a34a";
    setTimeout(startFillGame, 1000);
  } else {
    fillFeedback.textContent = "❌ 答錯囉！提示字首: " + currentFillWord.en.charAt(0);
    fillFeedback.style.color = "#dc2626";
    fillAnswer.focus();
  }
}

// --- 配對邏輯 ---
let firstSelectedCard = null;
let matchedPairsCount = 0;

function startMatchGame() {
  const currentList = getFilteredWords();
  if (currentList.length === 0) {
    matchBoard.innerHTML = "<p style='grid-column:1/3; text-align:center; color:#666;'>此資料夾中沒有單字！</p>";
    btnResetMatch.classList.add("hidden");
    return;
  }

  matchBoard.innerHTML = "";
  btnResetMatch.classList.add("hidden");
  firstSelectedCard = null;
  matchedPairsCount = 0;

  // 隨機最多取 6 組單字進行配對
  const shuffledList = [...currentList].sort(() => Math.random() - 0.5).slice(0, 6);

  let cards = [];
  shuffledList.forEach(item => {
    cards.push({ text: item.en, pairId: item.en });
    cards.push({ text: item.ch, pairId: item.en });
  });

  cards.sort(() => Math.random() - 0.5);

  cards.forEach(card => {
    const div = document.createElement("div");
    div.classList.add("match-card");
    div.textContent = card.text;
    div.dataset.pairId = card.pairId;
    div.addEventListener("click", () => handleCardClick(div, shuffledList.length));
    matchBoard.appendChild(div);
  });
}

function handleCardClick(clickedCard, totalPairs) {
  if (clickedCard.classList.contains("matched") || clickedCard.classList.contains("selected")) return;

  clickedCard.classList.add("selected");

  if (!firstSelectedCard) {
    firstSelectedCard = clickedCard;
  } else {
    const firstId = firstSelectedCard.dataset.pairId;
    const secondId = clickedCard.dataset.pairId;

    if (firstId === secondId) {
      setTimeout(() => {
        firstSelectedCard.classList.remove("selected");
        firstSelectedCard.classList.add("matched");
        clickedCard.classList.remove("selected");
        clickedCard.classList.add("matched");
        firstSelectedCard = null;
        matchedPairsCount++;

        if (matchedPairsCount === totalPairs) {
          btnResetMatch.classList.remove("hidden");
        }
      }, 300);
    } else {
      setTimeout(() => {
        firstSelectedCard.classList.remove("selected");
        clickedCard.classList.remove("selected");
        firstSelectedCard = null;
      }, 500);
    }
  }
}

btnResetMatch.addEventListener("click", startMatchGame);
