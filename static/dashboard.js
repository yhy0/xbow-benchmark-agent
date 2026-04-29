/**
 * Benchmark Dashboard — frontend logic v2
 * Fetches from /api/v1/dashboard/* and renders into DOM.
 */

const API = "/api/v1/dashboard";
let currentAgent = "";
let refreshTimer = null;

// ---------------------------------------------------------------------------
// SVG icon helpers
// ---------------------------------------------------------------------------

const SVG = {
  check: '<svg class="icon-svg" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  x: '<svg class="icon-svg" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  clock: '<svg class="icon-svg" style="width:14px;height:14px" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  alert: '<svg class="icon-svg" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  loader: '<svg class="icon-svg" style="width:14px;height:14px" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
  goldMedal: '<svg style="width:18px;height:18px" viewBox="0 0 24 24"><circle cx="12" cy="15" r="6" fill="#fbbf24" stroke="#fbbf24" stroke-width="1"/><path d="M8.5 2h7l-1.5 6h-4L8.5 2z" fill="#fbbf24" opacity="0.6"/></svg>',
  silverMedal: '<svg style="width:18px;height:18px" viewBox="0 0 24 24"><circle cx="12" cy="15" r="6" fill="#94a3b8" stroke="#94a3b8" stroke-width="1"/><path d="M8.5 2h7l-1.5 6h-4L8.5 2z" fill="#94a3b8" opacity="0.6"/></svg>',
  bronzeMedal: '<svg style="width:18px;height:18px" viewBox="0 0 24 24"><circle cx="12" cy="15" r="6" fill="#d97706" stroke="#d97706" stroke-width="1"/><path d="M8.5 2h7l-1.5 6h-4L8.5 2z" fill="#d97706" opacity="0.6"/></svg>',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function n(v) { return v == null ? 0 : v; }

function fmtDuration(sec) {
  if (sec == null || sec <= 0) return "--";
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

function fmtCost(usd) {
  if (usd == null || usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function fmtTokens(val) {
  const num = n(val);
  if (num === 0) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
  return String(num);
}

const STATUS_CFG = {
  success: { icon: SVG.check,  cls: "badge-success", label: "OK",   dotColor: "var(--color-success)" },
  failure: { icon: SVG.x,     cls: "badge-failure", label: "FAIL", dotColor: "var(--color-danger)" },
  running: { icon: SVG.loader, cls: "badge-running", label: "RUN",  dotColor: "var(--color-info)" },
  timeout: { icon: SVG.clock, cls: "badge-timeout", label: "T/O",  dotColor: "var(--color-warning)" },
  error:   { icon: SVG.alert, cls: "badge-error",   label: "ERR",  dotColor: "oklch(0.7 0.15 80)" },
};

function statusBadge(status) {
  const s = STATUS_CFG[status] || { icon: "", cls: "badge-pending", label: status || "---", dotColor: "var(--color-muted-foreground)" };
  const animate = status === "running" ? " animation: pulse 2s infinite;" : "";
  return `<span class="badge ${s.cls}">
    <span class="badge-dot" style="background:${s.dotColor};${animate}"></span>
    ${s.icon} ${s.label}
  </span>`;
}

function rankMedal(i) {
  if (i === 0) return SVG.goldMedal;
  if (i === 1) return SVG.silverMedal;
  if (i === 2) return SVG.bronzeMedal;
  return `<span style="color:var(--color-muted-foreground)">${i + 1}</span>`;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  return resp.json();
}

// ---- Agents ----
async function loadAgents() {
  const data = await fetchJSON(`${API}/agents`);
  const container = document.getElementById("agent-tabs");
  let html = `<button class="agent-chip ${currentAgent === "" ? "active" : ""}" data-agent="">All Agents</button>`;
  for (const name of data.agents) {
    html += `<button class="agent-chip ${currentAgent === name ? "active" : ""}" data-agent="${name}">${name}</button>`;
  }
  container.innerHTML = html;
  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      currentAgent = btn.dataset.agent;
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      refresh();
    });
  });
}

// ---- Summary ----
async function loadSummary() {
  const qs = currentAgent ? `?agent_name=${encodeURIComponent(currentAgent)}` : "";
  const d = await fetchJSON(`${API}/summary${qs}`);

  const total = n(d.total);
  const solved = n(d.solved);
  const failed = n(d.failed);
  const timeout = n(d.timeout);
  const errors = n(d.errors);
  const running = n(d.running);

  document.getElementById("stat-solved").textContent = `${solved} / ${total}`;
  document.getElementById("stat-score").textContent = n(d.score);
  document.getElementById("stat-cost").textContent = fmtCost(d.total_cost);
  document.getElementById("stat-avg-time").textContent = fmtDuration(d.avg_duration);
  document.getElementById("stat-tokens").textContent = fmtTokens(d.total_tokens);
  document.getElementById("stat-running").textContent = running;

  // Progress bar
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  document.getElementById("progress-pct").textContent = `${pct}%`;
  document.getElementById("progress-fill").style.width = `${pct}%`;

  // Legend
  document.getElementById("progress-legend").innerHTML = `
    <span class="legend-item"><span class="dot dot-success"></span>Solved ${solved}</span>
    <span class="legend-item"><span class="dot dot-failure"></span>Failed ${failed}</span>
    <span class="legend-item"><span class="dot dot-timeout"></span>Timeout ${timeout}</span>
    <span class="legend-item"><span class="dot dot-error"></span>Error ${errors}</span>
    <span class="legend-item"><span class="dot dot-running"></span>Running ${running}</span>
  `;
}

// ---- Leaderboard ----
async function loadLeaderboard() {
  const data = await fetchJSON(`${API}/leaderboard`);
  const tbody = document.getElementById("leaderboard-body");

  if (!data.leaderboard.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No agents yet — start a benchmark run!</td></tr>`;
    return;
  }

  tbody.innerHTML = data.leaderboard.map((r, i) => `
    <tr>
      <td class="col-rank">${rankMedal(i)}</td>
      <td><span class="agent-tag">${r.agent_name}</span></td>
      <td class="col-num">${n(r.solved)} / ${n(r.total)}</td>
      <td class="col-num">${n(r.score)}</td>
      <td class="col-num">${fmtCost(r.total_cost)}</td>
      <td class="col-num">${fmtTokens(r.total_tokens)}</td>
    </tr>
  `).join("");
}

// ---- Runs ----
async function loadRuns() {
  const qs = currentAgent ? `?agent_name=${encodeURIComponent(currentAgent)}` : "";
  const data = await fetchJSON(`${API}/runs${qs}`);
  const tbody = document.getElementById("runs-body");

  const titleSpan = document.querySelector("#runs-title span");
  titleSpan.textContent = currentAgent
    ? `${currentAgent} Challenges (${data.runs.length})`
    : `All Challenges (${data.runs.length})`;

  if (!data.runs.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No runs recorded yet — waiting for data...</td></tr>`;
    return;
  }

  let html = "";
  for (const r of data.runs) {
    const hasError = r.error_message && r.status !== "success";
    html += `<tr data-id="${r.id}" ${hasError ? 'class="has-error"' : ""}>
      <td class="col-rank">${String(n(r.benchmark_num)).padStart(3, "0")}</td>
      <td style="font-family:var(--font-mono);font-size:0.8rem">${r.benchmark_id || "--"}</td>
      <td><span class="agent-tag">${r.agent_name || "--"}</span></td>
      <td>${statusBadge(r.status)}</td>
      <td class="col-num">${fmtDuration(r.duration_seconds)}</td>
      <td class="col-num">${fmtCost(r.cost_usd)}</td>
      <td class="col-num">${fmtTokens(r.token_count)}</td>
      <td class="col-flag">${r.found_flag ? '<span class="flag-yes">&#10003;</span>' : '<span class="flag-no">-</span>'}</td>
    </tr>`;
    if (hasError) {
      html += `<tr class="error-row" style="display:none" data-error-for="${r.id}">
        <td colspan="8">${SVG.alert} ${r.error_message}</td>
      </tr>`;
    }
  }
  tbody.innerHTML = html;

  // Toggle error rows
  tbody.querySelectorAll("tr.has-error").forEach(tr => {
    tr.addEventListener("click", () => {
      const err = tbody.querySelector(`tr[data-error-for="${tr.dataset.id}"]`);
      if (err) err.style.display = err.style.display === "none" ? "" : "none";
    });
  });
}

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

async function refresh() {
  try {
    await Promise.all([loadAgents(), loadSummary(), loadLeaderboard(), loadRuns()]);
    document.getElementById("last-update").textContent =
      `Updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error("Dashboard refresh error:", err);
    document.getElementById("last-update").textContent = `Error: ${err.message}`;
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(refresh, 10_000);
  const el = document.getElementById("footer-status");
  if (el) el.textContent = "ON";
}

function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  const el = document.getElementById("footer-status");
  if (el) el.textContent = "OFF";
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("auto-refresh");
  toggle.addEventListener("change", () => {
    toggle.checked ? startAutoRefresh() : stopAutoRefresh();
  });
  refresh();
  startAutoRefresh();
});
