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

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    fetchUserFoldersAndWords();
  } else {
    window.location.replace("login.html?v=2102");
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

// 產生平均分配的背誦計畫
window.generatePlan = async function() {
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
  const todayBatch = folderWords.slice(0, dailyCount);

  // 固定使用這個常駐名稱（隔天自動更新重置）
  const planFolderName = "🎯 今日背誦計畫";

  try {
    const userWordsRef = db.collection("users").doc(currentUser.uid).collection("words");

    // 1. 先取得舊的「🎯 今日背誦計畫」單字並安全清空
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

    for (const w of todayBatch) {
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

    // 3. 渲染畫面
    document.getElementById("plan-result").classList.remove("hidden");
    document.getElementById("plan-title").innerText = 
      `📖 已成功載入「${planFolderName}」！共 ${todayBatch.length} 個單字，今天請完成這批練習。`;

    const container = document.getElementById("daily-words-container");
    container.innerHTML = "";

    todayBatch.forEach((w, index) => {
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

    alert(`成功更新「${planFolderName}」！`);
  } catch (err) {
    alert("生成計畫失敗：" + err.message);
  }
};
