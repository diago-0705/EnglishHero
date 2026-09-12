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
let currentTodayBatch = []; 

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    fetchUserFoldersAndWords();
  } else {
    window.location.replace("login.html?v=2104");
  }
});

// 取得使用者的所有單字與不重複資料夾，並加入「全部合併」選項
async function fetchUserFoldersAndWords() {
  try {
    const snapshot = await db.collection("users").doc(currentUser.uid).collection("words").get();
    allUserWords = [];
    const foldersSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      allUserWords.push({ id: doc.id, ...data });
      if (data.folder && !data.folder.includes("🎯") && !data.folder.includes("📦")) {
        foldersSet.add(data.folder);
      }
    });

    const folderSelect = document.getElementById("folder-select");
    folderSelect.innerHTML = '<option value="ALL_FOLDERS">🌐 【全部資料夾交錯合併】</option>';
    
    foldersSet.forEach(folder => {
      folderSelect.innerHTML += `<option value="${folder}">${folder}</option>`;
    });

  } catch (err) {
    alert("載入資料夾失敗：" + err.message);
  }
}

// 步驟一：預覽背誦計畫（支援跨資料夾交錯混合分配）
window.generatePlan = function() {
  const selectedFolder = document.getElementById("folder-select").value;
  const targetDays = parseInt(document.getElementById("target-days").value);
  const targetDayNum = parseInt(document.getElementById("current-day").value);

  if (!targetDays || targetDays <= 0) {
    alert("請輸入有效總天數！");
    return;
  }
  if (!targetDayNum || targetDayNum <= 0 || targetDayNum > targetDays) {
    alert("請輸入有效的檢視天數（不可大於總天數）！");
    return;
  }

  // 決定目標單字來源（全部合併或是指定單一資料夾）
  let targetWords = [];
  let sourceFolders = [];

  if (selectedFolder === "ALL_FOLDERS") {
    // 排除系統專用資料夾
    targetWords = allUserWords.filter(w => !w.folder.includes("🎯") && !w.folder.includes("📦"));
    // 找出所有參與的資料夾名稱
    sourceFolders = [...new Set(targetWords.map(w => w.folder))];
  } else {
    targetWords = allUserWords.filter(w => w.folder === selectedFolder);
    sourceFolders = [selectedFolder];
  }

  if (targetWords.length === 0) {
    alert("所選範圍內沒有任何單字！");
    return;
  }

  // 核心演算法：對每個資料夾內部先做分組，然後做「交錯混合（Round-Robin）」分配
  // 這樣能確保每個資料夾的單字平均分到每一天（例如 Day 1 有 a 和 c，Day 2 有 b 和 d）
  let dayBuckets = Array.from({ length: targetDays }, () => []);

  sourceFolders.forEach(folderName => {
    const folderWords = targetWords.filter(w => w.folder === folderName);
    folderWords.forEach((word, index) => {
      const assignedDayIndex = index % targetDays; // 依序循環分配到第 0 ~ (targetDays-1) 天
      dayBuckets[assignedDayIndex].push(word);
    });
  });

  // 取得使用者選定的那一天（陣列從 0 開始，所以要減 1）
  currentTodayBatch = dayBuckets[targetDayNum - 1] || [];

  // 渲染畫面供預覽
  document.getElementById("plan-result").classList.remove("hidden");
  document.getElementById("plan-title").innerText = 
    `📖 Day ${targetDayNum} 混合進度預覽：共 ${currentTodayBatch.length} 個單字（包含跨資料夾交錯分配）。`;

  const container = document.getElementById("daily-words-container");
  container.innerHTML = "";

  if (currentTodayBatch.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #6b7280; padding: 15px;">這一天沒有分配到單字！</div>`;
    return;
  }

  currentTodayBatch.forEach((w, index) => {
    container.innerHTML += `
      <div class="word-item">
        <div>
          <span class="word-en">${index + 1}. ${w.en}</span>
          <span class="word-pos">(${w.pos || 'n.'})</span>
          <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${w.folder}</span>
        </div>
        <span class="word-ch">${w.ch}</span>
      </div>
    `;
  });
};

// 步驟二：點擊寫入雲端「🎯 今日背誦計畫」資料夾
window.saveTodayPlanToCloud = async function() {
  if (currentTodayBatch.length === 0) {
    alert("目前沒有可加入的計畫單字！");
    return;
  }

  const planFolderName = "🎯 今日背誦計畫";

  try {
    const userWordsRef = db.collection("users").doc(currentUser.uid).collection("words");

    // 1. 先安全清空舊的「🎯 今日背誦計畫」
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
        pos: w.pos || "n. ",
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

    alert(`🎉 成功將這天的 ${currentTodayBatch.length} 個交錯混合單字加入「${planFolderName}」資料夾！`);
  } catch (err) {
    alert("加入資料夾失敗：" + err.message);
  }
};
