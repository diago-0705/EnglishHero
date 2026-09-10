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

const folderSelect = document.getElementById("folder-select");
const newFolderGroup = document.getElementById("new-folder-group");
const newFolderInput = document.getElementById("new-folder-input");
const btnToggleNewFolder = document.getElementById("btn-toggle-new-folder");
const btnCancelNewFolder = document.getElementById("btn-cancel-new-folder");
const addForm = document.getElementById("add-word-form");
const msgEl = document.getElementById("add-msg");

// 驗證登入並載入現有資料夾
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loadUserFolders(user.uid);
  } else {
    window.location.replace("login.html?v=2026");
  }
});

// 從 Firestore 抓取現有的資料夾清單
function loadUserFolders(uid) {
  db.collection("users").doc(uid).collection("words").get()
    .then((snapshot) => {
      const foldersSet = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.folder) {
          foldersSet.add(data.folder);
        }
      });

      folderSelect.innerHTML = "";
      if (foldersSet.size === 0) {
        folderSelect.innerHTML = `<option value="預設分類">預設分類</option>`;
      } else {
        foldersSet.forEach(folderName => {
          const opt = document.createElement("option");
          opt.value = folderName;
          opt.textContent = folderName;
          folderSelect.appendChild(opt);
        });
      }
    })
    .catch((err) => {
      console.error("載入資料夾失敗：", err);
      folderSelect.innerHTML = `<option value="預設分類">預設分類</option>`;
    });
}

// 切換至「新增資料夾」模式
btnToggleNewFolder.addEventListener("click", () => {
  folderSelect.value = "";
  folderSelect.disabled = true;
  newFolderGroup.classList.remove("hidden");
  newFolderInput.required = true;
  newFolderInput.focus();
  btnToggleNewFolder.classList.add("hidden");
});

// 取消新增資料夾，回到下拉選單
btnCancelNewFolder.addEventListener("click", () => {
  newFolderGroup.classList.add("hidden");
  newFolderInput.required = false;
  newFolderInput.value = "";
  folderSelect.disabled = false;
  btnToggleNewFolder.classList.remove("hidden");
});

// 表單送出儲存
if (addForm) {
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // 判斷要使用下拉選單的值，還是新輸入的資料夾名稱
    let folder = "";
    if (!newFolderGroup.classList.contains("hidden")) {
      folder = newFolderInput.value.trim();
    } else {
      folder = folderSelect.value;
    }

    if (!folder) {
      alert("請選擇或輸入資料夾名稱！");
      return;
    }

    const en = document.getElementById("word-en").value.trim();
    const ch = document.getElementById("word-ch").value.trim();

    msgEl.textContent = "儲存中...";
    msgEl.className = "msg";

    db.collection("users").doc(currentUser.uid).collection("words").add({
      folder: folder,
      en: en,
      ch: ch,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      msgEl.textContent = "✅ 新增成功！";
      msgEl.className = "msg success";
      document.getElementById("word-en").value = "";
      document.getElementById("word-ch").value = "";
      document.getElementById("word-en").focus();
      
      // 重新載入資料夾清單（若剛才是新增了全新資料夾，會自動被收錄進下拉選單）
      loadUserFolders(currentUser.uid);
      
      // 如果剛才是用新增資料夾模式，存完後自動切回下拉選單鎖定該新資料夾
      if (!newFolderGroup.classList.contains("hidden")) {
        btnCancelNewFolder.click();
        folderSelect.value = folder;
      }

      setTimeout(() => { msgEl.textContent = ""; }, 2500);
    })
    .catch((err) => {
      msgEl.textContent = `❌ 儲存失敗：${err.message}`;
      msgEl.className = "msg error";
    });
  });
}
