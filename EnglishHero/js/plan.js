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
    window.location.replace("login.html?v=2088");
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

  // 篩選出該資料夾的所有單字
  const folderWords = allUserWords.filter(w => w.folder === selectedFolder);
  if (folderWords.length === 0) {
    alert("此資料夾中沒有任何單字！");
    return;
  }

  // 計算每天平均分配的數量
  const dailyCount = Math.ceil(folderWords.length / targetDays);
  
  // 為了示範，我們抓取「今天」應該要背的第一批單字（取前 dailyCount 個）
  // 實務上也可以搭配 LocalStorage 記錄已經背到第幾天
  const todayBatch = folderWords.slice(0, dailyCount);

  // 渲染畫面
  document.getElementById("plan-result").classList.remove("hidden");
  document.getElementById("plan-title").innerText = 
    `📖 「${selectedFolder}」總共 ${folderWords.length} 個字，預計 ${targetDays} 天背完。今日需背進度（第 1 天）：共 ${todayBatch.length} 個字`;

  const container = document.getElementById("daily-words-container");
  container.innerHTML = "";

  todayBatch.forEach((w, index) => {
    container.innerHTML += `
      <div class="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
        <div>
          <span class="font-bold text-gray-800 text-lg">${index + 1}. ${w.en}</span>
          <span class="text-sm text-indigo-500 ml-2">(${w.pos || 'n.'})</span>
        </div>
        <span class="text-gray-600 font-medium">${w.ch}</span>
      </div>
    `;
  });
};
