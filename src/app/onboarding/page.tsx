"use client";

import { FormEvent, useState } from 'react';

type RegisterResult = {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'English',
    hoursPerWeek: '20',
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/moderators/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hoursPerWeek: Number(form.hoursPerWeek),
        }),
      });

      const result = (await response.json()) as RegisterResult;
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Registration failed.');
      }

      setMessage(`Registered ${result.data?.name}. You can now moderate content.`);
      setForm({
        name: '',
        email: '',
        phone: '',
        language: 'English',
        hoursPerWeek: '20',
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Registration failed.';
      setMessage(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>Moderator Onboarding</h1>
        <p className="muted" style={{ margin: 0 }}>
          Register new moderators with a clean, no-friction workflow.
        </p>
      </section>

      <form className="card stack" onSubmit={submit}>
        <label className="stack" style={{ gap: 6 }}>
          <span>Full Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>

        <label className="stack" style={{ gap: 6 }}>
          <span>Email</span>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>

        <label className="stack" style={{ gap: 6 }}>
          <span>Phone</span>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </label>

        <label className="stack" style={{ gap: 6 }}>
          <span>Primary Language</span>
          <select
            className="select"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Tamil</option>
            <option>Telugu</option>
            <option>Marathi</option>
          </select>
        </label>

        <label className="stack" style={{ gap: 6 }}>
          <span>Hours Per Week</span>
          <select
            className="select"
            value={form.hoursPerWeek}
            onChange={(e) => setForm({ ...form, hoursPerWeek: e.target.value })}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
          </select>
        </label>

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Continue to Training'}
        </button>

        {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
      </form>
    </main>
  );
}
