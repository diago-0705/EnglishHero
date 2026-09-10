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

let allWordsList = []; // 存放全部單字

const tabEnToCh = document.getElementById("tab-en-to-ch");
const tabChToEn = document.getElementById("tab-ch-to-en");
const quizFolderSelect = document.getElementById("quiz-folder-select");

const quizQuestion = document.getElementById("quiz-question");
const optionsContainer = document.getElementById("options-container");
const quizFeedback = document.getElementById("quiz-feedback");

let currentCorrectItem = null;
let isAnswerLocked = false; // 答題鎖定，避免連續點擊

auth.onAuthStateChanged((user) => {
  if (user) {
    fetchAllUserData(user.uid);
  } else {
    window.location.replace("login.html?v=2026");
  }
});

// 1. 抓取使用者的全部單字
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
        quizQuestion.textContent = "單字庫為空，請先至「新增單字」建立單字！";
        return;
      }

      startNewQuestion();
    })
    .catch((err) => {
      quizQuestion.textContent = "資料載入失敗：" + err.message;
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

// 資料夾切換或模式切換時重新出題
quizFolderSelect.addEventListener("change", () => {
  startNewQuestion();
});

tabEnToCh.addEventListener("click", () => {
  tabEnToCh.classList.add("active");
  tabChToEn.classList.remove("active");
  startNewQuestion();
});

tabChToEn.addEventListener("click", () => {
  tabChToEn.classList.add("active");
  tabEnToCh.classList.remove("active");
  startNewQuestion();
});

// 2. 產生新題目
function startNewQuestion() {
  const currentList = getFilteredWords();
  isAnswerLocked = false;
  quizFeedback.textContent = "";
  optionsContainer.innerHTML = "";

  if (currentList.length === 0) {
    quizQuestion.textContent = "此資料夾中沒有單字！";
    return;
  }

  if (currentList.length < 3) {
    quizQuestion.textContent = "⚠️ 該資料夾單字少於 3 個，請至少新增 3 個單字才能進行三選一測驗！";
    return;
  }

  // 隨機選出一題正解
  const randomIndex = Math.floor(Math.random() * currentList.length);
  currentCorrectItem = currentList[randomIndex];

  // 決定目前模式：true 為英選中，false 為中選英
  const isEnToCh = tabEnToCh.classList.contains("active");

  if (isEnToCh) {
    quizQuestion.textContent = `英文：${currentCorrectItem.en}`;
  } else {
    quizQuestion.textContent = `中文：${currentCorrectItem.ch}`;
  }

  // 從其他單字中隨機挑選 2 個不同的干擾選項
  let wrongOptions = currentList.filter(item => item.en !== currentCorrectItem.en);
  wrongOptions.sort(() => Math.random() - 0.5);
  const selectedWrong = wrongOptions.slice(0, 2);

  // 組合總共 3 個選項（1個正確 + 2個錯誤）
  let choices = [
    { text: isEnToCh ? currentCorrectItem.ch : currentCorrectItem.en, isCorrect: true },
    { text: isEnToCh ? selectedWrong[0].ch : selectedWrong[0].en, isCorrect: false },
    { text: isEnToCh ? selectedWrong[1].ch : selectedWrong[1].en, isCorrect: false }
  ];

  // 打亂選項順序
  choices.sort(() => Math.random() - 0.5);

  // 渲染按鈕
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.classList.add("option-btn");
    btn.textContent = choice.text;
    btn.addEventListener("click", () => handleAnswerClick(btn, choice.isCorrect));
    optionsContainer.appendChild(btn);
  });
}

// 3. 點擊選項後的處理
function handleAnswerClick(clickedBtn, isCorrect) {
  if (isAnswerLocked) return;
  isAnswerLocked = true;

  const allButtons = optionsContainer.querySelectorAll(".option-btn");

  if (isCorrect) {
    clickedBtn.classList.add("correct");
    quizFeedback.textContent = "✅ 答對了！太棒了！";
    quizFeedback.style.color = "#16a34a";
    
    // 1.2 秒後自動進入下一題
    setTimeout(() => {
      startNewQuestion();
    }, 1200);
  } else {
    clickedBtn.classList.add("wrong");
    quizFeedback.textContent = "❌ 答錯囉！";
    quizFeedback.style.color = "#dc2626";

    // 找出正確答案並標示綠色提示
    allButtons.forEach(btn => {
      const isEnToCh = tabEnToCh.classList.contains("active");
      const targetText = isEnToCh ? currentCorrectItem.ch : currentCorrectItem.en;
      if (btn.textContent === targetText) {
        btn.classList.add("correct");
      }
    });

    // 2 秒後自動進入下一題
    setTimeout(() => {
      startNewQuestion();
    }, 2000);
  }
}
