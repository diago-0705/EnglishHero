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
let currentViewingFolder = ""; 

const containerEl = document.getElementById("flashcard-container");
const pageTitleEl = document.getElementById("page-title");
const btnBackFolders = document.getElementById("btn-back-folders");
const editModalContainer = document.getElementById("edit-modal-container");

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    fetchAllWords(user.uid);
  } else {
    window.location.replace("login.html?v=2065");
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

// 渲染資料夾清單
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
  folders.forEach((folderName, index) => {
    const count = folderMap[folderName].length;
    html += `
      <div class="folder-wrapper" id="wrapper-${folderName}">
        <div class="folder-actions-hidden">
          <button class="btn-swipe-view" onclick="viewFolderWords('${folderName}')">🔍 檢視</button>
          <button class="btn-swipe-quiz" onclick="startFolderQuiz('${folderName}')">📝 考單字</button>
          <button class="btn-swipe-del" onclick="confirmDeleteFolder('${folderName}')">🗑️ 刪除</button>
        </div>
        
        <div class="folder-item" id="folder-card-${index}" data-folder="${folderName}">
          <div class="folder-info">
            <h3>📁 ${folderName}</h3>
            <p>共 ${count} 個單字</p>
          </div>
          
          <div class="desktop-actions">
            <div class="dots-container">
              <button class="dots-btn" id="dots-btn-${index}" onclick="toggleDropdown(event, '${folderName}', '${index}')">⋮</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  containerEl.innerHTML = html;
  initSwipeToDelete();
}

// 點擊三個點時，動態在 body 產生浮動選單，絕對不會被遮擋
window.toggleDropdown = function(event, folderName, index) {
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
  menu.style.minWidth = "150px";
  menu.style.padding = "4px 0";

  menu.innerHTML = `
    <button onclick="viewFolderWords('${folderName}'); closeGlobalDropdown();" style="display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 14px; color: #334155;">🔍 檢視單字</button>
    <button onclick="startFolderQuiz('${folderName}'); closeGlobalDropdown();" style="display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 14px; color: #334155;">📝 考單字</button>
    <button onclick="confirmDeleteFolder('${folderName}'); closeGlobalDropdown();" style="display: block; width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 14px; color: #ef4444;">🗑️ 刪除資料夾</button>
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

// 手機版左滑顯示隱藏按鈕支援
function initSwipeToDelete() {
  const cards = document.querySelectorAll('.folder-item');
  
  cards.forEach(card => {
    let startX = 0;
    const folderName = card.getAttribute('data-folder');

    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, {passive: true});

    card.addEventListener('touchmove', (e) => {
      const touchX = e.touches[0].clientX;
      const diff = touchX - startX;
      if (diff < 0 && diff > -170) {
        card.style.transform = `translateX(${diff}px)`;
      }
    }, {passive: true});

    card.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      
      if (diff < -70) {
        card.style.transform = `translateX(-150px)`;
      } else {
        card.style.transform = `translateX(0px)`;
      }
    });
  });
}

window.confirmDeleteFolder = function(folderName) {
  if (confirm(`確定要刪除資料夾「${folderName}」以及裡面的所有單字嗎？`)) {
    deleteFolder(folderName);
  }
};

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

window.startFolderQuiz = function(folderName) {
  window.location.href = `quiz.html?folder=${encodeURIComponent(folderName)}&v=2065`;
};

if (btnBackFolders) {
  btnBackFolders.addEventListener("click", () => {
    renderFolderList();
  });
}

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
    viewFolderWords(currentViewingFolder);
  })
  .catch(err => {
    alert("儲存失敗：" + err.message);
  });
};

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
