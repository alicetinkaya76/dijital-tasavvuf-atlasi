/**
 * Provider-agnostic LLM client (OpenAI-compatible /chat/completions).
 * Configured via src/config/ai.js (env-driven). Throws AI_UNAVAILABLE when
 * no key is present so the UI can degrade to search-only.
 */

import { LLM_KEY, LLM_URL, LLM_MODEL, MAX_RESPONSE_TOKENS, TEMPERATURE } from '../../config/ai.js';

export async function askLLM(messages) {
  if (!LLM_KEY) throw new Error('AI_UNAVAILABLE');

  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LLM_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: TEMPERATURE,
      max_tokens: MAX_RESPONSE_TOKENS,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (res.status === 401) throw new Error('AUTH_ERROR');
    throw new Error(`LLM_ERROR_${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('EMPTY_RESPONSE');

  try {
    return JSON.parse(content);
  } catch {
    return { answer: content, relevant: true, sources: [] };
  }
}
