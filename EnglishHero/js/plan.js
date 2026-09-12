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
    window.location.replace("login.html?v=2106");
  }
});

// 取得使用者的所有單字與不重複資料夾
async function fetchUserFoldersAndWords() {
  try {
    const snapshot = await db.collection("users").doc(currentUser.uid).collection("words").get();
    allUserWords = [];
    const foldersMap = {}; // 用來記錄每個資料夾的單字清單

    snapshot.forEach(doc => {
      const data = doc.data();
      allUserWords.push({ id: doc.id, ...data });
      if (data.folder && !data.folder.includes("🎯") && !data.folder.includes("📦")) {
        if (!foldersMap[data.folder]) {
          foldersMap[data.folder] = [];
        }
        foldersMap[data.folder].push(data);
      }
    });

    const folderSelect = document.getElementById("folder-select");
    // 改為動態產生每個資料夾獨立設定天數的輸入介面
    folderSelect.innerHTML = '<option value="ALL_FOLDERS">🌐 【全部資料夾各自獨立天數合併】</option>';
    
    Object.keys(foldersMap).forEach(folder => {
      folderSelect.innerHTML += `<option value="${folder}">${folder}</option>`;
    });

    // 渲染獨立天數設定區塊
    renderFolderSettings(foldersMap);

  } catch (err) {
    alert("載入資料夾失敗：" + err.message);
  }
}

// 動態在畫面上為每個資料夾產生專屬的天數輸入框
function renderFolderSettings(foldersMap) {
  let settingsContainer = document.getElementById("folder-settings-container");
  if (!settingsContainer) {
    // 如果 HTML 裡還沒有這個容器，我們動態在 #target-days 下方生一個
    const targetDaysGroup = document.getElementById("target-days").closest(".form-group");
    settingsContainer = document.createElement("div");
    settingsContainer.id = "folder-settings-container";
    settingsContainer.style.marginTop = "15px";
    targetDaysGroup.parentNode.insertBefore(settingsContainer, targetDaysGroup.nextSibling);
  }

  settingsContainer.innerHTML = `<label style="font-weight: bold; color: #374151; margin-bottom: 8px; display: block;">📊 各資料夾自訂天數設定：</label>`;
  
  Object.keys(foldersMap).forEach(folder => {
    // 預設天數給 3 天，可隨時修改
    settingsContainer.innerHTML += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: #f9fafb; padding: 8px 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <span style="font-size: 14px; color: #1f2937; font-weight: 500;">📁 ${folder}</span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <input type="number" min="1" value="3" id="days-for-${folder}" class="folder-day-input" data-folder="${folder}" style="width: 60px; padding: 6px; border: 1px solid #d1d5db; border-radius: 6px; text-align: center;">
          <span style="font-size: 13px; color: #6b7280;">天背完</span>
        </div>
      </div>
    `;
  });
}

// 步驟一：預覽背誦計畫（支援各資料夾各自獨立天數與順序切塊）
window.generatePlan = function() {
  const targetDayNum = parseInt(document.getElementById("current-day").value);

  if (!targetDayNum || targetDayNum <= 0) {
    alert("請輸入有效的檢視天數！");
    return;
  }

  // 取得所有有效資料夾及其對應的自訂天數
  const dayInputs = document.querySelectorAll(".folder-day-input");
  if (dayInputs.length === 0) {
    alert("目前沒有找到任何資料夾設定！");
    return;
  }

  currentTodayBatch = [];

  dayInputs.forEach(input => {
    const folderName = input.getAttribute("data-folder");
    const totalDaysForFolder = parseInt(input.value) || 1;
    
    // 抓出該資料夾的所有單字
    const folderWords = allUserWords.filter(w => w.folder === folderName);
    if (folderWords.length === 0) return;

    // 將該資料夾按順序平均切成 totalDaysForFolder 塊
    let folderDayBuckets = Array.from({ length: totalDaysForFolder }, () => []);
    const chunkSize = Math.ceil(folderWords.length / totalDaysForFolder);

    for (let d = 0; d < totalDaysForFolder; d++) {
      const start = d * chunkSize;
      const end = start + chunkSize;
      folderDayBuckets[d] = folderWords.slice(start, end);
    }

    // 撈出使用者當前指定的「第 targetDayNum 天」該資料夾對應的單字
    // （如果該資料夾的天數小於當前天數，代表它已經背完了，當天就不出題）
    const targetBucketIndex = targetDayNum - 1;
    if (targetBucketIndex < folderDayBuckets.length) {
      currentTodayBatch.push(...folderDayBuckets[targetBucketIndex]);
    }
  });

  // 渲染畫面供預覽
  document.getElementById("plan-result").classList.remove("hidden");
  document.getElementById("plan-title").innerText = 
    `📖 Day ${targetDayNum} 綜合進度預覽：共 ${currentTodayBatch.length} 個單字（各資料夾獨立天數合併）。`;

  const container = document.getElementById("daily-words-container");
  container.innerHTML = "";

  if (currentTodayBatch.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #6b7280; padding: 15px;">太棒了！所有資料夾在第 ${targetDayNum} 天都沒有新進度了（可能已提前背完）。</div>`;
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

    alert(`🎉 成功將這天的 ${currentTodayBatch.length} 個綜合單字加入「${planFolderName}」資料夾！`);
  } catch (err) {
    alert("加入資料夾失敗：" + err.message);
  }
};
