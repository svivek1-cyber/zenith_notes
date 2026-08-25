const config = require("../config/env");

function toPlainText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function analyzeNote(body) {
  const plainText = toPlainText(body);
  if (!plainText)
    return {
      summary: "This note does not contain enough text to summarize yet.",
      actionItems: [],
    };
  if (!config.groqApiKey)
    throw Object.assign(
      new Error(
        "AI summary is not configured. Add GROQ_API_KEY to backend/.env.",
      ),
      { status: 503 },
    );

  const response = await fetch(config.groqApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Return JSON with exactly two keys: summary (a concise genuine summary) and actionItems (an array of concise task strings). Do not copy the note verbatim.",
        },
        {
          role: "user",
          content: `Analyze and summarize this note, what are written there:\n\n${plainText}`,
        },
      ],
    }),
  });
  if (!response.ok) {
    const providerError = await response.text();
    let message = `The AI summary provider returned ${response.status}`;
    try {
      const details = JSON.parse(providerError);
      message = details.error?.message || message;
    } catch (error) {
      if (providerError) message = providerError;
    }
    throw Object.assign(new Error(message), { status: 502 });
  }
  const data = await response.json();
  try {
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return {
      summary: String(result.summary || "No summary was returned."),
      actionItems: Array.isArray(result.actionItems)
        ? result.actionItems.map(String).slice(0, 10)
        : [],
    };
  } catch (error) {
    throw Object.assign(new Error("The AI summary response was invalid"), {
      status: 502,
    });
  }
}

module.exports = { analyzeNote };
