const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function list(items = []) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function tags(items = []) {
  return `<div class="tag-list">${items.map((item) => `<span class="tag">#${escapeHtml(item)}</span>`).join("")}</div>`;
}

function coverSvgDataUrl(result) {
  const headline = escapeHtml(result.cover?.headline || result.chosenTitle || "");
  const subline = escapeHtml(result.cover?.subline || "");
  const headlineLines = String(result.cover?.headline || result.chosenTitle || "")
    .match(/.{1,12}/g)
    ?.slice(0, 4)
    .map((line, index) => `<tspan x="132" dy="${index === 0 ? 0 : 82}">${escapeHtml(line)}</tspan>`)
    .join("") || "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf3eb"/>
      <stop offset="0.48" stop-color="#dceee4"/>
      <stop offset="1" stop-color="#f5d9e2"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#18342d" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <circle cx="745" cy="160" r="92" fill="#ffffff" opacity="0.46"/>
  <circle cx="128" cy="976" r="140" fill="#ffffff" opacity="0.36"/>
  <rect x="86" y="116" width="728" height="968" rx="36" fill="#fffaf3" opacity="0.82" filter="url(#shadow)"/>
  <rect x="132" y="750" width="636" height="210" rx="28" fill="#eaf5ee"/>
  <rect x="174" y="790" width="210" height="28" rx="14" fill="#d2e7da"/>
  <rect x="174" y="842" width="390" height="22" rx="11" fill="#d2e7da"/>
  <rect x="174" y="888" width="300" height="22" rx="11" fill="#d2e7da"/>
  <text x="132" y="260" fill="#17332d" font-size="66" font-weight="900" font-family="Microsoft YaHei, Arial, sans-serif">
    ${headlineLines}
  </text>
  <text x="132" y="560" fill="#b3476b" font-size="34" font-weight="800" font-family="Microsoft YaHei, Arial, sans-serif">${subline}</text>
  <text x="132" y="1028" fill="#42665c" font-size="28" font-weight="700" font-family="Microsoft YaHei, Arial, sans-serif">普通人生也能精致生活</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function render(result) {
  $("status").textContent = result.chosenTitle || "已生成";
  $("mode").textContent = result.mode || "done";
  const body = Array.isArray(result.note?.body) ? result.note.body : [];
  const coverUrl = coverSvgDataUrl(result);
  $("output").innerHTML = `
    <section class="cover">
      <div>
        <div class="cover-title">${escapeHtml(result.cover?.headline || result.chosenTitle)}</div>
        <p class="cover-sub">${escapeHtml(result.cover?.subline || "")}</p>
      </div>
      <div>
        <p>${escapeHtml(result.cover?.visualDirection || "")}</p>
        <a class="download-cover" download="xhs-cover.svg" href="${coverUrl}">下载单封面 SVG</a>
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <h3>员工调度</h3>
        ${list(result.employees)}
      </div>
      <div class="card">
        <h3>涨粉逻辑</h3>
        <p>${escapeHtml(result.brief?.growthLogic)}</p>
        <p><strong>选题：</strong>${escapeHtml(result.brief?.selectedAngle)}</p>
      </div>
    </section>

    <section class="card">
      <h3>标题候选</h3>
      ${list(result.titles)}
    </section>

    <section class="card note">
      <h3>正文</h3>
      <p>${escapeHtml(result.note?.opener)}</p>
      ${body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      <p>${escapeHtml(result.note?.closer)}</p>
      <p><strong>评论引导：</strong>${escapeHtml(result.note?.cta)}</p>
      ${tags(result.note?.tags)}
    </section>

    <section class="grid">
      <div class="card">
        <h3>单封面生图 Prompt</h3>
        <pre>${escapeHtml(result.cover?.imagePrompt)}</pre>
      </div>
      <div class="card">
        <h3>专业评审</h3>
        ${list(Object.values(result.review || {}))}
        <p><strong>下一条：</strong>${escapeHtml(result.nextPost)}</p>
      </div>
    </section>

    ${result.modelWarning ? `<section class="card"><h3>模型状态</h3><pre>${escapeHtml(result.modelWarning)}</pre></section>` : ""}
  `;
}

async function run() {
  const button = $("run");
  button.disabled = true;
  $("status").textContent = "员工执行中";
  $("mode").textContent = "running";
  $("output").innerHTML = `<div class="empty">DeerFlow 侦察、agents 创作评审、prompt-optimizer 优化工单、image 生成封面提示、Letta 记录策略...</div>`;

  try {
    const response = await fetch("/api/workflow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        audience: $("audience").value,
        positioning: $("positioning").value,
        goal: $("goal").value,
        topic: $("topic").value,
        tone: $("tone").value,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || "request failed");
    render(result);
  } catch (error) {
    $("status").textContent = "生成失败";
    $("mode").textContent = "error";
    $("output").innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  } finally {
    button.disabled = false;
  }
}

$("run").addEventListener("click", run);
