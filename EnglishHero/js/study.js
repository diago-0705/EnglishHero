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
let allWords = []; // 儲存所有單字
const containerEl = document.getElementById("flashcard-container");
const pageTitleEl = document.getElementById("page-title");
const btnBackFolders = document.getElementById("btn-back-folders");

// 驗證登入
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    fetchAllWords(user.uid);
  } else {
    window.location.replace("login.html?v=2050");
  }
});

// 抓取該使用者所有的單字
function fetchAllWords(uid) {
  db.collection("users").doc(uid).collection("words").get()
    .then((snapshot) => {
      allWords = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        allWords.push({
          id: doc.id,
          en: data.en || "",
          pos: data.pos || "",
          ch: data.ch || "",
          folder: data.folder || "未分類"
        });
      });
      renderFolderList();
    })
    .catch((err) => {
      console.error("載入失敗：", err);
      containerEl.innerHTML = `<p style="color:red; text-align:center;">載入單字失敗</p>`;
    });
}

// 顯示資料夾條列清單
function renderFolderList() {
  pageTitleEl.textContent = "📁 我的單字資料夾";
  btnBackFolders.style.display = "none";

  // 統計每個資料夾的單字數量
  const folderMap = {};
  allWords.forEach(w => {
    if (!folderMap[w.folder]) folderMap[w.folder] = [];
    folderMap[w.folder].push(w);
  });

  const folders = Object.keys(folderMap);

  if (folders.length === 0) {
    containerEl.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">目前沒有任何單字，快去新增單字吧！</p>`;
    return;
  }

  let html = "";
  folders.forEach(folderName => {
    const count = folderMap[folderName].length;
    html += `
      <div class="folder-item">
        <div class="folder-info">
          <h3>📁 ${folderName}</h3>
          <p>共 ${count} 個單字</p>
        </div>
        <div class="btn-group">
          <button class="btn-view" onclick="viewFolderWords('${folderName}')">🔍 檢視單字</button>
          <button class="btn-del" onclick="deleteFolder('${folderName}')">🗑️ 刪除資料夾</button>
        </div>
      </div>
    `;
  });

  containerEl.innerHTML = html;
}

// 檢視特定資料夾底下的所有單字（條列式）
window.viewFolderWords = function(folderName) {
  pageTitleEl.textContent = `📁 資料夾：${folderName}`;
  btnBackFolders.style.display = "block";

  const targetWords = allWords.filter(w => w.folder === folderName);

  if (targetWords.length === 0) {
    containerEl.innerHTML = `<p style="text-align: center; color: #666;">這個資料夾裡沒有單字。</p>`;
    return;
  }

  let html = `<div style="background: #f8fafc; padding: 10px; border-radius: 8px;">`;
  targetWords.forEach(w => {
    html += `
      <div class="word-row">
        <div>
          <span style="font-size: 16px; font-weight: bold; color: #1d4ed8;">${w.en}</span>
          <span style="font-size: 12px; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${w.pos || '無詞性'}</span>
          <div style="font-size: 14px; color: #4b5563; margin-top: 2px;">${w.ch}</div>
        </div>
        <button onclick="deleteSingleWord('${w.id}', '${folderName}')" style="background: #fee2e2; color: #ef4444; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">刪除</button>
      </div>
    `;
  });
  html += `</div>`;

  containerEl.innerHTML = html;
};

// 返回資料夾清單按鈕事件
if (btnBackFolders) {
  btnBackFolders.addEventListener("click", () => {
    renderFolderList();
  });
}

// 刪除單一單字
window.deleteSingleWord = function(wordId, currentFolderName) {
  if (!confirm("確定要刪除這個單字嗎？")) return;

  db.collection("users").doc(currentUser.uid).collection("words").doc(wordId).delete()
    .then(() => {
      // 從本地陣列移除並重新整理畫面
      allWords = allWords.filter(w => w.id !== wordId);
      viewFolderWords(currentFolderName);
    })
    .catch(err => {
      alert("刪除失敗：" + err.message);
    });
};

// 刪除整個資料夾底下的所有單字
window.deleteFolder = function(folderName) {
  if (!confirm(`確定要刪除資料夾「${folderName}」以及裡面的所有單字嗎？此動作無法復原！`)) return;

  const targetWords = allWords.filter(w => w.folder === folderName);
  const batch = db.batch();

  targetWords.forEach(w => {
    const docRef = db.collection("users").doc(currentUser.uid).collection("words").doc(w.id);
    batch.delete(docRef);
  });

  batch.commit()
    .then(() => {
      // 從本地移除
      allWords = allWords.filter(w => w.folder !== folderName);
      renderFolderList();
    })
    .catch(err => {
      alert("刪除資料夾失敗：" + err.message);
    });
};
