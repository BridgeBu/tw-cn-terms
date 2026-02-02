// app.js
(function () {
  const cfg = window.APP_CONFIG || {};
  const qEl = document.getElementById("q");
  const catEl = document.getElementById("cat");
  const lvlEl = document.getElementById("lvl");
  const rowsEl = document.getElementById("rows");
  const countEl = document.getElementById("count");
  const clearEl = document.getElementById("clear");
  const refreshEl = document.getElementById("refresh");
  const submitEl = document.getElementById("submit");

  const noteTitleEl = document.getElementById("noteTitle");
  const noteBodyEl = document.getElementById("noteBody");
  const verEl = document.getElementById("ver");

  const terms = Array.isArray(window.TERMS) ? window.TERMS.slice() : [];

  const lvlRank = { high: 3, mid: 2, low: 1 };
  const lvlName = { high: "高", mid: "中", low: "低" };

  const s2tMap = cfg.S2T_MAP || {};
  const allowSimp = !!(cfg.SEARCH && cfg.SEARCH.ALLOW_SIMP_INPUT);
  const minLen = (cfg.SEARCH && Number.isFinite(cfg.SEARCH.MIN_QUERY_LEN)) ? cfg.SEARCH.MIN_QUERY_LEN : 1;

  function toTradLoose(input) {
    let out = String(input || "");
    for (const [s, t] of Object.entries(s2tMap)) {
      out = out.split(s).join(t);
    }
    return out;
  }

  function uniq(arr) {
    return [...new Set(arr)].filter(Boolean);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function buildCategoryOptions() {
    const cats = uniq(terms.map(t => t.cat)).sort((a,b)=>a.localeCompare(b, "zh-Hant"));
    for (const c of cats) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      catEl.appendChild(opt);
    }
  }

  function matchTerm(t, q) {
    if (!q) return true;
    const qq = q.toLowerCase();
    const hay = `${t.cat} ${t.tw} ${t.cn} ${t.note}`.toLowerCase();
    return hay.includes(qq);
  }

  function lvlBadge(lvl) {
    const cls = lvl === "high" ? "lvl-high" : (lvl === "mid" ? "lvl-mid" : "lvl-low");
    return `<span class="badge badge-lvl ${cls}">${lvlName[lvl] || "—"}</span>`;
  }

  function render(list) {
    const html = list.map(t => {
      return `
        <tr>
          <td><span class="badge">${escapeHtml(t.cat)}</span></td>
          <td>${lvlBadge(t.lvl)}</td>
          <td>${escapeHtml(t.tw)}</td>
          <td>${escapeHtml(t.cn)}</td>
          <td class="muted">${escapeHtml(t.note || "")}</td>
        </tr>
      `;
    }).join("");

    rowsEl.innerHTML = html || `
      <tr>
        <td colspan="5" class="muted" style="padding:18px 12px;">
          沒找到匹配項。試試其他關鍵字，或使用右上角「我要提交新詞條」。
        </td>
      </tr>
    `;

    countEl.textContent = `${list.length} 條`;
  }

  function apply() {
    const rawQ = qEl.value.trim();
    const cat = catEl.value;
    const lvl = lvlEl.value;

    const effectiveQ = (rawQ.length >= minLen) ? rawQ : "";
    const q1 = effectiveQ;
    const q2 = (allowSimp && effectiveQ) ? toTradLoose(effectiveQ) : "";

    let filtered = terms.filter(t => {
      const okC = (cat === "all") ? true : t.cat === cat;
      const okL = (lvl === "all") ? true : t.lvl === lvl;
      const okQ = (!effectiveQ) ? true : (matchTerm(t, q1) || (q2 && matchTerm(t, q2)));
      return okC && okL && okQ;
    });

    filtered.sort((a,b) => (lvlRank[b.lvl] || 0) - (lvlRank[a.lvl] || 0));
    render(filtered);
  }

  function setupNote() {
    if (noteTitleEl && cfg.SITE_NOTE_TITLE) noteTitleEl.textContent = cfg.SITE_NOTE_TITLE;
    if (noteBodyEl) noteBodyEl.textContent = cfg.SITE_NOTE || "";
    if (verEl) verEl.textContent = cfg.VERSION || "—";
  }

  function setupSubmitButton() {
    if (!submitEl) return;
    const email = (cfg.SUBMIT && cfg.SUBMIT.EMAIL) ? cfg.SUBMIT.EMAIL : "lbudd655@gmail.com";
    const subject = (cfg.SUBMIT && cfg.SUBMIT.SUBJECT) ? cfg.SUBMIT.SUBJECT : "兩岸用語對照 - 新增/修正詞條";
    const body = (cfg.SUBMIT && cfg.SUBMIT.BODY_TEMPLATE) ? cfg.SUBMIT.BODY_TEMPLATE : "";

    const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    submitEl.setAttribute("href", href);
  }

  function setupForceRefresh() {
    if (!refreshEl) return;
    refreshEl.addEventListener("click", () => {
      // 强制绕过缓存：加时间戳参数
      const url = new URL(window.location.href);
      url.searchParams.set("_ts", String(Date.now()));
      window.location.replace(url.toString());
    });
  }

  function init() {
    setupNote();
    setupSubmitButton();
    setupForceRefresh();

    buildCategoryOptions();
    terms.sort((a,b) => (lvlRank[b.lvl] || 0) - (lvlRank[a.lvl] || 0));
    render(terms);

    qEl.addEventListener("input", apply);
    catEl.addEventListener("change", apply);
    lvlEl.addEventListener("change", apply);

    clearEl.addEventListener("click", () => {
      qEl.value = "";
      catEl.value = "all";
      lvlEl.value = "all";
      apply();
      qEl.focus();
    });
  }

  init();
})();