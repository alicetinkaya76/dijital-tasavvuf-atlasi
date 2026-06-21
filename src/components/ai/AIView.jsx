import { useState, useRef, useEffect, useCallback } from 'react';
import { useUI } from '../../ui-context.jsx';
import { Gloss, LangBadge, Icons } from '../shared/ui.jsx';
import { AI_ENABLED, RETRIEVAL_K, DAILY_LIMIT } from '../../config/ai.js';
import { loadSearchEngine, search as runSearch } from './searchEngine.js';
import { buildMessages } from './promptBuilder.js';
import { askLLM } from './llmClient.js';

const LS_COUNT = 'tasavvuf.ai.count';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function getCount() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_COUNT) || '{}');
    return raw.day === todayKey() ? raw.n : 0;
  } catch { return 0; }
}
function bumpCount() {
  try {
    const n = getCount() + 1;
    localStorage.setItem(LS_COUNT, JSON.stringify({ day: todayKey(), n }));
    return n;
  } catch { return 0; }
}

export default function AIView() {
  const { t, lang, num } = useUI();
  const [messages, setMessages] = useState([]); // {role, text, sources?, fallback?}
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const ask = useCallback(async (question) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);

    try {
      await loadSearchEngine();
      const chunks = runSearch(q, RETRIEVAL_K);

      if (!AI_ENABLED) {
        // graceful degradation — return retrieved passages directly
        setMessages((m) => [...m, { role: 'assistant', fallback: true, sources: chunks }]);
        setBusy(false);
        return;
      }

      if (getCount() >= DAILY_LIMIT) {
        setMessages((m) => [...m, { role: 'assistant', text: t('ai.limitReached'), sources: chunks, fallback: true }]);
        setBusy(false);
        return;
      }

      const out = await askLLM(buildMessages(lang, q, chunks));
      bumpCount();
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: out.answer || '',
          relevant: out.relevant,
          sources: chunks,
          llmSources: out.sources || [],
        },
      ]);
    } catch (e) {
      const code = String(e.message || '');
      let text = t('ai.errorGeneric');
      if (code === 'AI_UNAVAILABLE') {
        // shouldn't reach here (AI_ENABLED guards it), but degrade anyway
        const chunks = runSearch(q, RETRIEVAL_K);
        setMessages((m) => [...m, { role: 'assistant', fallback: true, sources: chunks }]);
        setBusy(false);
        return;
      }
      if (code === 'RATE_LIMIT') text = t('ai.limitReached');
      setMessages((m) => [...m, { role: 'assistant', text, error: true }]);
    } finally {
      setBusy(false);
    }
  }, [busy, lang, t]);

  return (
    <div className="lens ai-lens">
      <header className="lens-header">
        <h1 className="lens-title">{t('nav.rehber')}</h1>
        <p className="lens-sub">{t('lensDesc.rehber')}</p>
      </header>

      {/* the guardrail is stated up-front, as a gloss */}
      <Gloss eyebrow={t('ai.title')} lang={lang}>{t('ai.disclaimer')}</Gloss>

      {!AI_ENABLED && (
        <p className="ai-nokey">{t('ai.noKey')}</p>
      )}

      <div className="ai-thread" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="ai-suggestions">
            {(t('ai.suggestions') || []).map((s, i) => (
              <button key={i} className="ai-suggest" onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div className="ai-msg ai-user" key={i}>{m.text}</div>
          ) : (
            <div className={`ai-msg ai-assistant ${m.error ? 'ai-error' : ''}`} key={i}>
              {m.fallback && !m.text && (
                <p className="ai-fallback-head muted">{t('ai.searchFallback')}</p>
              )}
              {m.text && <p className="ai-answer">{m.text}</p>}

              {/* retrieved corpus passages = the verifiable substrate */}
              {m.sources?.length > 0 && (
                <div className="ai-sources">
                  <span className="section-eyebrow">{t('ai.sources')}</span>
                  <ul>
                    {m.sources.map((c, j) => (
                      <li className="ai-source" key={j}>
                        <div className="ai-source-head">
                          <span className="ai-source-title">{lang === 'tr' ? c.ttr : c.ten}</span>
                          <span className="muted">{lang === 'tr' ? c.atr : c.aen} · <span className="num">{num(c.ah)}</span> {t('units.ah')}</span>
                          <LangBadge lang={c.lang} />
                        </div>
                        <p className={`ai-source-snippet ${c.lang === 'per' ? 'script-fa' : 'script-ar'}`} lang={c.lang === 'per' ? 'fa' : 'ar'} dir="rtl">
                          {c.t.slice(0, 200)}…
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}

        {busy && (
          <div className="ai-msg ai-assistant">
            <p className="loading-line"><span className="spinner" /> {AI_ENABLED ? t('ai.thinking') : t('ai.thinking')}</p>
          </div>
        )}
      </div>

      <form
        className="ai-composer"
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
      >
        <input
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('ai.placeholder')}
          dir="auto"
          disabled={busy}
        />
        <button className="btn primary ai-send" type="submit" disabled={busy || !input.trim()}>
          {t('ai.ask')} <Icons.arrow />
        </button>
      </form>
    </div>
  );
}
