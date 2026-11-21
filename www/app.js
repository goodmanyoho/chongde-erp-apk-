import os, json, zipfile

base_dir = "/tmp/chongde-erp-project"
os.makedirs(os.path.join(base_dir, "www"), exist_ok=True)
os.makedirs(os.path.join(base_dir, ".github", "workflows"), exist_ok=True)

package_json = {
  "name": "chongde-general-hr-erp",
  "version": "2.1.0",
  "description": "General Affairs and HR ERP for Chongde Dao Chang (Capacitor Android APK)",
  "main": "www/index.html",
  "scripts": {
    "build": "echo 'Static web assets ready'"
  },
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/android": "^6.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.0.0"
  }
}

capacitor_config = {
  "appId": "com.chongde.generalhrerp",
  "appName": "崇德總務人力ERP",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  }
}

build_yml = """name: Build Android APK

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: "temurin"
          java-version: "21"

      - name: Install npm dependencies
        run: npm install

      - name: Initialize Android project if missing
        run: |
          if [ ! -d "android" ]; then
            npx cap add android
          fi
          npx cap sync android

      - name: Grant execute permission to gradlew
        run: chmod +x android/gradlew

      - name: Assemble Debug APK
        working-directory: android
        run: ./gradlew assembleDebug

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: chongde-general-hr-erp-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
"""

index_html = """<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>崇德總務人力 ERP</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="app-header">
    <div>
      <h1>崇德總務人力 ERP</h1>
      <p class="subtitle">物資庫存・採買調度・人力班表・人員列表（關聯管理）</p>
    </div>
    <div class="header-actions">
      <button type="button" id="btnExport" class="btn btn-light">匯出備份</button>
      <label class="btn btn-light">
        匯入備份
        <input type="file" id="fileImport" accept=".json,application/json" hidden />
      </label>
    </div>
  </header>

  <nav class="tabs" role="tablist">
    <button type="button" class="tab-btn active" data-tab="shifts">總務人力班表</button>
    <button type="button" class="tab-btn" data-tab="inventory">物資庫存</button>
    <button type="button" class="tab-btn" data-tab="requisitions">採買與調度單</button>
    <button type="button" class="tab-btn" data-tab="members">人員列表設定</button>
    <button type="button" class="tab-btn" data-tab="logs">操作紀錄 Log</button>
  </nav>

  <main class="container">
    <section id="alertBannerArea" class="alert-area"></section>

    <section class="toolbar">
      <input type="text" id="searchInput" placeholder="搜尋關鍵字（日期、場次、組別、人員、物資、編號）..." />
      <button type="button" id="btnAdd" class="btn btn-primary">+ 新增資料</button>
    </section>

    <section id="summaryBar" class="summary-bar"></section>

    <section id="contentArea"></section>
  </main>

  <div id="modalBackdrop" class="modal-backdrop hidden">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2 id="modalTitle">新增資料</h2>
        <button type="button" id="btnCloseModal" class="icon-btn" aria-label="關閉">&times;</button>
      </div>
      <form id="crudForm" class="modal-body"></form>
      <div class="modal-footer">
        <button type="button" id="btnCancelModal" class="btn btn-light">取消</button>
        <button type="submit" form="crudForm" class="btn btn-primary">儲存</button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
"""

styles_css = """:root {
  --primary: #7c2d12;
  --primary-hover: #5c200b;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #1e293b;
  --muted: #64748b;
  --border: #e2e8f0;
  --danger: #b91c1c;
  --danger-bg: #fef2f2;
  --danger-border: #fecaca;
  --warn: #b45309;
  --warn-bg: #fffbeb;
  --warn-border: #fde68a;
  --success: #15803d;
  --success-bg: #f0fdf4;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
  background: var(--bg);
  color: var(--text);
}

.app-header {
  background: var(--primary);
  color: #fff;
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 0.85rem;
  opacity: 0.92;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  overflow-x: auto;
  background: #fff;
  border-bottom: 1px solid var(--border);
  padding: 0 12px;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px;
}

.alert-area {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}

.alert-banner {
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid;
  font-size: 0.9rem;
  line-height: 1.5;
}

.alert-danger {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger);
}

.alert-warn {
  background: var(--warn-bg);
  border-color: var(--warn-border);
  color: var(--warn);
}

.alert-title {
  font-weight: 700;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.alert-link {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

#searchInput {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: #fff;
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--muted);
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  margin-top: 4px;
}

.card-list {
  display: grid;
  gap: 10px;
}

.item-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.item-title {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 0.86rem;
  color: var(--muted);
  line-height: 1.5;
}

.member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.member-pill {
  background: #f1f5f9;
  color: var(--text);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.8rem;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f1f5f9;
  color: var(--text);
  margin-right: 4px;
}

.badge-warn {
  background: var(--danger-bg);
  color: var(--danger);
}

.badge-ok {
  background: var(--success-bg);
  color: var(--success);
}

.badge-info {
  background: #eff6ff;
  color: #1d4ed8;
}

.item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.btn {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-light {
  background: #fff;
  color: var(--text);
}

.btn-sm {
  padding: 6px 10px;
  font-size: 0.82rem;
}

.btn-danger {
  background: #fff;
  color: var(--danger);
  border-color: var(--danger-border);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 999;
}

.hidden {
  display: none !important;
}

.modal {
  background: #fff;
  width: 100%;
  max-width: 560px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

.modal-header,
.modal-footer {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer {
  border-top: 1px solid var(--border);
  border-bottom: none;
  justify-content: flex-end;
  gap: 8px;
}

.modal-body {
  padding: 16px 18px;
  max-height: 70vh;
  overflow-y: auto;
  display: grid;
  gap: 12px;
}

.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: #fff;
}

.checkbox-list {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  max-height: 180px;
  overflow-y: auto;
  display: grid;
  gap: 6px;
  background: #fafafa;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.helper-text {
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 4px;
}

.icon-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text);
}
"""

app_js = """(function () {
  var STORAGE_KEY = "CHONGDE_ERP_V2_1";
  var GROUPS = ["總務組", "炊事組", "壇務組", "交通組", "清潔組", "機動組"];
  var ROLES = ["組長", "副組長", "組員", "機動候補"];

  var memoryStore = null;

  function safeGetStorage(key) {
    try {
      if (window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return memoryStore;
  }

  function safeSetStorage(key, val) {
    memoryStore = val;
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {}
  }

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function nowStr() {
    try {
      return new Date().toLocaleString("zh-TW", { hour12: false });
    } catch (e) {
      return new Date().toISOString();
    }
  }

  function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  var DEFAULT_DATA = {
    members: [
      { id: "MBR-001", name: "陳師姐", phone: "0912-345-678", defaultGroup: "炊事組", role: "組長", status: "可支援" },
      { id: "MBR-002", name: "林師兄", phone: "0923-456-789", defaultGroup: "壇務組", role: "組長", status: "可支援" },
      { id: "MBR-003", name: "王總務", phone: "0934-567-890", defaultGroup: "總務組", role: "組長", status: "可支援" },
      { id: "MBR-004", name: "張師姐", phone: "0945-678-901", defaultGroup: "炊事組", role: "組員", status: "可支援" }
    ],
    inventory: [
      { id: "MAT-001", name: "白米（30kg/包）", category: "炊事組", unit: "包", stock: 8, safetyStock: 5, location: "一樓廚房" },
      { id: "MAT-002", name: "香環／供果盤耗材", category: "壇務組", unit: "箱", stock: 2, safetyStock: 4, location: "佛堂庫房" }
    ],
    requisitions: [
      { id: "REQ-001", date: todayStr(), eventName: "秋季兩天一夜法會", type: "採買", inventoryId: "", itemName: "素食食材與調味品", qty: 1, unitPrice: 12500, assignee: "王總務", status: "已核准", stockApplied: false }
    ],
    shifts: [
      { id: "SHF-001", date: todayStr(), eventName: "秋季兩天一夜法會", group: "炊事組", requiredCount: 4, memberIds: ["MBR-001", "MBR-004"], extraMembers: "", status: "人力不足" },
      { id: "SHF-002", date: todayStr(), eventName: "秋季兩天一夜法會", group: "壇務組", requiredCount: 2, memberIds: ["MBR-002"], extraMembers: "", status: "人力不足" }
    ],
    logs: []
  };

  var SCHEMAS = {
    inventory: {
      label: "物資庫存",
      prefix: "MAT",
      fields: [
        { key: "name", label: "物資名稱", type: "text", required: true },
        { key: "category", label: "組別／類別", type: "select", options: GROUPS },
        { key: "unit", label: "單位", type: "text", required: true },
        { key: "stock", label: "目前庫存", type: "number", required: true },
        { key: "safetyStock", label: "安全存量（低於或等於即警示）", type: "number", required: true },
        { key: "location", label: "存放位置", type: "text" }
      ]
    },
    requisitions: {
      label: "採買與調度單",
      prefix: "REQ",
      fields: [
        { key: "date", label: "單據日期", type: "date", required: true },
        { key: "eventName", label: "法會／班程名稱", type: "text", required: true },
        { key: "type", label: "單據類型（完成時：採買＋庫存／領用－庫存）", type: "select", options: ["採買", "領用", "調度"] },
        { key: "inventoryId", label: "關聯庫存物資（選填）", type: "inventorySelect" },
        { key: "itemName", label: "項目／物資說明", type: "text", required: true },
        { key: "qty", label: "數量", type: "number", required: true },
        { key: "unitPrice", label: "單價／金額 (TWD)", type: "number", required: true },
        { key: "assignee", label: "承辦／申請人", type: "memberNameSelect", required: true },
        { key: "status", label: "狀態", type: "select", options: ["待確認", "已核准", "已完成", "已取消"] }
      ]
    },
    shifts: {
      label: "總務人力班表",
      prefix: "SHF",
      fields: [
        { key: "date", label: "排班日期", type: "date", required: true },
        { key: "eventName", label: "法會／班程名稱", type: "text", required: true },
        { key: "group", label: "組別", type: "select", options: GROUPS },
        { key: "requiredCount", label: "需求人數", type: "number", required: true },
        { key: "memberIds", label: "從人員列表選擇排班人員", type: "memberMultiSelect" },
        { key: "extraMembers", label: "其他臨時支援人員（逗號分隔）", type: "text" }
      ]
    },
    members: {
      label: "人員列表",
      prefix: "MBR",
      fields: [
        { key: "name", label: "人員姓名", type: "text", required: true },
        { key: "phone", label: "聯絡電話", type: "text" },
        { key: "defaultGroup", label: "常駐／擅長組別", type: "select", options: GROUPS },
        { key: "role", label: "慣任角色", type: "select", options: ROLES },
        { key: "status", label: "目前狀態", type: "select", options: ["可支援", "暫停排班"] }
      ]
    }
  };

  function loadState() {
    try {
      var raw = safeGetStorage(STORAGE_KEY);
      if (!raw) return cloneObj(DEFAULT_DATA);
      var p = JSON.parse(raw);
      return {
        members: Array.isArray(p.members) ? p.members : cloneObj(DEFAULT_DATA.members),
        inventory: Array.isArray(p.inventory) ? p.inventory : [],
        requisitions: Array.isArray(p.requisitions) ? p.requisitions : [],
        shifts: Array.isArray(p.shifts) ? p.shifts : [],
        logs: Array.isArray(p.logs) ? p.logs : []
      };
    } catch (e) {
      return cloneObj(DEFAULT_DATA);
    }
  }

  var state = loadState();
  var currentTab = "shifts";
  var editingId = null;

  function saveState() {
    safeSetStorage(STORAGE_KEY, JSON.stringify(state));
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addLog(action, tabKey, recordId, summary) {
    state.logs.unshift({
      time: nowStr(),
      action: action,
      table: (SCHEMAS[tabKey] && SCHEMAS[tabKey].label) || "系統關聯",
      id: recordId,
      summary: summary
    });
    if (state.logs.length > 300) state.logs.length = 300;
  }

  function nextId(prefix, list) {
    var n = (list ? list.length : 0) + 1;
    var rnd = Math.floor(10 + Math.random() * 89);
    return prefix + "-" + String(n).padStart(3, "0") + "-" + rnd;
  }

  function getMemberById(id) {
    return state.members.find(function (m) { return m.id === id; });
  }

  function getInventoryById(id) {
    return state.inventory.find(function (i) { return i.id === id; });
  }

  function getShiftAssignedNames(shift) {
    var ids = Array.isArray(shift.memberIds) ? shift.memberIds : [];
    var fromIds = ids.map(function (id) {
      var m = getMemberById(id);
      return m ? m.name : "";
    }).filter(Boolean);

    var extraRaw = String(shift.extraMembers || "");
    var fromExtra = extraRaw.split(/[,，、\n]/).map(function (s) { return s.trim(); }).filter(Boolean);

    var merged = [];
    fromIds.concat(fromExtra).forEach(function (name) {
      if (merged.indexOf(name) === -1) merged.push(name);
    });
    return merged;
  }

  function getUnderstaffedShifts() {
    return state.shifts.map(function (s) {
      var assigned = getShiftAssignedNames(s);
      var req = Math.max(0, Number(s.requiredCount || 0));
      var shortage = Math.max(0, req - assigned.length);
      return Object.assign({}, s, { assignedNames: assigned, requiredCount: req, shortage: shortage });
    }).filter(function (s) { return s.shortage > 0; });
  }

  function getLowStockItems() {
    return state.inventory.filter(function (x) {
      return Number(x.stock) <= Number(x.safetyStock);
    });
  }

  function getMemberShiftCount(memberId) {
    return state.shifts.filter(function (s) {
      return Array.isArray(s.memberIds) && s.memberIds.indexOf(memberId) !== -1;
    }).length;
  }

  function renderAlerts() {
    var area = document.getElementById("alertBannerArea");
    if (!area) return;
    var understaffed = getUnderstaffedShifts();
    var lowStock = getLowStockItems();
    var banners = [];

    if (understaffed.length > 0) {
      var details = understaffed.slice(0, 4).map(function (s) {
        return (s.date || "未定日期") + "・" + s.eventName + "・" + s.group + "（缺 " + s.shortage + " 人，已排 " + s.assignedNames.length + "/" + s.requiredCount + "）";
      }).join("；");
      var more = understaffed.length > 4 ? " 等共 " + understaffed.length + " 個班次" : "";
      banners.push(
        '<div class="alert-banner alert-danger">' +
          '<div class="alert-title">' +
            '<span>⚠️ 人力班表人數不足警示（共 ' + understaffed.length + ' 個班次未滿編）</span>' +
            '<button type="button" class="alert-link" data-jump="shifts">前往排班</button>' +
          '</div>' +
          '<div>' + esc(details + more) + '</div>' +
        '</div>'
      );
    }

    if (lowStock.length > 0) {
      var details2 = lowStock.slice(0, 4).map(function (i) {
        return i.name + "（現存 " + i.stock + " " + i.unit + " / 安全存量 " + i.safetyStock + " " + i.unit + "）";
      }).join("；");
      var more2 = lowStock.length > 4 ? " 等共 " + lowStock.length + " 項物資" : "";
      banners.push(
        '<div class="alert-banner alert-warn">' +
          '<div class="alert-title">' +
            '<span>📦 庫存低於標準警示（共 ' + lowStock.length + ' 項物資需留意）</span>' +
            '<button type="button" class="alert-link" data-jump="inventory">查看庫存</button>' +
          '</div>' +
          '<div>' + esc(details2 + more2) + '</div>' +
        '</div>'
      );
    }

    area.innerHTML = banners.join("");
    area.querySelectorAll("[data-jump]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentTab = btn.getAttribute("data-jump");
        render();
      });
    });
  }

  function renderSummary() {
    var bar = document.getElementById("summaryBar");
    if (!bar) return;
    var understaffedCount = getUnders
