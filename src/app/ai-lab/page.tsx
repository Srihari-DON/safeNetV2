"use client";

import { FormEvent, useState } from 'react';

type AiResponse = {
  success: boolean;
  error?: string;
  data?: {
    riskScore: number;
    riskLevel: string;
    suggestedDecision: string;
    instruction: string;
    signals: Array<{ term: string; reason: string; weight: number }>;
  };
};

export default function AiLabPage() {
  const [content, setContent] = useState('Send private photos or I will leak your old pictures to everyone.');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setOutput('');

    try {
      const response = await fetch('/api/ai/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const result = (await response.json()) as AiResponse;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'API failed');
      }

      setOutput(JSON.stringify(result.data, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'API failed';
      setOutput(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>AI Instructions API Lab</h1>
        <p className="muted" style={{ margin: 0 }}>
          Company-facing endpoint for women-safety moderation guidance in chat and social platforms.
        </p>
      </section>

      <form className="card stack" onSubmit={run}>
        <label className="stack" style={{ gap: 6 }}>
          <span>Content Input</span>
          <textarea
            className="textarea"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </label>

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Moderation Instructions'}
        </button>
      </form>

      <section className="card stack">
        <p style={{ margin: 0, fontWeight: 600 }}>Response</p>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 12,
            overflowX: 'auto',
            fontSize: 13,
          }}
        >
          {output || 'Run a test to view output.'}
        </pre>
      </section>
    </main>
  );
}
