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
const btnAutoTranslate = document.getElementById("btn-auto-translate");

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

// 自動查中文與詞性按鈕事件
if (btnAutoTranslate) {
  btnAutoTranslate.addEventListener("click", async () => {
    const enInput = document.getElementById("word-en");
    const chInput = document.getElementById("word-ch");
    const posSelect = document.getElementById("word-pos");
    const textToTranslate = enInput.value.trim().toLowerCase();

    if (!textToTranslate) {
      alert("請先輸入英文單字！");
      enInput.focus();
      return;
    }

    btnAutoTranslate.textContent = "查詢中...";
    
    try {
      const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(textToTranslate)}`;
      const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|zh-TW`;

      const [dictRes, translateRes] = await Promise.all([
        fetch(dictUrl).catch(() => null),
        fetch(translateUrl).catch(() => null)
      ]);

      // 處理詞性自動對應
      if (dictRes && dictRes.ok) {
        const dictData = await dictRes.json();
        if (dictData && dictData[0] && dictData[0].meanings && dictData[0].meanings.length > 0) {
          const rawPartOFSpeech = dictData[0].meanings[0].partOfSpeech;
          
          let mappedPos = "";
          if (rawPartOFSpeech === "noun") mappedPos = "n.";
          else if (rawPartOFSpeech === "verb") mappedPos = "v.";
          else if (rawPartOFSpeech === "adjective") mappedPos = "adj.";
          else if (rawPartOFSpeech === "adverb") mappedPos = "adv.";
          else if (rawPartOFSpeech === "preposition") mappedPos = "prep.";
          else if (rawPartOFSpeech === "conjunction") mappedPos = "conj.";
          else if (rawPartOFSpeech === "interjection") mappedPos = "phr.";
          
          if (mappedPos && posSelect) {
            posSelect.value = mappedPos;
          }
        }
      }

      // 處理中文翻譯填入
      if (translateRes && translateRes.ok) {
        const transData = await translateRes.json();
        if (transData && transData.responseData && transData.responseData.translatedText) {
          chInput.value = transData.responseData.translatedText;
        }
      }

      if (!chInput.value) {
        alert("找不到對應的中文，請手動輸入。");
      }

    } catch (error) {
      console.error("自動查詢發生錯誤：", error);
      alert("自動查詢連線失敗，請手動輸入。");
    } finally {
      btnAutoTranslate.textContent = "✨ 自動查中文";
    }
  });
}

// 表單送出儲存
if (addForm) {
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser) return;

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
    const pos = document.getElementById("word-pos") ? document.getElementById("word-pos").value : "";
    const ch = document.getElementById("word-ch").value.trim();

    msgEl.textContent = "儲存中...";
    msgEl.className = "msg";

    db.collection("users").doc(currentUser.uid).collection("words").add({
      folder: folder,
      en: en,
      pos: pos,
      ch: ch,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      msgEl.textContent = "✅ 新增成功！";
      msgEl.className = "msg success";
      
      // 清空輸入並重設欄位
      document.getElementById("word-en").value = "";
      if (document.getElementById("word-pos")) {
        document.getElementById("word-pos").value = "";
      }
      document.getElementById("word-ch").value = "";
      document.getElementById("word-en").focus();
      
      loadUserFolders(currentUser.uid);
      
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
