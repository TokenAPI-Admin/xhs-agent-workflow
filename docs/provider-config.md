# Provider Config

This project is configured to use the user's local CPA / CLI proxy endpoint,
not the official OpenAI endpoint.

## Endpoint

```text
OPENAI_BASE_URL=http://127.0.0.1:8318/v1
```

The API key must be stored only in local `.env` files or deployment secrets.
Never commit it to Git.

## Available Models

Text / agent models:

- `g5.3` - GPT 5.3 Codex
- `gpt-5.3-codex-spark` - GPT 5.3 Codex Spark
- `gpt-5.4` - GPT 5.4
- `gpt-5.4-mini` - GPT 5.4 Mini
- `gpt-5.5` - GPT 5.5
- `codex-auto-review` - Codex Auto Review

Image model:

- `gpt-image-2` - GPT Image 2

## Railway Note

`127.0.0.1` points to the current machine/container. On Railway, this URL will
not reach a proxy running on the user's local Windows machine. For Railway
deployment, either:

- run the CPA proxy as a Railway service in the same project,
- expose the proxy through a secure reachable URL, or
- keep model execution on a VPS/local worker and let Railway host only the UI/API.
