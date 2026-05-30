const DEFAULT_TIMEOUT_MS = 45000;

export async function chatJson({ system, user, schemaHint, temperature = 0.7, model }) {
  const baseUrl = process.env.OPENAI_BASE_URL || "http://127.0.0.1:8318/v1";
  const apiKey = process.env.OPENAI_API_KEY;
  const selectedModel = model || process.env.DEFAULT_TEXT_MODEL || "gpt-5.4";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.MODEL_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${system}\n\nReturn valid JSON only. ${schemaHint || ""}` },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Model request failed ${response.status}: ${text.slice(0, 500)}`);
    }
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Model response had no message content");
    return JSON.parse(content);
  } finally {
    clearTimeout(timeout);
  }
}
