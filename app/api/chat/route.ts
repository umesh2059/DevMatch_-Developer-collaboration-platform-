// Route Handler backing the chatbot widget (components/chatbot.tsx). Proxies
// to Groq's OpenAI-compatible chat completions API so the API key never
// reaches the browser.
import { NextResponse, type NextRequest } from "next/server";
import { ChatRequestSchema } from "@/lib/validation";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT =
  "You are the DevMatch assistant, a helpful chatbot embedded in the DevMatch " +
  "app (a site for developers to find collaborators, form teams, and manage " +
  "projects). Answer the user's question directly and concisely. You can " +
  "help with questions about DevMatch or general questions on any topic.";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The chatbot is not configured yet." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...parsed.data.messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
  } catch (error) {
    console.error("Groq API request failed", error);
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Groq API error", response.status, detail);
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== "string") {
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }

  return NextResponse.json({ reply });
}
