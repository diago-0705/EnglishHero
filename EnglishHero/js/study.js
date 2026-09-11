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
let currentFolderWords = []; // 目前正在背的資料夾單字
let currentIndex = 0;
let isFlipped = false;
let currentFolderForManagement = ""; // 紀錄目前管理的資料夾

const containerEl = document.getElementById("flashcard-container");
const pageTitleEl = document.getElementById("page-title");
const btnBackFolders = document.getElementById("btn-back-folders");
const editModalContainer = document.getElementById("edit-modal-container");

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    fetchAllWords(user.uid);
  } else {
    window.location.replace("login.html?v=2072");
  }
});

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

// 渲染資料夾清單：點擊卡片直接進入背單字模式
function renderFolderList() {
  pageTitleEl.textContent = "📁 我的單字資料夾";
  btnBackFolders.style.display = "none";
  currentFolderForManagement = "";

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
  folders.forEach((folderName, index) => {
    const count = folderMap[folderName].length;
    html += `
      <div class="folder-wrapper">
        <div class="folder-item" onclick="startStudy('${folderName}')">
          <div class="folder-info">
            <h3>📁 ${folderName}</h3>
            <p>共 ${count} 個單字 (點擊開始背單字)</p>
          </div>
          
          <div class="dots-container" onclick="event.stopPropagation()">
            <button class="dots-btn" id="dots-btn-${index}" onclick="toggleFolderDropdown(event, '${folderName}', '${index}')">⚙️</button>
          </div>
        </div>
      </div>
    `;
  });

  containerEl.innerHTML = html;
}

// 資料夾右側的管理選單（包含「修改單字」與「刪除資料夾」）
window.toggleFolderDropdown = function(event, folderName, index) {
  event.stopPropagation();
  
  const existingMenu = document.getElementById("global-dropdown-menu");
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const btn = document.getElementById(`dots-btn-${index}`);
  if (!btn) return;
  const rect = btn.getBoundingClientRect();

  const menu = document.createElement("div");
  menu.id = "global-dropdown-menu";
  menu.style.position = "fixed";
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.right = `${window.innerWidth - rect.right}px`;
  menu.style.background = "#fff";
  menu.style.border = "1px solid #cbd5e1";
  menu.style.borderRadius = "8px";
  menu.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
  menu.style.zIndex = "999999";
  menu.style.minWidth = "160px";
  menu.style.padding = "4px 0";

  menu.innerHTML = `
    <button onclick="openFolderEditModal('${folderName}'); closeGlobalDropdown();" style="display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 14px; color: #334155; font-weight: bold;">✏️ 修改單字</button>
    <button onclick="confirmDeleteFolder('${folderName}'); closeGlobalDropdown();" style="display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 14px; color: #ef4444; font-weight: bold;">🗑️ 刪除資料夾</button>
  `;

  document.body.appendChild(menu);
};

window.closeGlobalDropdown = function() {
  const menu = document.getElementById("global-dropdown-menu");
  if (menu) menu.remove();
};

document.addEventListener('click', () => {
  closeGlobalDropdown();
});

// 開始背單字模式
window.startStudy = function(folderName) {
  currentFolderForManagement = folderName;
  pageTitleEl.textContent = `🎯 背單字：${folderName}`;
  btnBackFolders.style.display = "block";

  currentFolderWords = allWords.filter(w => w.folder === folderName);
  currentIndex = 0;
  isFlipped = false;

  renderFlashcard();
};

// 渲染互動式翻面字卡（正面背面皆顯示詞性，點擊翻面看中文）
function renderFlashcard() {
  if (currentFolderWords.length === 0) {
    containerEl.innerHTML = `<p style="text-align: center; color: #666;">這個資料夾沒有單字。</p>`;
    return;
  }

  const word = currentFolderWords[currentIndex];

  containerEl.innerHTML = `
    <div id="flashcard-box" class="word-card" onclick="flipCard()">
      <!-- 詞性標籤：永遠顯示在右上角 -->
      <span style="position: absolute; top: 16px; right: 20px; font-size: 14px; font-weight: bold; color: #0284c7; background: #e0f2fe; padding: 3px 10px; border-radius: 6px;">
        ${word.pos || '未分類'}
      </span>

      <div style="margin-top: 10px;">
        ${!isFlipped ? `
          <div style="font-size: 36px; font-weight: bold; color: #1d4ed8; margin-bottom: 8px;">${word.en}</div>
          <div style="font-size: 13px; color: #9ca3af; margin-top: 14px;">👆 點擊卡片查看中文意思</div>
        ` : `
          <div style="font-size: 30px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">${word.ch}</div>
          <div style="font-size: 14px; color: #64748b; margin-top: 4px; font-weight: bold;">(${word.en})</div>
          <div style="font-size: 13px; color: #9ca3af; margin-top: 14px;">👆 點擊卡片切回英文</div>
        `}
      </div>
    </div>

    <!-- 上一張 / 下一張 按鈕與計數器 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
      <button onclick="prevCard()" style="padding: 10px 20px; background: #f3f4f6; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">⬅️ 上一張</button>
      <span style="font-size: 15px; font-weight: bold; color: #475569;">${currentIndex + 1} / ${currentFolderWords.length}</span>
      <button onclick="nextCard()" style="padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">下一張 ➡️</button>
    </div>
  `;
}

window.flipCard = function() {
  isFlipped = !isFlipped;
  renderFlashcard();
};

window.prevCard = function() {
  if (currentFolderWords.length === 0) return;
  currentIndex = (currentIndex - 1 + currentFolderWords.length) % currentFolderWords.length;
  isFlipped = false;
  renderFlashcard();
};

window.nextCard = function() {
  if (currentFolderWords.length === 0) return;
  currentIndex = (currentIndex + 1) % currentFolderWords.length;
  isFlipped = false;
  renderFlashcard();
};

// 返回資料夾列表
if (btnBackFolders) {
  btnBackFolders.addEventListener("click", () => {
    renderFolderList();
  });
}

// 點擊管理中的「修改單字」：會列出該資料夾的所有單字供逐一修改
window.openFolderEditModal = function(folderName) {
  currentFolderForManagement = folderName;
  const targetWords = allWords.filter(w => w.folder === folderName);

  pageTitleEl.textContent = `✏️ 修改資料夾單字：${folderName}`;
  btnBackFolders.style.display = "block";

  if (targetWords.length === 0) {
    containerEl.innerHTML = `<p style="text-align: center; color: #666;">這個資料夾裡沒有單字可修改。</p>`;
    return;
  }

  let html = `<div style="background: #f8fafc; padding: 10px; border-radius: 8px;">`;
  targetWords.forEach(w => {
    html += `
      <div class="word-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; background: #fff; margin-top: 6px; border-radius: 6px;">
        <div>
          <span style="font-size: 16px; font-weight: bold; color: #1d4ed8;">${w.en}</span>
          <span style="font-size: 12px; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${w.pos || '無詞性'}</span>
          <div style="font-size: 14px; color: #4b5563; margin-top: 2px;">${w.ch}</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button onclick="openSingleEditModal('${w.id}')" style="background: #e0e7ff; color: #4f46e5; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold;">修改</button>
          <button onclick="deleteSingleWord('${w.id}')" style="background: #fee2e2; color: #ef4444; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold;">刪除</button>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  containerEl.innerHTML = html;
};

// 開啟單一單字修改彈窗（採用新增單字模板）
window.openSingleEditModal = function(wordId) {
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

window.closeEditModal = function() {
  editModalContainer.innerHTML = "";
};

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
    const target = allWords.find(w => w.id === wordId);
    if (target) {
      target.en = newEn;
      target.pos = newPos;
      target.ch = newCh;
    }
    closeEditModal();
    openFolderEditModal(currentFolderForManagement);
  })
  .catch(err => {
    alert("修改失敗：" + err.message);
  });
};

window.deleteSingleWord = function(wordId) {
  if (!confirm("確定要刪除這個單字嗎？")) return;

  db.collection("users").doc(currentUser.uid).collection("words").doc(wordId).delete()
    .then(() => {
      allWords = allWords.filter(w => w.id !== wordId);
      openFolderEditModal(currentFolderForManagement);
    })
    .catch(err => {
      alert("刪除失敗：" + err.message);
    });
};

window.confirmDeleteFolder = function(folderName) {
  if (confirm(`確定要刪除資料夾「${folderName}」以及裡面的所有單字嗎？`)) {
    deleteFolder(folderName);
  }
};

window.deleteFolder = function(folderName) {
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
