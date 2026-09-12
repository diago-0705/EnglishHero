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
let allUserWords = [];
let currentTodayBatch = []; // 暫存預覽的今日單字

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    fetchUserFoldersAndWords();
  } else {
    window.location.replace("login.html?v=2103");
  }
});

// 取得使用者的所有單字與不重複資料夾
async function fetchUserFoldersAndWords() {
  try {
    const snapshot = await db.collection("users").doc(currentUser.uid).collection("words").get();
    allUserWords = [];
    const foldersSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      allUserWords.push({ id: doc.id, ...data });
      if (data.folder) foldersSet.add(data.folder);
    });

    const folderSelect = document.getElementById("folder-select");
    folderSelect.innerHTML = '<option value="">-- 請選擇資料夾 --</option>';
    
    foldersSet.forEach(folder => {
      folderSelect.innerHTML += `<option value="${folder}">${folder}</option>`;
    });

  } catch (err) {
    alert("載入資料夾失敗：" + err.message);
  }
}

// 步驟一：預覽背誦計畫
window.generatePlan = function() {
  const selectedFolder = document.getElementById("folder-select").value;
  const targetDays = parseInt(document.getElementById("target-days").value);

  if (!selectedFolder) {
    alert("請先選擇一個資料夾！");
    return;
  }
  if (!targetDays || targetDays <= 0) {
    alert("請輸入有效的天數！");
    return;
  }

  const folderWords = allUserWords.filter(w => w.folder === selectedFolder);
  if (folderWords.length === 0) {
    alert("此資料夾中沒有任何單字！");
    return;
  }

  const dailyCount = Math.ceil(folderWords.length / targetDays);
  currentTodayBatch = folderWords.slice(0, dailyCount);

  // 渲染畫面供預覽
  document.getElementById("plan-result").classList.remove("hidden");
  document.getElementById("plan-title").innerText = 
    `📖 預覽今日份量：共 ${currentTodayBatch.length} 個單字，確認後請點擊下方按鈕加入資料夾。`;

  const container = document.getElementById("daily-words-container");
  container.innerHTML = "";

  currentTodayBatch.forEach((w, index) => {
    container.innerHTML += `
      <div class="word-item">
        <div>
          <span class="word-en">${index + 1}. ${w.en}</span>
          <span class="word-pos">(${w.pos || 'n.'})</span>
        </div>
        <span class="word-ch">${w.ch}</span>
      </div>
    `;
  });
};

// 步驟二：點擊下方按鈕後，真正寫入雲端「🎯 今日背誦計畫」資料夾
window.saveTodayPlanToCloud = async function() {
  if (currentTodayBatch.length === 0) {
    alert("目前沒有可加入的計畫單字！");
    return;
  }

  const planFolderName = "🎯 今日背誦計畫";

  try {
    const userWordsRef = db.collection("users").doc(currentUser.uid).collection("words");

    // 1. 先取得舊的「🎯 今日背誦計畫」單字並安全清空（達到隔天自動重置效果）
    const snapshot = await userWordsRef.where("folder", "==", planFolderName).get();
    
    if (!snapshot.empty) {
      let deleteBatch = db.batch();
      let count = 0;
      for (const doc of snapshot.docs) {
        deleteBatch.delete(doc.ref);
        count++;
        if (count >= 400) {
          await deleteBatch.commit();
          deleteBatch = db.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await deleteBatch.commit();
      }
    }

    // 2. 將今天的份量寫入「🎯 今日背誦計畫」
    let writeBatch = db.batch();
    let writeCount = 0;

    for (const w of currentTodayBatch) {
      const newDocRef = userWordsRef.doc();
      writeBatch.set(newDocRef, {
        en: w.en,
        pos: w.pos || "n.",
        ch: w.ch,
        folder: planFolderName
      });
      writeCount++;
      if (writeCount >= 400) {
        await writeBatch.commit();
        writeBatch = db.batch();
        writeCount = 0;
      }
    }
    if (writeCount > 0) {
      await writeBatch.commit();
    }

    alert(`🎉 成功將今日份的 ${currentTodayBatch.length} 個單字加入「${planFolderName}」資料夾！`);
  } catch (err) {
    alert("加入資料夾失敗：" + err.message);
  }
};
