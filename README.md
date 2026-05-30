# XHS Agent Workflow

一个面向小红书冷启动内容的工作流生产台。当前目标是跑通：

```text
DeerFlow = 情报和调度
agents = 专业内容团队和评审团队
prompt-optimizer = 提示词工程
image = 生图员工
Letta = 长期记忆
Codex = 调度负责人
```

第一版聚焦一个可验证场景：为「20-35岁女生，普通人生也能精致生活」的新账号产出一条单封面涨粉笔记。

## Run

```bash
npm start
```

Smoke test:

```bash
npm run smoke
```

## Model Provider

The app uses an OpenAI-compatible CPA / CLI proxy through environment variables:

```text
OPENAI_BASE_URL=http://127.0.0.1:8318/v1
OPENAI_API_KEY=...
DEFAULT_TEXT_MODEL=gpt-5.4
FAST_TEXT_MODEL=gpt-5.4-mini
DEFAULT_IMAGE_MODEL=gpt-image-2
```

Real keys must be stored in `.env` locally or Railway Variables. Do not commit secrets.

## Railway

This app has no npm dependencies. Railway can run it with:

```bash
npm start
```

Important: `127.0.0.1` inside Railway points to the Railway container, not the user's Windows machine. For model execution on Railway, the CPA proxy must be reachable from Railway or deployed as a service in the same project.
