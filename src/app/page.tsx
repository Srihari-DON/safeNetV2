export default function Home() {
  return (
    <main className="shell stack" style={{ gap: 20 }}>
      <section className="card stack">
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>SafeNet MVP v2</h1>
        <p className="muted" style={{ margin: 0 }}>
          Women-first digital safety stack: moderator training, cyber abuse triage, and company-facing AI safety guidance API.
        </p>
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0, fontSize: 18 }}>Core Flows</h2>
        <a href="/onboarding" className="button secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          Open Moderator Onboarding
        </a>
        <a href="/portal" className="button secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          Open Moderator Portal
        </a>
        <a href="/admin" className="button secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          Open Admin Portal
        </a>
        <a href="/ai-lab" className="button secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          Test AI Instruction API
        </a>
        <a href="/chat" className="button secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          Open Chat Integration Demo
        </a>
      </section>
    </main>
  );
}
