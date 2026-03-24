"use client";

import { useEffect, useState } from 'react';

type Metrics = {
  moderators: number;
  pending: number;
  flagged: number;
  escalated: number;
  reviewed: number;
  avgReviewMinutes?: number;
  slaBreaches?: number;
};

export default function AdminPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/overview');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Admin metrics failed.');
      }

      setData(result.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Admin metrics failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="shell stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>Admin Portal</h1>
        <p className="muted" style={{ margin: 0 }}>
          Live women-digital-safety operations metrics from production data.
        </p>
      </section>

      <section className="card stack" style={{ gap: 8 }}>
        {loading ? <p className="muted" style={{ margin: 0 }}>Loading admin metrics...</p> : null}
        {error ? <p className="muted" style={{ margin: 0 }}>{error}</p> : null}

        {data ? (
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div className="card"><strong>Moderators</strong><p>{data.moderators}</p></div>
            <div className="card"><strong>Pending Queue</strong><p>{data.pending}</p></div>
            <div className="card"><strong>Flagged</strong><p>{data.flagged}</p></div>
            <div className="card"><strong>Escalated</strong><p>{data.escalated}</p></div>
            <div className="card"><strong>Avg Review Time</strong><p>{data.avgReviewMinutes ?? 0} min</p></div>
            <div className="card"><strong>SLA Breaches</strong><p>{data.slaBreaches ?? 0}</p></div>
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <strong>Total Reviewed</strong>
              <p>{data.reviewed}</p>
              <span className={data.slaBreaches && data.slaBreaches > 0 ? 'pill warn' : 'pill'}>
                {data.slaBreaches && data.slaBreaches > 0 ? 'Needs response-time attention' : 'Response-time on track'}
              </span>
            </div>
          </div>
        ) : null}

        <button className="button secondary" onClick={load} disabled={loading}>
          Refresh Admin Portal
        </button>
      </section>
    </main>
  );
}
