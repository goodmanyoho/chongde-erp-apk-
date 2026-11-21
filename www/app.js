(function () {
  var STORAGE_KEY = "CHONGDE_SIMPLE_HR_ERP_V1";
  var memoryFallback = null;

  function readStorage() {
    try {
      if (window.localStorage) {
        return window.localStorage.getItem(STORAGE_KEY);
      }
    } catch (e) {}
    return memoryFallback;
  }

  function writeStorage(val) {
    memoryFallback = val;
    try {
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, val);
      }
    } catch (e) {}
  }

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var DEFAULT_STATE = {
    members: [
      { id: "M-01", name: "陳師姐", phone: "0912-345-678", note: "炊事／總務" },
      { id: "M-02", name: "林師兄", phone: "0923-456-789", note: "壇務／接待" },
      { id: "M-03", name: "王總務", phone: "0934-567-890", note: "器材／場地" }
    ],
    activities: [
      {
        id: "ACT-01",
        title: "初一十五大典總務支援",
        date: todayStr(),
        requiredCount: 3,
        workContent: "佛堂桌椅擺設、茶水點心準備、環境清潔",
        memberIds: ["M-01", "M-02"],
        checkedInIds: ["M-01"]
      }
    ],
    savedTitles: ["初一十五大典總務支援", "兩天一夜法會服務", "道場環境整理"],
    savedWorks: ["佛堂桌椅擺設、茶水點心準備、環境清潔", "廚房炊事備餐與餐具清洗", "交通引導與報到接待"]
  };

  function loadState() {
    try {
      var raw = readStorage();
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      var p = JSON.parse(raw);
      return {
        members: Array.isArray(p.members) ? p.members : [],
        activities: Array.isArray(p.activities) ? p.activities : [],
        savedTitles: Array.isArray(p.savedTitles) ? p.savedTitles : DEFAULT_STATE.savedTitles.slice(),
        savedWorks: Array.isArray(p.savedWorks) ? p.savedWorks : DEFAULT_STATE.savedWorks.slice()
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  var state = loadState();
  var currentTab = "activities";
  var editingId = null;

  function saveState() {
    writeStorage(JSON.stringify(state));
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString().slice(-5) + Math.floor(10 + Math.random() * 89);
  }

  function getMember(id) {
    return state.members.find(function (m) { return m.id === id; });
  }

  function getValidMemberIds(act) {
    var ids = Array.isArray(act.memberIds) ? act.memberIds : [];
    return ids.filter(function (id) { return Boolean(getMember(id)); });
  }

  function getValidCheckedInIds(act) {
    var validMembers = getValidMemberIds(act);
    var checked = Array.isArray(act.checkedInIds) ? act.checkedInIds : [];
    return checked.filter(function (id) { return validMembers.indexOf(id) !== -1; });
  }

  function getShortageActivities() {
    return state.activities.map(function (act) {
      var assigned = getValidMemberIds(act);
      var req = Math.max(1, Number(act.requiredCount || 1));
      var shortage = Math.max(0, req - assigned.length);
      return Object.assign({}, act, {
        assignedCount: assigned.length,
        requiredCount: req,
        shortage: shortage
      });
    }).filter(function (a) { return a.shortage > 0; });
  }

  function renderAlerts() {
    var area = document.getElementById("alertArea");
    if (!area) return;
    var shortList = getShortageActivities();
    if (!shortList.length) {
      area.innerHTML = "";
      return;
    }

    var lines = shortList.map(function (a) {
      return esc(a.date) + "「" + esc(a.title) + "」缺 " + a.shortage + " 人（已排 " + a.assignedCount + "/" + a.requiredCount + " 人）";
    }).join("；");

    area.innerHTML =
      '<div class="alert-banner">' +
        '<div class="alert-title">⚠️ 活動人數未滿提醒警示（共 ' + shortList.length + ' 場缺人）</div>' +
        '<div>' + lines + '</div>' +
      '</div>';
  }

  function renderSummary() {
    var area = document.getElementById("summaryArea");
    if (!area) return;

    var totalActs = state.activities.length;
    var shortCount = getShortageActivities().length;
    var totalReq = 0;
    var totalAssigned = 0;
    var totalCheckedIn = 0;

    state.activities.forEach(function (act) {
      totalReq += Math.max(1, Number(act.requiredCount || 1));
      totalAssigned += getValidMemberIds(act).length;
      totalCheckedIn += getValidCheckedInIds(act).length;
    });

    area.innerHTML =
      '<div class="stat-card">' +
        '<div class="stat-label">活動總場次</div>' +
        '<div class="stat-value">' + totalActs + ' 場</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-label">人數未滿場次</div>' +
        '<div class="stat-value ' + (shortCount > 0 ? "stat-danger" : "stat-ok") + '">' + shortCount + ' 場</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-label">已排／需求總人數</div>' +
        '<div class="stat-value">' + totalAssigned + ' / ' + totalReq + ' 人</div>' +
      '</div>' +
      '<div class="stat-card">' +
        '<div class="stat-label">當日已復確到場</div>' +
        '<div class="stat-value stat-ok">' + totalCheckedIn + ' / ' + totalAssigned + ' 人</div>' +
      '</div>';
  }

  function render() {
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === currentTab);
    });

    var btnAdd = document.getElementById("btnAdd");
    if (btnAdd) {
      btnAdd.textContent = currentTab === "activities" ? "+ 新增活動" : "+ 新增人員";
    }

    renderAlerts();
    renderSummary();

    if (currentTab === "activities") {
      renderActivities();
    } else {
      renderMembers();
    }
  }

  function renderActivities() {
    var area = document.getElementById("listArea");
    if (!area) return;
    var kw = (document.getElementById("searchInput").value || "").trim().toLowerCase();

    var filtered = state.activities.filter(function (act) {
      var names = getValidMemberIds(act).map(function (id) {
        var m = getMember(id);
        return m ? (m.name + " " + m.phone) : "";
      }).join(" ");
      var text = (act.date + " " + act.title + " " + act.workContent + " " + names).toLowerCase();
      return text.indexOf(kw) !== -1;
    });

    if (!filtered.length) {
      area.innerHTML = '<div class="item-card"><div class="item-meta">目前沒有活動紀錄，請點擊右上角「+ 新增活動」建立。</div></div>';
      return;
    }

    area.innerHTML = '<div class="card-list">' + filtered.map(function (act) {
      var assignedIds = getValidMemberIds(act);
      var checkedIds = getValidCheckedInIds(act);
      var req = Math.max(1, Number(act.requiredCount || 1));
      var shortage = Math.max(0, req - assignedIds.length);
      var isShort = shortage > 0;

      var checkinHtml = assignedIds.length
        ? '<div class="checkin-list">' + assignedIds.map(function (mid) {
            var m = getMember(mid);
            var isChecked = checkedIds.indexOf(mid) !== -1;
            return (
              '<div class="checkin-row">' +
                '<div class="checkin-info">' +
                  '<strong>' + esc(m.name) + '</strong>' +
                  '<span class="checkin-phone">📞 ' + esc(m.phone || "未填電話") + '</span>' +
                '</div>' +
                '<button type="button" class="btn-checkin ' + (isChecked ? "checked" : "") + '" data-checkin-act="' + esc(act.id) + '" data-checkin-member="' + esc(mid) + '">' +
                  (isChecked ? "✓ 當日已到場" : "點擊復確到場") +
                '</button>' +
              '</div>'
            );
          }).join("") + '</div>'
        : '<div class="checkin-list"><div class="helper-text">尚未指派人員，請按「修改」從人員登錄勾選。</div></div>';

      return (
        '<div class="item-card">' +
          '<div class="card-top">' +
            '<div>' +
              '<div class="item-title">' +
                esc(act.date) + '｜' + esc(act.title) +
                ' <span class="badge ' + (isShort ? "badge-warn" : "badge-ok") + '">' +
                  (isShort ? ("缺 " + shortage + " 人（" + assignedIds.length + "/" + req + "）") : ("已滿編（" + assignedIds.length + "/" + req + "）")) +
                '</span>' +
              '</div>' +
              '<div class="item-meta">' +
                '需求人數：<strong>' + req + '</strong> 人｜已排：<strong>' + assignedIds.length + '</strong> 人｜當日復確到場：<strong>' + checkedIds.length + '</strong> 人' +
              '</div>' +
            '</div>' +
            '<div class="item-actions">' +
              '<button type="button" class="btn btn-light btn-sm" data-edit="' + esc(act.id) + '">修改</button>' +
              '<button type="button" class="btn btn-danger btn-sm" data-delete="' + esc(act.id) + '">刪除</button>' +
            '</div>' +
          '</div>' +
          '<div class="work-box"><strong>工作內容：</strong>' + esc(act.workContent || "無") + '</div>' +
          checkinHtml +
        '</div>'
      );
    }).join("") + '</div>';

    area.querySelectorAll("[data-checkin-act]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        toggleCheckin(btn.getAttribute("data-checkin-act"), btn.getAttribute("data-checkin-member"));
      });
    });

    area.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-edit"));
      });
    });

    area.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteItem(btn.getAttribute("data-delete"));
      });
    });
  }

  function renderMembers() {
    var area = document.getElementById("listArea");
    if (!area) return;
    var kw = (document.getElementById("searchInput").value || "").trim().toLowerCase();

    var filtered = state.members.filter(function (m) {
      return (m.name + " " + m.phone + " " + (m.note || "")).toLowerCase().indexOf(kw) !== -1;
    });

    if (!filtered.length) {
      area.innerHTML = '<div class="item-card"><div class="item-meta">尚無人員資料，請點擊「+ 新增人員」建立名冊。</div></div>';
      return;
    }

    area.innerHTML = '<div class="card-list">' + filtered.map(function (m) {
      var actCount = state.activities.filter(function (a) {
        return getValidMemberIds(a).indexOf(m.id) !== -1;
      }).length;

      return (
        '<div class="item-card">' +
          '<div class="card-top">' +
            '<div>' +
              '<div class="item-title">👤 ' + esc(m.name) + ' <span class="badge">已排 ' + actCount + ' 場</span></div>' +
              '<div class="item-meta">聯繫電話：<strong>' + esc(m.phone) + '</strong>' + (m.note ? ('｜備註：' + esc(m.note)) : '') + '</div>' +
            '</div>' +
            '<div class="item-actions">' +
              '<button type="button" class="btn btn-light btn-sm" data-edit="' + esc(m.id) + '">修改</button>' +
              '<button type="button" class="btn btn-danger btn-sm" data-delete="' + esc(m.id) + '">刪除</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("") + '</div>';

    area.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-edit"));
      });
    });

    area.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteItem(btn.getAttribute("data-delete"));
      });
    });
  }

  function toggleCheckin(actId, memberId) {
    var act = state.activities.find(function (a) { return a.id === actId; });
    if (!act) return;
    if (!Array.isArray(act.checkedInIds)) act.checkedInIds = [];
    var idx = act.checkedInIds.indexOf(memberId);
    if (idx === -1) {
      act.checkedInIds.push(memberId);
    } else {
      act.checkedInIds.splice(idx, 1);
    }
    saveState();
    render();
  }

  function openModal(id) {
    editingId = id || null;
    var form = document.getElementById("mainForm");
    var titleEl = document.getElementById("modalTitle");

    if (currentTab === "members") {
      var existingM = editingId ? getMember(editingId) : null;
      titleEl.textContent = existingM ? "修改人員資料" : "新增人員登錄";
      form.innerHTML =
        '<div class="field">' +
          '<label>人員姓名 *</label>' +
          '<input type="text" name="name" value="' + esc(existingM ? existingM.name : "") + '" required placeholder="例如：陳師姐" />' +
        '</div>' +
        '<div class="field">' +
          '<label>聯繫電話 *</label>' +
          '<input type="tel" name="phone" value="' + esc(existingM ? existingM.phone : "") + '" required placeholder="例如：0912-345-678" />' +
        '</div>' +
        '<div class="field">' +
          '<label>擅長組別／備註（選填）</label>' +
          '<input type="text" name="note" value="' + esc(existingM ? existingM.note : "") + '" placeholder="例如：炊事組、可假日支援" />' +
        '</div>';
    } else {
      var existingA = editingId ? state.activities.find(function (a) { return a.id === editingId; }) : null;
      titleEl.textContent = existingA ? "修改活動排班" : "新增活動排班";

      var titleChips = state.savedTitles.map(function (t) {
        return '<button type="button" class="preset-chip" data-fill-title="' + esc(t) + '">' + esc(t) + '</button>';
      }).join("");

      var workChips = state.savedWorks.map(function (w) {
        return '<button type="button" class="preset-chip" data-fill-work="' + esc(w) + '">' + esc(w) + '</button>';
      }).join("");

      var selectedIds = existingA ? getValidMemberIds(existingA) : [];
      var memberBoxes = state.members.length
        ? state.members.map(function (m) {
            var checked = selectedIds.indexOf(m.id) !== -1 ? "checked" : "";
            return (
              '<label class="checkbox-item">' +
                '<input type="checkbox" name="memberIds" value="' + esc(m.id) + '" ' + checked + ' />' +
                '<span>' + esc(m.name) + '（' + esc(m.phone) + (m.note ? '・' + esc(m.note) : '') + '）</span>' +
              '</label>'
            );
          }).join("")
        : '<div class="helper-text">尚未建立人員，請先切換到「人員登錄管理」新增人員。</div>';

      form.innerHTML =
        '<div class="field">' +
          '<label>活動名稱 *（可直接輸入或點下方歷史選項）</label>' +
          '<input type="text" name="title" id="actTitleInput" value="' + esc(existingA ? existingA.title : "") + '" required placeholder="輸入活動名稱，儲存後會自動加入選項" />' +
          '<div class="preset-chips">' + titleChips + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label>設定日期 *</label>' +
          '<input type="date" name="date" value="' + esc(existingA ? existingA.date : todayStr()) + '" required />' +
        '</div>' +
        '<div class="field">' +
          '<label>需求人員數量 *</label>' +
          '<input type="number" name="requiredCount" min="1" value="' + esc(existingA ? existingA.requiredCount : 3) + '" required />' +
        '</div>' +
        '<div class="field">' +
          '<label>工作內容 *（可直接輸入或點下方歷史選項）</label>' +
          '<textarea name="workContent" id="actWorkInput" rows="2" required placeholder="輸入工作內容，儲存後會自動加入選項">' + esc(existingA ? existingA.workContent : "") + '</textarea>' +
          '<div class="preset-chips">' + workChips + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label>選擇排班人員（勾選人員登錄名單）</label>' +
          '<div class="checkbox-list">' + memberBoxes + '</div>' +
        '</div>';

      form.querySelectorAll("[data-fill-title]").forEach(function (chip) {
        chip.addEventListener("click", function () {
          document.getElementById("actTitleInput").value = chip.getAttribute("data-fill-title");
        });
      });

      form.querySelectorAll("[data-fill-work]").forEach(function (chip) {
        chip.addEventListener("click", function () {
          document.getElementById("actWorkInput").value = chip.getAttribute("data-fill-work");
        });
      });
    }

    document.getElementById("modalBackdrop").classList.remove("hidden");
  }

  function closeModal() {
    editingId = null;
    document.getElementById("modalBackdrop").classList.add("hidden");
  }

  function deleteItem(id) {
    if (!window.confirm("確定要刪除這筆資料嗎？")) return;
    if (currentTab === "members") {
      state.members = state.members.filter(function (m) { return m.id !== id; });
      state.activities.forEach(function (a) {
        a.memberIds = (a.memberIds || []).filter(function (mid) { return mid !== id; });
        a.checkedInIds = (a.checkedInIds || []).filter(function (mid) { return mid !== id; });
      });
    } else {
      state.activities = state.activities.filter(function (a) { return a.id !== id; });
    }
    saveState();
    render();
  }

  function bindEvents() {
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentTab = btn.getAttribute("data-tab");
        render();
      });
    });

    document.getElementById("searchInput").addEventListener("input", render);
    document.getElementById("btnAdd").addEventListener("click", function () { openModal(null); });
    document.getElementById("btnCloseModal").addEventListener("click", closeModal);
    document.getElementById("btnCancelModal").addEventListener("click", closeModal);

    document.getElementById("mainForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);

      if (currentTab === "members") {
        var name = String(fd.get("name") || "").trim();
        var phone = String(fd.get("phone") || "").trim();
        var note = String(fd.get("note") || "").trim();
        if (!name || !phone) return;

        if (editingId) {
          state.members = state.members.map(function (m) {
            return m.id === editingId ? { id: m.id, name: name, phone: phone, note: note } : m;
          });
        } else {
          state.members.unshift({ id: makeId("M"), name: name, phone: phone, note: note });
        }
      } else {
        var title = String(fd.get("title") || "").trim();
        var date = String(fd.get("date") || todayStr()).trim();
        var requiredCount = Math.max(1, Number(fd.get("requiredCount") || 1));
        var workContent = String(fd.get("workContent") || "").trim();
        var memberIds = fd.getAll("memberIds").map(String);

        if (title && state.savedTitles.indexOf(title) === -1) {
          state.savedTitles.unshift(title);
          if (state.savedTitles.length > 20) state.savedTitles.length = 20;
        }
        if (workContent && state.savedWorks.indexOf(workContent) === -1) {
          state.savedWorks.unshift(workContent);
          if (state.savedWorks.length > 20) state.savedWorks.length = 20;
        }

        if (editingId) {
          state.activities = state.activities.map(function (a) {
            if (a.id !== editingId) return a;
            var keptCheckins = (a.checkedInIds || []).filter(function (cid) {
              return memberIds.indexOf(cid) !== -1;
            });
            return {
              id: a.id,
              title: title,
              date: date,
              requiredCount: requiredCount,
              workContent: workContent,
              memberIds: memberIds,
              checkedInIds: keptCheckins
            };
          });
        } else {
          state.activities.unshift({
            id: makeId("ACT"),
            title: title,
            date: date,
            requiredCount: requiredCount,
            workContent: workContent,
            memberIds: memberIds,
            checkedInIds: []
          });
        }
      }

      saveState();
      closeModal();
      render();
    });

    document.getElementById("btnExport").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.
