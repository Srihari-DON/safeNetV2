"use client";

import { useEffect, useState } from 'react';

type Moderator = {
  id: string;
  name: string;
  email: string;
};

type QueueItem = {
  id: string;
  text: string;
  source: string;
  createdAt: string;
};

type Decision = 'SAFE' | 'FLAGGED' | 'ESCALATED';

export default function PortalPage() {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedModerator, setSelectedModerator] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const current = queue[0];

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [modsRes, queueRes] = await Promise.all([
        fetch('/api/moderators'),
        fetch('/api/moderation/queue'),
      ]);

      const mods = await modsRes.json();
      const queueData = await queueRes.json();

      if (!modsRes.ok || !mods.success) {
        throw new Error(mods.error || 'Failed to load moderators.');
      }
      if (!queueRes.ok || !queueData.success) {
        throw new Error(queueData.error || 'Failed to load queue.');
      }

      setModerators(mods.data);
      setQueue(queueData.data);
      if (mods.data.length > 0) {
        setSelectedModerator((prev) => prev || mods.data[0].id);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load portal data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitDecision = async (decision: Decision) => {
    if (!current || !selectedModerator) {
      setError('Select a moderator and ensure queue has items.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/moderation/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: current.id,
          moderatorId: selectedModerator,
          decision,
          reason: reason.trim() || null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not submit decision.');
      }

      setQueue((prev) => prev.slice(1));
      setReason('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not submit decision.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="shell stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>Moderator Portal</h1>
        <p className="muted" style={{ margin: 0 }}>
          Review cyber abuse reports affecting women and submit safe, explainable decisions.
        </p>
      </section>

      <section className="card stack">
        <label className="stack" style={{ gap: 6 }}>
          <span>Moderator</span>
          <select
            className="select"
            value={selectedModerator}
            onChange={(e) => setSelectedModerator(e.target.value)}
            disabled={loading || moderators.length === 0}
          >
            {moderators.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.name} ({mod.email})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card stack">
        {loading ? <p className="muted">Loading queue...</p> : null}
        {!loading && !current ? <p className="muted">Queue is empty. New women-safety incident reports will appear here.</p> : null}
        {!loading && current ? (
          <>
            <p style={{ margin: 0, fontWeight: 600 }}>Current Item</p>
            <p style={{ margin: 0 }}>{current.text}</p>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Source: {current.source}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="pill">PENDING</span>
              <span className="pill">Received: {new Date(current.createdAt).toLocaleTimeString()}</span>
              <span className="pill">Target SLA: 60 min</span>
            </div>

            <label className="stack" style={{ gap: 6 }}>
              <span>Reason (optional)</span>
              <textarea
                className="textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (for example: stalking threat, image blackmail, doxxing risk)"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              <button className="button secondary" onClick={() => submitDecision('SAFE')} disabled={submitting}>
                Mark Safe
              </button>
              <button className="button secondary" onClick={() => submitDecision('FLAGGED')} disabled={submitting}>
                Flag
              </button>
              <button className="button" onClick={() => submitDecision('ESCALATED')} disabled={submitting}>
                Escalate
              </button>
            </div>
          </>
        ) : null}
      </section>

      <section className="card stack">
        <p style={{ margin: 0 }}>Pending items: {queue.length}</p>
        <button className="button secondary" onClick={load} disabled={loading}>
          Refresh Queue
        </button>
        {error ? <p className="muted" style={{ margin: 0 }}>{error}</p> : null}
      </section>
    </main>
  );
}
