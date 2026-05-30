import { runWorkflow } from "../src/workflow.js";

const result = await runWorkflow({
  audience: "20-35岁女生",
  positioning: "普通人生也能精致生活",
  goal: "新账号第一条单封面涨粉笔记",
});

if (!result.chosenTitle || !result.cover?.imagePrompt || !result.note?.body?.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  mode: result.mode,
  chosenTitle: result.chosenTitle,
  coverHeadline: result.cover.headline,
  tags: result.note.tags?.slice(0, 5),
}, null, 2));
