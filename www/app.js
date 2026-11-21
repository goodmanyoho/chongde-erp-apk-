const STORAGE_KEY = "CHONGDE_GENERAL_HR_ERP_V1";

const DEFAULT_DATA = {
  inventory: [
    {
      id: "MAT-001",
      name: "白米（30kg/包）",
      category: "炊事組",
      unit: "包",
      stock: 8,
      safetyStock: 5,
      location: "一樓廚房儲藏室"
    },
    {
      id: "MAT-002",
      name: "香環／供果盤耗材",
      category: "壇務組",
      unit: "箱",
      stock: 3,
      safetyStock: 4,
      location: "佛堂庫房"
    }
  ],
  requisitions: [
    {
      id: "REQ-001",
      eventName: "秋季兩天一夜法會",
      type: "採買",
      itemName: "素食食材與調味品",
      qty: 1,
      unitPrice: 12500,
      assignee: "王總務",
      status: "已核准"
    }
  ],
  shifts: [
    {
      id: "SHF-001",
      eventName: "秋季兩天一夜法會",
      group: "炊事組",
      member: "陳師姐",
      phone: "0912-345-678",
      role: "組長",
      status: "已確認"
    }
  ],
  logs: []
};

const SCHEMAS = {
  inventory: {
    label: "物資庫存",
    prefix: "MAT",
    fields: [
      { key: "name", label: "物資名稱", type: "text", required: true },
      { key: "category", label: "組別／類別", type: "select", options: ["炊事組", "壇務組", "總務組", "清潔組", "交通組"] },
      { key: "unit", label: "單位", type: "text", required: true },
      { key: "stock", label: "目前庫存", type: "number", required: true },
      { key: "safetyStock", label: "安全存量", type: "number", required: true },
      { key: "location", label: "存放位置", type: "text" }
    ]
  },
  requisitions: {
    label: "採買與調度單",
    prefix: "REQ",
    fields: [
      { key: "eventName", label: "法會／班程名稱", type: "text", required: true },
      { key: "type", label: "單據類型", type: "select", options: ["採買", "領用", "調度"] },
      { key: "itemName", label: "項目／物資說明", type: "text", required: true },
      { key: "qty", label: "數量", type: "number", required: true },
      { key: "unitPrice", label: "單價／金額 (TWD)", type: "number", required: true },
      { key: "assignee", label: "承辦／申請人", type: "text", required: true },
      { key: "status", label: "狀態", type: "select", options: ["待確認", "已核准", "已完成", "已取消"] }
    ]
  },
  shifts: {
    label: "總務人力班表",
    prefix: "SHF",
    fields: [
      { key: "eventName", label: "法會／班程名稱", type: "text", required: true },
      { key: "group", label: "組別", type: "select", options: ["總務組", "炊事組", "壇務組", "交通組", "機動組"] },
      { key: "member", label: "人員姓名", type: "text", required: true },
      { key: "phone", label: "聯絡電話", type: "text" },
      { key: "role", label: "角色", type: "select", options: ["組長", "副組長", "組員", "機動候補"] },
      { key: "status", label: "排班狀態", type: "select", options: ["已確認", "待聯繫", "請假／調動"] }
    ]
  }
};

let state = loadState();
let currentTab = "inventory";
let editingId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return {
      inventory: parsed.inventory || [],
      requisitions: parsed.requisitions || [],
      shifts: parsed.shifts || [],
      logs: parsed.logs || []
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addLog(action, tabKey, recordId, summary) {
  const now = new Date().toLocaleString("zh-TW", { hour12: false });
  state.logs.unshift({
    time: now,
    action,
    table: SCHEMAS[tabKey]?.label || tabKey,
    id: recordId,
    summary
  });
  if (state.logs.length > 200) state.logs.length = 200;
}

function nextId(prefix, list) {
  const num = list.length + 1;
  return `${prefix}-${String(num).padStart(3, "0")}-${Math.floor(10 + Math.random() * 89)}`;
}

function render() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === currentTab);
  });

  const isLogTab = currentTab === "logs";
  document.getElementById("btnAdd").classList.toggle("hidden", isLogTab);

  renderSummary();
  if (isLogTab) {
    renderLogs();
  } else {
    renderList();
  }
}

function renderSummary() {
  const bar = document.getElementById("summaryBar");
  const lowStockCount = state.inventory.filter(
    (x) => Number(x.stock) <= Number(x.safetyStock)
  ).length;
  const totalBudget = state.requisitions
    .filter((x) => x.status !== "已取消")
    .reduce((sum, x) => sum + Number(x.qty || 0) * Number(x.unitPrice || 0), 0);
  const confirmedShifts = state.shifts.filter((x) => x.status === "已確認").length;

  bar.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">低於安全存量物資</div>
      <div class="stat-value">${lowStockCount} 項</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">有效採買／調度總額</div>
      <div class="stat-value">$${totalBudget.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">已確認人力班次</div>
      <div class="stat-value">${confirmedShifts} / ${state.shifts.length}</div>
    </div>
  `;
}

function renderList() {
  const area = document.getElementById("contentArea");
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const list = state[currentTab] || [];

  const filtered = list.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(keyword)
  );

  if (filtered.length === 0) {
    area.innerHTML = `<div class="item-card"><div class="item-meta">目前沒有符合的資料，可點擊「+ 新增資料」建立。</div></div>`;
    return;
  }

  area.innerHTML = `<div class="card-list">${filtered.map((item) => renderItemCard(currentTab, item)).join("")}</div>`;

  area.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.edit));
  });

  area.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.delete));
  });
}

function renderItemCard(tab, item) {
  if (tab === "inventory") {
    const isLow = Number(item.stock) <= Number(item.safetyStock);
    return `
      <div class="item-card">
        <div>
          <div class="item-title">
            <span class="badge">${item.id}</span>
            ${escapeHtml(item.name)}
            <span class="badge ${isLow ? "badge-warn" : "badge-ok"}">${isLow ? "低庫存警示" : "庫存正常"}</span>
          </div>
          <div class="item-meta">
            組別：${escapeHtml(item.category)}｜庫存：<strong>${item.stock}</strong> ${escapeHtml(item.unit)}（安全存量：${item.safetyStock}）｜位置：${escapeHtml(item.location || "-")}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-light btn-sm" data-edit="${item.id}">修改</button>
          <button class="btn btn-danger btn-sm" data-delete="${item.id}">刪除</button>
        </div>
      </div>
    `;
  }

  if (tab === "requisitions") {
    const subtotal = Number(item.qty || 0) * Number(item.unitPrice || 0);
    return `
      <div class="item-card">
        <div>
          <div class="item-title">
            <span class="badge">${item.id}</span>
            ${escapeHtml(item.eventName)} — ${escapeHtml(item.itemName)}
            <span class="badge">${escapeHtml(item.status)}</span>
          </div>
          <div class="item-meta">
            類型：${escapeHtml(item.type)}｜數量：${item.qty}｜單價：$${Number(item.unitPrice).toLocaleString()}｜小計：<strong>$${subtotal.toLocaleString()}</strong>｜承辦：${escapeHtml(item.assignee)}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-light btn-sm" data-edit="${item.id}">修改</button>
          <button class="btn btn-danger btn-sm" data-delete="${item.id}">刪除</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="item-card">
      <div>
        <div class="item-title">
          <span class="badge">${item.id}</span>
          ${escapeHtml(item.member)}（${escapeHtml(item.group)}・${escapeHtml(item.role)}）
          <span class="badge">${escapeHtml(item.status)}</span>
        </div>
        <div class="item-meta">
          場次：${escapeHtml(item.eventName)}｜電話：${escapeHtml(item.phone || "-")}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-light btn-sm" data-edit="${item.id}">修改</button>
        <button class="btn btn-danger btn-sm" data-delete="${item.id}">刪除</button>
      </div>
    </div>
  `;
}

function renderLogs() {
  const area = document.getElementById("contentArea");
  if (!state.logs.length) {
    area.innerHTML = `<div class="item-card"><div class="item-meta">尚無操作紀錄。</div></div>`;
    return;
  }
  area.innerHTML = `<div class="card-list">${state.logs
    .map(
      (log) => `
      <div class="item-card">
        <div>
          <div class="item-title"><span class="badge">${escapeHtml(log.action)}</span>${escapeHtml(log.table)} (${escapeHtml(log.id)})</div>
          <div class="item-meta">${escapeHtml(log.time)} — ${escapeHtml(log.summary)}</div>
        </div>
      </div>
    `
    )
    .join("")}</div>`;
}

function openModal(id = null) {
  editingId = id;
  const schema = SCHEMAS[currentTab];
  const existing = id ? state[currentTab].find((x) => x.id === id) : null;

  document.getElementById("modalTitle").textContent = id
    ? `修改${schema.label}（${id}）`
    : `新增${schema.label}`;

  const form = document.getElementById("crudForm");
  form.innerHTML = schema.fields
    .map((f) => {
      const val = existing ? (existing[f.key] ?? "") : "";
      if (f.type === "select") {
        const opts = f.options
          .map(
            (opt) =>
              `<option value="${escapeHtml(opt)}" ${val === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`
          )
          .join("");
        return `<div class="field"><label>${escapeHtml(f.label)}</label><select name="${f.key}">${opts}</select></div>`;
      }
      return `
        <div class="field">
          <label>${escapeHtml(f.label)}</label>
          <input type="${f.type}" name="${f.key}" value="${escapeHtml(String(val))}" ${f.required ? "required" : ""} />
        </div>
      `;
    })
    .join("");

  document.getElementById("modalBackdrop").classList.remove("hidden");
}

function closeModal() {
  editingId = null;
  document.getElementById("modalBackdrop").classList.add("hidden");
}

function handleDelete(id) {
  const list = state[currentTab];
  const target = list.find((x) => x.id === id);
  if (!target) return;
  if (!confirm(`確定要刪除「${id}」這筆資料嗎？`)) return;

  state[currentTab] = list.filter((x) => x.id !== id);
  addLog("刪除", currentTab, id, `已刪除 ${target.name || target.itemName || target.member || id}`);
  saveState();
  render();
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

document.getElementById("crudForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const schema = SCHEMAS[currentTab];
  const formData = new FormData(e.target);
  const record = {};

  schema.fields.forEach((f) => {
    const raw = formData.get(f.key);
    record[f.key] = f.type === "number" ? Number(raw) : String(raw || "").trim();
  });

  if (editingId) {
    record.id = editingId;
    state[currentTab] = state[currentTab].map((x) => (x.id === editingId ? record : x));
    addLog("修改", currentTab, editingId, record.name || record.itemName || record.member || editingId);
  } else {
    record.id = nextId(schema.prefix, state[currentTab]);
    state[currentTab].unshift(record);
    addLog("新增", currentTab, record.id, record.name || record.itemName || record.member || record.id);
  }

  saveState();
  closeModal();
  render();
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentTab = btn.dataset.tab;
    render();
  });
});

document.getElementById("searchInput").addEventListener("input", render);
document.getElementById("btnAdd").addEventListener("click", () => openModal(null));
document.getElementById("btnCloseModal").addEventListener("click", closeModal);
document.getElementById("btnCancelModal").addEventListener("click", closeModal);

document.getElementById("btnExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chongde-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("fileImport").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      if (!imported || typeof imported !== "object") throw new Error("格式錯誤");
      state = {
        inventory: Array.isArray(imported.inventory) ? imported.inventory : [],
        requisitions: Array.isArray(imported.requisitions) ? imported.requisitions : [],
        shifts: Array.isArray(imported.shifts) ? imported.shifts : [],
        logs: Array.isArray(imported.logs) ? imported.logs : []
      };
      addLog("匯入", "inventory", "BACKUP", `還原備份檔：${file.name}`);
      saveState();
      render();
      alert("備份資料已成功匯入！");
    } catch {
      alert("匯入失敗，請確認選擇的是有效的 ERP JSON 備份檔。");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

render();
