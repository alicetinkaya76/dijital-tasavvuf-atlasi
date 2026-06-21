/**
 * AI rehber — configuration
 * =========================
 * Provider-agnostic: any OpenAI-compatible chat endpoint works.
 * Defaults to Groq's free tier (llama-3.3-70b-versatile).
 *
 * Configure in .env (see .env.example):
 *   VITE_LLM_KEY    — API key. If blank, the AI lens degrades gracefully:
 *                     full-text search + retrieval still work; only the
 *                     generated synthesis step is disabled.
 *   VITE_LLM_URL    — endpoint (OpenAI-compatible /chat/completions)
 *   VITE_LLM_MODEL  — model id
 *
 * Vite exposes import.meta.env.VITE_* at build time. .env is git-ignored.
 */

export const LLM_KEY = import.meta.env.VITE_LLM_KEY || '';
export const LLM_URL =
  import.meta.env.VITE_LLM_URL || 'https://api.groq.com/openai/v1/chat/completions';
export const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'llama-3.3-70b-versatile';

// AI generation is enabled only when a key is present.
export const AI_ENABLED = Boolean(LLM_KEY);

export const MAX_RESPONSE_TOKENS = 1100;
export const TEMPERATURE = 0.25;
export const RETRIEVAL_K = 6; // chunks injected as context per question
export const DAILY_LIMIT = 30; // soft per-browser cap (localStorage)
