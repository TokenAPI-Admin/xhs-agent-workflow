import { chatJson } from "./modelClient.js";

const DEFAULT_INPUT = {
  audience: "20-35岁女生",
  positioning: "普通人生也能精致生活",
  goal: "新账号第一条单封面涨粉笔记",
  topic: "用低成本生活秩序感，让普通日子看起来更精致",
  tone: "真实、温柔、有一点行动力，不鸡汤，不炫富",
};

const employees = [
  "DeerFlow: 情报和调度",
  "agents: 专业内容团队和评审团队",
  "prompt-optimizer: 提示词工程",
  "image: 生图员工",
  "Letta: 长期记忆",
  "Codex: 调度负责人",
];

function normalizeInput(input = {}) {
  return {
    ...DEFAULT_INPUT,
    ...Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== "")),
  };
}

function fallbackWorkflow(input) {
  const hook = "普通女生想把日子过精致，真的不用先变有钱";
  return {
    mode: "fallback",
    generatedAt: new Date().toISOString(),
    input,
    employees,
    brief: {
      positioning: input.positioning,
      audience: input.audience,
      selectedAngle: "低成本精致生活不是买更多，而是把每天重复的小事做得更顺手、更好看。",
      growthLogic: "新账号第一条先建立可信人设和持续关注理由，让用户觉得后面会有稳定、可复制的生活方法。",
    },
    titles: [
      "普通女生的精致感，不是靠花钱堆出来的",
      "低成本精致生活：我先改掉了这5个小习惯",
      "月薪普通，也能把日子过得很有质感",
      "别再等有钱了，精致生活可以从今天开始",
      "20-35岁女生，先把生活调顺再说",
      "我发现真正显贵的女生，都有这种生活秩序感",
      "普通人生也能精致：从这张清单开始",
      "不炫富、不鸡汤，普通女生的精致生活模板",
    ],
    chosenTitle: "普通女生的精致感，不是靠花钱堆出来的",
    cover: {
      headline: hook,
      subline: "5个低成本秩序感小动作",
      visualDirection: "暖白卧室或小餐桌，晨光，干净桌面，一杯水、笔记本、护手霜、帆布包，真实生活感，留出上方大字区域。",
      imagePrompt: "生成一张小红书单封面，竖版 3:4。画面是20-35岁普通女生的低成本精致生活场景：暖白小房间或餐桌，晨光自然光，干净桌面，水杯、笔记本、护手霜、帆布包、平价鲜花，不炫富，真实温柔，有生活秩序感。画面上方留白用于大标题，色彩奶白、鼠尾草绿、淡粉，清爽高级。不要出现品牌logo，不要夸张奢侈品，不要文字。",
    },
    note: {
      opener: "以前我总觉得，精致生活是有钱以后才配谈的事。后来才发现，真正让人状态变好的，往往不是买了多贵的东西，而是生活里那些很小、但每天都能托住自己的秩序感。",
      body: [
        "1. 出门包固定一套小物：纸巾、润唇膏、充电线、发圈、便携香。不是为了装精致，是为了不狼狈。",
        "2. 每晚花3分钟把第二天要穿的衣服挂出来。早上少一次慌乱，整个人都会稳很多。",
        "3. 桌面只留当天会用的东西。普通房间变好看的最快方法，不是买收纳，而是减少视觉噪音。",
        "4. 给自己准备一个固定的下班仪式：洗手、换衣服、倒一杯水、开一盏小灯。日子会从“被消耗”变成“被接住”。",
        "5. 不追求全套变美，只先维护一个细节。比如头发干净、指甲修齐、鞋子擦干净。普通女生的质感，很多时候就藏在这些地方。",
      ],
      closer: "如果你也在过一种很普通、但还想认真对待自己的生活，可以先收藏这份清单。这个账号会继续分享普通女生也能做到的精致生活方法，不炫富，不鸡汤，只讲能落地的小改变。",
      cta: "你最想先改哪一个生活小习惯？评论区留一个数字，我下一篇直接展开写。",
      tags: ["小红书涨粉", "精致生活", "普通女生", "生活方式", "自我提升", "低成本改造", "生活秩序感", "女生独居", "日常变美"],
    },
    review: {
      contentReviewer: "通过：正文有真实场景和可复制动作，避免空泛鸡汤。",
      growthReviewer: "通过：结尾明确承诺后续内容，形成关注理由。",
      visualReviewer: "通过：封面聚焦情绪和身份，不依赖奢侈品。",
      riskReviewer: "低风险：无医疗、金融、绝对化承诺。",
    },
    nextPost: "下一条建议接：普通女生下班后的20分钟变精致流程。",
  };
}

export async function runWorkflow(rawInput = {}) {
  const input = normalizeInput(rawInput);
  const system = [
    "你是一个小红书内容生产工作流的总调度系统。",
    "你要模拟这些员工协作：DeerFlow 做情报和调度，agents 做内容和评审，prompt-optimizer 做提示词优化，image 做单封面生图提示词，Letta 记录长期记忆。",
    "目标是为新账号产出一条单封面的涨粉笔记，不依赖账号历史。",
    "受众是20-35岁女生，方向是普通人生也能精致生活。",
    "不要生成虚假搜索事实。没有搜索key时，用平台常识和内容判断完成冷启动方案。",
  ].join("\n");
  const user = JSON.stringify({ input, requiredOutput: "title candidates, chosen title, cover copy, image prompt, note body, tags, review, next post" }, null, 2);

  try {
    const result = await chatJson({
      system,
      user,
      temperature: 0.8,
      schemaHint: "Use keys: mode, generatedAt, input, employees, brief, titles, chosenTitle, cover, note, review, nextPost.",
    });
    return {
      ...fallbackWorkflow(input),
      ...result,
      mode: "model",
      generatedAt: new Date().toISOString(),
      input,
      employees,
    };
  } catch (error) {
    const fallback = fallbackWorkflow(input);
    fallback.modelWarning = error instanceof Error ? error.message : String(error);
    return fallback;
  }
}
