const STORAGE_KEY = "CHONGDE_GENERAL_HR_ERP_V2";

const GROUPS = ["總務組", "炊事組", "壇務組", "交通組", "清潔組", "機動組"];
const ROLES = ["組長", "副組長", "組員", "機動候補"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_DATA = {
  members: [
    {
      id: "MBR-001",
      name: "陳師姐",
      phone: "0912-345-678",
      defaultGroup: "炊事組",
      role: "組長",
      status: "可支援"
    },
    {
      id: "MBR-002",
      name: "林師兄",
      phone: "0923-456-789",
      defaultGroup: "壇務組",
      role: "組長",
      status: "可支援"
    },
    {
      id: "MBR-003",
      name: "王總務",
      phone: "0934-567-890",
      defaultGroup: "總務組",
      role: "組長",
      status: "可支援"
    },
    {
      id: "MBR-004",
      name: "張師姐",
      phone: "0945-678-901",
      defaultGroup: "炊事組",
      role: "組員",
      status: "可支援"
    }
  ],
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
      stock: 2,
      safetyStock: 4,
      location: "佛堂庫房"
    }
  ],
  requisitions: [
    {
      id: "REQ-001",
      date: todayStr(),
      eventName: "秋季兩天一夜法會",
      type: "採買",
      inventoryId: "",
      itemName: "素食食材與調味品",
      qty: 1,
      unitPrice: 12500,
      assignee: "王總務",
      status: "已核准",
      stockApplied: false
    }
  ],
  shifts: [
    {
      id: "SHF-001",
      date: todayStr(),
      eventName: "秋季兩天一夜法會",
      group: "炊事組",
      requiredCount: 4,
      memberIds: ["MBR-001", "MBR-004"],
      extraMembers: "",
      status: "人力不足"
    },
    {
      id: "SHF-002",
      date: todayStr(),
      eventName: "秋季兩天一夜法會",
      group: "壇務組",
      requiredCount: 2,
      memberIds: ["MBR-002"],
      extraMembers: "",
      status: "人力不足"
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
      { key: "inventoryId", label: "關聯庫存物資（選填，完成時自動連動庫存）", type: "inventorySelect" },
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
      { key: "requiredCount", label: "需求人數（可隨時調整）", type: "number", required: true },
      { key: "memberIds", label: "從人員列表選擇排班人員", type: "memberMultiSelect" },
      { key: "extraMembers", label: "其他臨時支援人員（選填，多位請用逗號分隔）", type: "text" }
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

let state = loadState();
let currentTab = "shifts";
let editingId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return {
      members: Array.isArray(parsed.members) ? parsed.members : structuredClone(DEFAULT_DATA.members),
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      requisitions: Array.isArray(parsed.requisitions) ? parsed.requisitions : [],
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : []
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
    table: SCHEMAS[tabKey]?.label || "系統關聯",
    id: recordId,
    summary
  });
  if (state.logs.length > 300) state.logs.length = 300;
}

function nextId(prefix, list) {
  const num = list.length + 1;
  return `${prefix}-${String(num).padStart(3, "0")}-${Math.floor(10 + Math.random() * 89)}`;
}

function getMemberById(id) {
  return state.members.find((m) => m.id === id);
}

function getInventoryById(id) {
  return state.inventory.find((i) => i.id === id);
}

function getShiftAssignedNames(shift) {
  const fromIds = (shift.memberIds || [])
    .map((id) => getMemberById(id)?.name)
    .filter(Boolean);
  const fromExtra = String(shift.extraMembers || "")
    .split(/[,，、\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...fromIds, ...fromExtra])];
}

function getUnderstaffedShifts() {
  return state.shifts
    .map((s) => {
      const assigned = getShiftAssignedNames(s);
      const req = Math.max(0, Number(s.requiredCount || 0));
      const shortage = Math.max(0, req - assigned.length);
      return { ...s, assignedNames: assigned, requiredCount: req, shortage };
    })
    .filter((s) => s.shortage > 0);
}

function getLowStockItems() {
  return state.inventory.filter((x) => Number(x.stock) <= Number(x.safetyStock));
}

function getMemberShiftCount(memberId) {
  return state.shifts.filter((s) => Array.isArray(s.memberIds) && s.memberIds.includes(memberId)).length;
}

function renderAlerts() {
  const area = document.getElementById("alertBannerArea");
  const understaffed = getUnderstaffedShifts();
  const lowStock = getLowStockItems();
  const banners = [];

  if (understaffed.length > 0) {
    const details = understaffed
      .slice(0, 4)
      .map((s) => `${s.date || "未定日期"}・${s.eventName}・${s.group}（缺 ${s.shortage} 人，已排 ${s.assignedNames.length}/${s.requiredCount}）`)
      .join("；");
    const moreText = understaffed.length > 4 ? ` 等共 ${understaffed.length} 個班次` : "";
    banners.push(`
      <div class="alert-banner alert-danger">
        <div class="alert-title">
          <span>⚠️ 人力班表人數不足警示（共 ${understaffed.length} 個班次未滿編）</span>
          <button type="button" class="alert-link" data-jump="shifts">前往排班</button>
        </div>
        <div>${escapeHtml(details + moreText)}</div>
      </div>
    `);
  }

  if (lowStock.length > 0) {
    const details = lowStock
      .slice(0, 4)
      .map((i) => `${i.name}（現存 ${i.stock} ${i.unit} / 安全存量 ${i.safetyStock} ${i.unit}）`)
      .join("；");
    const moreText = lowStock.length > 4 ? ` 等共 ${lowStock.length} 項物資` : "";
    banners.push(`
      <div class="alert-banner alert-warn">
        <div class="alert-title">
          <span>📦 庫存低於標準警示（共 ${lowStock.length} 項物資需留意）</span>
          <button type="button" class="alert-link" data-jump="inventory">查看庫存</button>
        </div>
        <div>${escapeHtml(details + moreText)}</div>
      </div>
    `);
  }

  area.innerHTML = banners.join("");
  area.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.jump;
      render();
    });
  });
}

function renderSummary() {
  const bar = document.getElementById("summaryBar");
  const understaffedCount = getUnderstaffedShifts().length;
  const lowStockCount = getLowStockItems().length;
  const totalBudget = state.requisitions
    .filter((x) => x.status !== "已取消")
    .reduce((sum, x) => sum + Number(x.qty || 0) * Number(x.unitPrice || 0), 0);

  bar.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">人力不足班次</div>
      <div class="stat-value">${understaffedCount} 班</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">低於安全存量物資</div>
      <div class="stat-value">${lowStockCount} 項</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">有效採買／調度總額</div>
      <div class="stat-value">$${totalBudget.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">人員列表人數</div>
      <div class="stat-value">${state.members.length} 位</div>
    </div>
  `;
}

function render() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === currentTab);
  });

  const isLogTab = currentTab === "logs";
  const addBtn = document.getElementById("btnAdd");
  addBtn.classList.toggle("hidden", isLogTab);
  if (!isLogTab && SCHEMAS[currentTab]) {
    addBtn.textContent = `+ 新增${SCHEMAS[currentTab].label}`;
  }

  renderAlerts();
  renderSummary();

  if (isLogTab) {
    renderLogs();
  } else {
    renderList();
  }
}

function renderList() {
  const area = document.getElementById("contentArea");
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const list = state[currentTab] || [];

  const filtered = list.filter((item) => {
    const extraNames =
      currentTab === "shifts" ? getShiftAssignedNames(item).join(" ") : "";
    const linkedInv =
      currentTab === "requisitions" && item.inventoryId
        ? getInventoryById(item.inventoryId)?.name || ""
        : "";
    return `${JSON.stringify(item)} ${extraNames} ${linkedInv}`.toLowerCase().includes(keyword);
  });

  if (filtered.length === 0) {
    area.innerHTML = `<div class="item-card"><div class="item-meta">目前沒有符合的資料，可點擊上方「+ 新增」按鈕建立。</div></div>`;
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
  if (tab === "shifts") {
    const assignedNames = getShiftAssignedNames(item);
    const req = Math.max(0, Number(item.requiredCount || 0));
    const shortage = Math.max(0, req - assignedNames.length);
    const isShort = shortage > 0;

    const chipsHtml = assignedNames.length
      ? `<div class="member-chips">${assignedNames.map((n) => `<span class="member-pill">👤 ${escapeHtml(n)}</span>`).join("")}</div>`
      : `<div class="member-chips"><span class="member-pill">尚未指派人員</span></div>`;

    return `
      <div class="item-card">
        <div>
          <div class="item-title">
            <span class="badge">${item.id}</span>
            ${escapeHtml(item.date || "未定日期")}｜${escapeHtml(item.eventName)} — ${escapeHtml(item.group)}
            <span class="badge ${isShort ? "badge-warn" : "badge-ok"}">
              ${isShort ? `缺 ${shortage} 人（${assignedNames.length}/${req}）` : `已滿編（${assignedNames.length}/${req}）`}
            </span>
          </div>
          <div class="item-meta">
            需求人數：<strong>${req}</strong> 人｜已排人數：<strong>${assignedNames.length}</strong> 人
          </div>
          ${chipsHtml}
        </div>
        <div class="item-actions">
          <button class="btn btn-light btn-sm" data-edit="${item.id}">修改／調度</button>
          <button class="btn btn-danger btn-sm" data-delete="${item.id}">刪除</button>
        </div>
      </div>
    `;
  }

  if (tab === "inventory") {
    const isLow = Number(item.stock) <= Number(item.safetyStock);
    const linkedReqs = state.requisitions.filter(
      (r) => r.inventoryId === item.id || r.itemName === item.name
    );
    return `
      <div class="item-card">
        <div>
          <div class="item-title">
            <span class="badge">${item.id}</span>
            ${escapeHtml(item.name)}
            <span class="badge ${isLow ? "badge-warn" : "badge-ok"}">${isLow ? "低於標準警示" : "庫存正常"}</span>
          </div>
          <div class="item-meta">
            組別：${escapeHtml(item.category)}｜現存：<strong>${item.stock}</strong> ${escapeHtml(item.unit)}（安全存量：${item.safetyStock} ${escapeHtml(item.unit)}）｜位置：${escapeHtml(item.location || "-")}｜關聯單據：${linkedReqs.length} 筆
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
    const linkedInv = item.inventoryId ? getInventoryById(item.inventoryId) : null;
    const syncBadge = item.stockApplied
      ? `<span class="badge badge-ok">已連動庫存</span>`
      : `<span class="badge badge-info">未連動庫存</span>`;

    return `
      <div class="item-card">
        <div>
          <div class="item-title">
            <span class="badge">${item.id}</span>
            ${escapeHtml(item.date || "未定日期")}｜${escapeHtml(item.eventName)} — ${escapeHtml(item.itemName)}
            <span class="badge">${escapeHtml(item.status)}</span>
            ${syncBadge}
          </div>
          <div class="item-meta">
            類型：${escapeHtml(item.type)}｜數量：${item.qty}｜單價：$${Number(item.unitPrice).toLocaleString()}｜小計：<strong>$${subtotal.toLocaleString()}</strong>｜承辦：${escapeHtml(item.assignee)}
            ${linkedInv ? `｜關聯庫存：${escapeHtml(linkedInv.name)}（現存 ${linkedInv.stock} ${escapeHtml(linkedInv.unit)}）` : ""}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-light btn-sm" data-edit="${item.id}">修改</button>
          <button class="btn btn-danger btn-sm" data-delete="${item.id}">刪除</button>
        </div>
      </div>
    `;
  }

  const assignedCount = getMemberShiftCount(item.id);
  return `
    <div class="item-card">
      <div>
        <div class="item-title">
          <span class="badge">${item.id}</span>
          ${escapeHtml(item.name)}（${escapeHtml(item.defaultGroup)}・${escapeHtml(item.role)}）
          <span class="badge ${item.status === "可支援" ? "badge-ok" : "badge-warn"}">${escapeHtml(item.status)}</span>
        </div>
        <div class="item-meta">
          電話：${escapeHtml(item.phone || "-")}｜已排班次：<strong>${assignedCount}</strong> 場
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
      let val = existing ? existing[f.key] : "";
      if (!existing && f.type === "date") val = todayStr();
      if (!existing && f.key === "requiredCount") val = 3;

      if (f.type === "select") {
        const opts = f.options
          .map(
            (opt) =>
              `<option value="${escapeHtml(opt)}" ${val === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`
          )
          .join("");
        return `<div class="field"><label>${escapeHtml(f.label)}</label><select name="${f.key}">${opts}</select></div>`;
      }

      if (f.type === "inventorySelect") {
        const opts = [
          `<option value="">-- 不關聯既有庫存 --</option>`,
          ...state.inventory.map(
            (inv) =>
              `<option value="${escapeHtml(inv.id)}" ${val === inv.id ? "selected" : ""}>${escapeHtml(inv.name)}（現存 ${inv.stock} ${escapeHtml(inv.unit)}）</option>`
          )
        ].join("");
        return `<div class="field"><label>${escapeHtml(f.label)}</label><select name="${f.key}" id="reqInventorySelect">${opts}</select></div>`;
      }

      if (f.type === "memberNameSelect") {
        const memberNames = state.members.map((m) => m.name);
        const hasCurrent = val && !memberNames.includes(val);
        const opts = [
          ...(hasCurrent ? [`<option value="${escapeHtml(val)}" selected>${escapeHtml(val)}（自訂）</option>`] : []),
          ...memberNames.map(
            (name) => `<option value="${escapeHtml(name)}" ${val === name ? "selected" : ""}>${escapeHtml(name)}</option>`
          ),
          ...(memberNames.length === 0 ? [`<option value="總務幹部">總務幹部</option>`] : [])
        ].join("");
        return `<div class="field"><label>${escapeHtml(f.label)}</label><select name="${f.key}">${opts}</select></div>`;
      }

      if (f.type === "memberMultiSelect") {
        const selectedIds = Array.isArray(val) ? val : [];
        if (!state.members.length) {
          return `<div class="field"><label>${escapeHtml(f.label)}</label><div class="helper-text">尚未建立人員列表，請先至「人員列表設定」新增人員，或於下方填寫其他支援人員。</div></div>`;
        }
        const boxes = state.members
          .map((m) => {
            const checked = selectedIds.includes(m.id) ? "checked" : "";
            const shiftsCnt = getMemberShiftCount(m.id);
            return `
              <label class="checkbox-item">
                <input type="checkbox" name="memberIds" value="${escapeHtml(m.id)}" ${checked} />
                <span>${escapeHtml(m.name)}（${escapeHtml(m.defaultGroup)}・${escapeHtml(m.role)}・已排 ${shiftsCnt} 場）</span>
              </label>
            `;
          })
          .join("");
        return `
          <div class="field">
            <label>${escapeHtml(f.label)}</label>
            <div class="checkbox-list">${boxes}</div>
            <div class="helper-text">勾選人員後系統會自動計算已排人數與缺額。</div>
          </div>
        `;
      }

      return `
        <div class="field">
          <label>${escapeHtml(f.label)}</label>
          <input type="${f.type}" name="${f.key}" value="${escapeHtml(String(val ?? ""))}" ${f.required ? "required" : ""} />
        </div>
      `;
    })
    .join("");

  // 選擇關聯庫存物資時，若項目說明空白則自動帶入物資名稱
  const invSelect = document.getElementById("reqInventorySelect");
  if (invSelect) {
    invSelect.addEventListener("change", () => {
      const chosen = getInventoryById(invSelect.value);
      const itemInput = form.querySelector('input[name="itemName"]');
      if (chosen && itemInput &&
