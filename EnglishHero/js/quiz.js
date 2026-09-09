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
let quizPool = [];
let currentQIndex = 0;
let score = 0;

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUserEmail = user.email;
    loadUserData();
    renderFolderCheckboxes();
  } else {
    window.location.replace("login.html");
  }
});

function loadUserData() {
  const saved = localStorage.getItem(`english_hero_tree_${currentUserEmail}`);
  if (saved) {
    rootFolder = JSON.parse(saved);
  }
}

// DOM
const setupCard = document.getElementById("quiz-setup-card");
const playCard = document.getElementById("quiz-play-card");
const resultCard = document.getElementById("quiz-result-card");
const folderTreeEl = document.getElementById("folder-checkbox-tree");
const btnStartQuiz = document.getElementById("btn-start-quiz");

const qProgress = document.getElementById("quiz-progress");
const qScore = document.getElementById("quiz-score");
const qWord = document.getElementById("quiz-question-word");
const qOptionsContainer = document.getElementById("quiz-options-container");
const qFeedback = document.getElementById("quiz-feedback");
const btnNextQuestion = document.getElementById("btn-next-question");
const btnQuizSpeak = document.getElementById("btn-quiz-speak");
const finalScoreText = document.getElementById("final-score-text");

// 遞迴產生所有資料夾選單
function renderFolderCheckboxes() {
  folderTreeEl.innerHTML = "";
  if (!rootFolder) return;

  function traverse(node, depth = 0) {
    const div = document.createElement("div");
    div.style.marginLeft = `${depth * 20}px`;
    div.className = "folder-select-item";
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${node.id}" checked>
        📁 <strong>${node.name}</strong> (${node.words ? node.words.length : 0} 個單字)
      </label>
    `;
    folderTreeEl.appendChild(div);

    if (node.subfolders) {
      node.subfolders.forEach(sub => traverse(sub, depth + 1));
    }
  }

  traverse(rootFolder, 0);
}

// 根據勾選收集所有題目
btnStartQuiz.addEventListener("click", () => {
  const checkboxes = folderTreeEl.querySelectorAll("input[type='checkbox']:checked");
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);

  if (selectedIds.length === 0) {
    alert("請至少勾選一個資料夾！");
    return;
  }

  quizPool = [];
  function collect(node) {
    if (selectedIds.includes(node.id) && node.words) {
      quizPool.push(...node.words);
    }
    if (node.subfolders) {
      node.subfolders.forEach(sub => collect(sub));
    }
  }
  collect(rootFolder);

  if (quizPool.length < 2) {
    alert("所選資料夾內的單字總數太少（至少需要 2 個單字才能進行測驗）！請先新增更多單字。");
    return;
  }

  // 洗牌
  quizPool.sort(() => Math.random() - 0.5);
  currentQIndex = 0;
  score = 0;

  setupCard.classList.add("hidden");
  playCard.classList.remove("hidden");
  renderQuestion();
});

function renderQuestion() {
  qFeedback.className = "quiz-feedback hidden";
  btnNextQuestion.classList.add("hidden");

  const currentQ = quizPool[currentQIndex];
  qProgress.textContent = `第 ${currentQIndex + 1} / ${quizPool.length} 題`;
  qScore.textContent = `得分：${score}`;
  qWord.textContent = currentQ.word;

  // 產生 4 個選項（1 正確 + 3 干擾項）
  const options = [currentQ.translation];
  const otherTranslations = quizPool
    .filter(item => item.translation !== currentQ.translation)
    .map(item => item.translation);

  otherTranslations.sort(() => Math.random() - 0.5);
  options.push(...otherTranslations.slice(0, 3));
  options.sort(() => Math.random() - 0.5);

  qOptionsContainer.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(opt, currentQ.translation, btn);
    qOptionsContainer.appendChild(btn);
  });
}

function checkAnswer(selected, correct, btnEl) {
  const allBtns = qOptionsContainer.querySelectorAll(".quiz-option-btn");
  allBtns.forEach(b => b.disabled = true);

  if (selected === correct) {
    btnEl.classList.add("correct");
    score += Math.round(100 / quizPool.length);
    qFeedback.textContent = "🎉 答對了！太厲害了！";
    qFeedback.className = "quiz-feedback success";
  } else {
    btnEl.classList.add("wrong");
    allBtns.forEach(b => {
      if (b.textContent === correct) b.classList.add("correct");
    });
    qFeedback.textContent = `❌ 答錯了，正確答案是：${correct}`;
    qFeedback.className = "quiz-feedback error";
  }

  qScore.textContent = `得分：${score}`;
  btnNextQuestion.classList.remove("hidden");
}

btnNextQuestion.addEventListener("click", () => {
  currentQIndex++;
  if (currentQIndex < quizPool.length) {
    renderQuestion();
  } else {
    playCard.classList.add("hidden");
    resultCard.classList.remove("hidden");
    finalScoreText.textContent = `最終成績：${score} 分`;
  }
});

btnQuizSpeak.addEventListener("click", () => {
  const word = quizPool[currentQIndex].word;
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
});