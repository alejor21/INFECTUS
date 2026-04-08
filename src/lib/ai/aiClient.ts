export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: 'groq' | 'openrouter';
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_AI_ERROR = 'AI service temporarily unavailable';

async function parseContent(res: Response): Promise<string> {
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function callAI(
  messages: AIMessage[],
  options?: { model?: string; maxTokens?: number },
): Promise<AIResponse> {
  const maxTokens = options?.maxTokens ?? 1024;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY as
    | string
    | undefined;

  if (groqKey) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: options?.model ?? 'llama-3.1-8b-instant',
          messages,
          max_tokens: maxTokens,
        }),
      });

      if (res.ok) {
        return { content: await parseContent(res), provider: 'groq' };
      }

      if (!openRouterKey) {
        throw new Error(DEFAULT_AI_ERROR);
      }
    } catch {
      if (!openRouterKey) {
        throw new Error(DEFAULT_AI_ERROR);
      }
    }
  }

  if (!openRouterKey) {
    throw new Error(DEFAULT_AI_ERROR);
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey}`,
      'HTTP-Referer': 'https://infectus.vercel.app',
      'X-Title': 'Infectus PROA',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (res.ok) {
    return { content: await parseContent(res), provider: 'openrouter' };
  }

  throw new Error(DEFAULT_AI_ERROR);
}
