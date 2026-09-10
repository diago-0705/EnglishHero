// 初始化 Firebase (若需要從資料庫抓單字)
// 這裡先建立一組測試用的單字庫，後續你可以串接 Firestore
const vocabularyList = [
  { en: "abandon", ch: "放棄" },
  { en: "ability", ch: "能力" },
  { en: "absence", ch: "缺席" },
  { en: "absolute", ch: "絕對的" },
  { en: "academic", ch: "學術的" },
  { en: "balance", ch: "平衡" }
];

// DOM 元素 - 頁籤
const tabFill = document.getElementById("tab-fill");
const tabMatch = document.getElementById("tab-match");
const modeFill = document.getElementById("mode-fill");
const modeMatch = document.getElementById("mode-match");

// DOM 元素 - 填空
const fillQuestion = document.getElementById("fill-question");
const fillAnswer = document.getElementById("fill-answer");
const btnCheckFill = document.getElementById("btn-check-fill");
const fillFeedback = document.getElementById("fill-feedback");

// DOM 元素 - 配對
const matchBoard = document.getElementById("match-board");
const btnResetMatch = document.getElementById("btn-reset-match");

// --- 頁籤切換邏輯 ---
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

// ==========================================
// 模式一：填空練習邏輯
// ==========================================
let currentFillWord = null;

function startFillGame() {
  fillAnswer.value = "";
  fillFeedback.textContent = "";
  fillFeedback.style.color = "";
  // 隨機挑選一個單字
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
  const userInput = fillAnswer.value.trim().toLowerCase();
  if (!userInput) return;

  if (userInput === currentFillWord.en.toLowerCase()) {
    fillFeedback.textContent = "✅ 答對了！";
    fillFeedback.style.color = "#16a34a";
    setTimeout(startFillGame, 1000); // 1秒後自動換下一題
  } else {
    fillFeedback.textContent = "❌ 答錯囉，再試一次！(提示字首: " + currentFillWord.en.charAt(0) + ")";
    fillFeedback.style.color = "#dc2626";
    fillAnswer.focus();
  }
}

// ==========================================
// 模式二：配對遊戲邏輯
// ==========================================
let firstSelectedCard = null;
let matchedPairsCount = 0;

function startMatchGame() {
  matchBoard.innerHTML = "";
  btnResetMatch.classList.add("hidden");
  firstSelectedCard = null;
  matchedPairsCount = 0;

  // 取出單字並打亂，生成英文與中文的卡片陣列
  let cards = [];
  vocabularyList.forEach(item => {
    cards.push({ text: item.en, type: 'en', pairId: item.en });
    cards.push({ text: item.ch, type: 'ch', pairId: item.en });
  });

  // 隨機洗牌演算法
  cards.sort(() => Math.random() - 0.5);

  // 渲染卡片
  cards.forEach(card => {
    const div = document.createElement("div");
    div.classList.add("match-card");
    div.textContent = card.text;
    div.dataset.pairId = card.pairId;
    
    div.addEventListener("click", () => handleCardClick(div));
    matchBoard.appendChild(div);
  });
}

function handleCardClick(clickedCard) {
  // 如果點擊的是已經配對成功或已經被選取的卡片，則不反應
  if (clickedCard.classList.contains("matched") || clickedCard.classList.contains("selected")) return;

  clickedCard.classList.add("selected");

  if (!firstSelectedCard) {
    // 這是選取的第一張卡
    firstSelectedCard = clickedCard;
  } else {
    // 這是選取的第二張卡，進行比對
    const firstId = firstSelectedCard.dataset.pairId;
    const secondId = clickedCard.dataset.pairId;

    if (firstId === secondId) {
      // 配對成功
      setTimeout(() => {
        firstSelectedCard.classList.remove("selected");
        firstSelectedCard.classList.add("matched");
        clickedCard.classList.remove("selected");
        clickedCard.classList.add("matched");
        firstSelectedCard = null;
        matchedPairsCount++;
        
        // 檢查是否全部過關
        if (matchedPairsCount === vocabularyList.length) {
          btnResetMatch.classList.remove("hidden");
        }
      }, 300);
    } else {
      // 配對失敗
      setTimeout(() => {
        firstSelectedCard.classList.remove("selected");
        clickedCard.classList.remove("selected");
        firstSelectedCard = null;
      }, 500);
    }
  }
}

btnResetMatch.addEventListener("click", startMatchGame);

// --- 初始化執行 ---
startFillGame(); // 網頁載入時預設啟動填空模式
