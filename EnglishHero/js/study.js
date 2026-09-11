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
let allWords = []; 
let currentViewingFolder = ""; // 紀錄目前正在看的資料夾

const containerEl = document.getElementById("flashcard-container");
const pageTitleEl = document.getElementById("page-title");
const btnBackFolders = document.getElementById("btn-back-folders");
const editModalContainer = document.getElementById("edit-modal-container");

// 驗證登入
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    fetchAllWords(user.uid);
  } else {
    window.location.replace("login.html?v=2052");
  }
});

// 抓取所有單字
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
  currentViewingFolder = "";

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

// 檢視特定資料夾底下的所有單字
window.viewFolderWords = function(folderName) {
  currentViewingFolder = folderName;
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
        <div style="display: flex; gap: 6px;">
          <button onclick="openEditModal('${w.id}')" style="background: #e0e7ff; color: #4f46e5; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">修改</button>
          <button onclick="deleteSingleWord('${w.id}')" style="background: #fee2e2; color: #ef4444; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">刪除</button>
        </div>
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

// 開啟與「新增單字」完全一致版型的修改表單
window.openEditModal = function(wordId) {
  const target = allWords.find(w => w.id === wordId);
  if (!target) return;

  editModalContainer.innerHTML = `
    <div class="edit-modal-backdrop">
      <div class="edit-card">
        <h3 style="margin-top: 0; color: #1e293b; margin-bottom: 16px;">✏️ 修改單字資料</h3>
        
        <div class="form-group">
          <label>英文單字 (English)</label>
          <input type="text" id="edit-en" value="${target.en}">
        </div>

        <div class="form-group">
          <label>詞性 (Part of Speech)</label>
          <select id="edit-pos">
            <option value="n." ${target.pos === 'n.' ? 'selected' : ''}>n. (名詞)</option>
            <option value="v." ${target.pos === 'v.' ? 'selected' : ''}>v. (動詞)</option>
            <option value="adj." ${target.pos === 'adj.' ? 'selected' : ''}>adj. (形容詞)</option>
            <option value="adv." ${target.pos === 'adv.' ? 'selected' : ''}>adv. (副詞)</option>
            <option value="prep." ${target.pos === 'prep.' ? 'selected' : ''}>prep. (介系詞)</option>
            <option value="conj." ${target.pos === 'conj.' ? 'selected' : ''}>conj. (連接詞)</option>
            <option value="phr." ${target.pos === 'phr.' ? 'selected' : ''}>phr. (片語)</option>
            <option value="other" ${!['n.','v.','adj.','adv.','prep.','conj.','phr.'].includes(target.pos) ? 'selected' : ''}>其他</option>
          </select>
        </div>

        <div class="form-group">
          <label>中文意思 (Chinese)</label>
          <input type="text" id="edit-ch" value="${target.ch}">
        </div>

        <div class="modal-btns">
          <button class="btn-cancel" onclick="closeEditModal()">取消</button>
          <button class="btn-save" onclick="saveEditedWord('${target.id}')">儲存修改</button>
        </div>
      </div>
    </div>
  `;
};

// 關閉修改表單
window.closeEditModal = function() {
  editModalContainer.innerHTML = "";
};

// 儲存修改後的單字到 Firestore
window.saveEditedWord = function(wordId) {
  const newEn = document.getElementById("edit-en").value.trim();
  const newPos = document.getElementById("edit-pos").value;
  const newCh = document.getElementById("edit-ch").value.trim();

  if (!newEn || !newCh) {
    alert("英文與中文不能為空！");
    return;
  }

  db.collection("users").doc(currentUser.uid).collection("words").doc(wordId).update({
    en: newEn,
    pos: newPos,
    ch: newCh
  })
  .then(() => {
    // 更新本地暫存資料
    const target = allWords.find(w => w.id === wordId);
    if (target) {
      target.en = newEn;
      target.pos = newPos;
      target.ch = newCh;
    }
    closeEditModal();
    viewFolderWords(currentViewingFolder); // 重新整理當前資料夾列表
  })
  .catch(err => {
    alert("儲存失敗：" + err.message);
  });
};

// 刪除單一單字
window.deleteSingleWord = function(wordId) {
  if (!confirm("確定要刪除這個單字嗎？")) return;

  db.collection("users").doc(currentUser.uid).collection("words").doc(wordId).delete()
    .then(() => {
      allWords = allWords.filter(w => w.id !== wordId);
      viewFolderWords(currentViewingFolder);
    })
    .catch(err => {
      alert("刪除失敗：" + err.message);
    });
};

// 刪除整個資料夾
window.deleteFolder = function(folderName) {
  if (!confirm(`確定要刪除資料夾「${folderName}」以及裡面的所有單字嗎？`)) return;

  const targetWords = allWords.filter(w => w.folder === folderName);
  const batch = db.batch();

  targetWords.forEach(w => {
    const docRef = db.collection("users").doc(currentUser.uid).collection("words").doc(w.id);
    batch.delete(docRef);
  });

  batch.commit()
    .then(() => {
      allWords = allWords.filter(w => w.folder !== folderName);
      renderFolderList();
    })
    .catch(err => {
      alert("刪除資料夾失敗：" + err.message);
    });
};
