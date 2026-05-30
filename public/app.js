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

function render(result) {
  $("status").textContent = result.chosenTitle || "已生成";
  $("mode").textContent = result.mode || "done";
  const body = Array.isArray(result.note?.body) ? result.note.body : [];
  $("output").innerHTML = `
    <section class="cover">
      <div>
        <div class="cover-title">${escapeHtml(result.cover?.headline || result.chosenTitle)}</div>
        <p class="cover-sub">${escapeHtml(result.cover?.subline || "")}</p>
      </div>
      <div>${escapeHtml(result.cover?.visualDirection || "")}</div>
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
