"use client";

import { FormEvent, useState } from 'react';

type ChatApiResponse = {
  success: boolean;
  error?: string;
  data?: {
    ok: boolean;
    blocked: boolean;
    needsRewrite: boolean;
    action: 'SAFE' | 'FLAGGED' | 'ESCALATED';
    reply: string;
    traceId: string;
    queuedItemId?: string;
    moderation: {
      riskScore: number;
      riskLevel: string;
      confidence: number;
      policyTags: string[];
      escalationPriority: string;
      slaMinutes: number;
    };
  };
};

type ChatTurn = {
  role: 'user' | 'assistant';
  text: string;
};

export default function ChatDemoPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [meta, setMeta] = useState('');

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;

    setLoading(true);
    setMeta('');
    setTurns((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');

    try {
      const response = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: 'demo-user-1',
          sessionId: 'demo-session-1',
        }),
      });

      const payload = (await response.json()) as ChatApiResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Chat response failed.');
      }

      const d = payload.data;
      setTurns((prev) => [...prev, { role: 'assistant', text: d.reply }]);
      setMeta(
        `action=${d.action} | risk=${d.moderation.riskScore} | confidence=${d.moderation.confidence} | trace=${d.traceId}${
          d.queuedItemId ? ` | queued=${d.queuedItemId}` : ''
        }`
      );
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Chat response failed.';
      setTurns((prev) => [...prev, { role: 'assistant', text }]);
      setMeta('request_failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>Chat Integration Demo</h1>
        <p className="muted" style={{ margin: 0 }}>
          This chat route is gated by SafeNet women-safety moderation before returning a response.
        </p>
      </section>

      <section className="card stack">
        <div className="stack" style={{ maxHeight: 300, overflowY: 'auto', gap: 8 }}>
          {turns.length === 0 ? <p className="muted">Send a message to start.</p> : null}
          {turns.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className="card">
              <strong>{turn.role === 'user' ? 'User' : 'Assistant'}</strong>
              <p style={{ margin: '6px 0 0 0' }}>{turn.text}</p>
            </div>
          ))}
        </div>

        <form className="stack" onSubmit={send}>
          <textarea
            className="textarea"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message to test women-safety chat moderation"
          />
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <p className="muted" style={{ margin: 0 }}>{meta || 'No moderation metadata yet.'}</p>
      </section>
    </main>
  );
}
