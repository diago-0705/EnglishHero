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

// 點擊三個點時，動態在 body 產生浮動選單，完美避開所有容器遮擋
window.toggleDropdown = function(event, folderName, index) {
  event.stopPropagation();
  
  // 移除畫面中可能已經存在的舊選單
  const existingMenu = document.getElementById("global-dropdown-menu");
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const btn = document.getElementById(`dots-btn-${index}`);
  const rect = btn.getBoundingClientRect();

  // 建立動態選單並掛載到 body 最外層
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

// 關閉全域選單
window.closeGlobalDropdown = function() {
  const menu = document.getElementById("global-dropdown-menu");
  if (menu) menu.remove();
};

// 點擊其他地方自動關閉
document.addEventListener('click', () => {
  closeGlobalDropdown();
});
