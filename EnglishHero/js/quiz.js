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

let vocabularyList = [];

const tabFill = document.getElementById("tab-fill");
const tabMatch = document.getElementById("tab-match");
const modeFill = document.getElementById("mode-fill");
const modeMatch = document.getElementById("mode-match");

const fillQuestion = document.getElementById("fill-question");
const fillAnswer = document.getElementById("fill-answer");
const btnCheckFill = document.getElementById("btn-check-fill");
const fillFeedback = document.getElementById("fill-feedback");

const matchBoard = document.getElementById("match-board");
const btnResetMatch = document.getElementById("btn-reset-match");

auth.onAuthStateChanged((user) => {
  if (user) {
    fetchUserData(user.uid);
  } else {
    window.location.replace("login.html?v=2026");
  }
});

function fetchUserData(uid) {
  db.collection("users").doc(uid).collection("words").get()
    .then((snapshot) => {
      vocabularyList = [];
      snapshot.forEach(doc => {
        vocabularyList.push(doc.data());
      });

      if (vocabularyList.length === 0) {
        fillQuestion.textContent = "單字庫為空，請先至「新增單字」建立單字！";
        return;
      }

      startFillGame();
    })
    .catch((err) => {
      fillQuestion.textContent = "資料載入失敗：" + err.message;
    });
}

// 模式切換
tabFill.addEventListener("click", () => {
  tabFill.classList.add("active");
  tabMatch.classList.remove("active");
  modeFill.classList.remove("hidden");
  modeMatch.classList.add("hidden");
  startFillGame();
});

tabMatch.addEventListener("click", () => {
  tabMatch.classList.add("active");
  tabFill.classList.remove("active");
  modeMatch.classList.remove("hidden");
  modeFill.classList.add("hidden");
  startMatchGame();
});

// --- 填空邏輯 ---
let currentFillWord = null;

function startFillGame() {
  if (vocabularyList.length === 0) return;
  fillAnswer.value = "";
  fillFeedback.textContent = "";
  const randomIndex = Math.floor(Math.random() * vocabularyList.length);
  currentFillWord = vocabularyList[randomIndex];
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
  if (vocabularyList.length === 0) {
    matchBoard.innerHTML = "<p style='grid-column:1/3; text-align:center;'>單字庫為空！</p>";
    return;
  }
  matchBoard.innerHTML = "";
  btnResetMatch.classList.add("hidden");
  firstSelectedCard = null;
  matchedPairsCount = 0;

  // 隨機最多取 6 組單字進行配對
  const shuffledList = [...vocabularyList].sort(() => Math.random() - 0.5).slice(0, 6);

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
