import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — VisualizeIT",
  description: "What VisualizeIT is and the 7 memory scenarios it covers."
};

const scenarios = [
  {
    id: "stack-frame-basics",
    title: "Stack Frames",
    category: "Fundamentals",
    description: "Function entry, local declaration, and stack cleanup.",
    color: "amber"
  },
  {
    id: "heap-allocation",
    title: "Heap Blocks",
    category: "Fundamentals",
    description: "Pointer declaration, malloc, write, and free.",
    color: "amber"
  },
  {
    id: "recursive-stack",
    title: "Recursive Stack",
    category: "Fundamentals",
    description: "factorial(3) call chain: frame accumulation, peak depth, and full unwind.",
    color: "amber"
  },
  {
    id: "pointer-arithmetic",
    title: "Pointer Arithmetic",
    category: "Fundamentals",
    description: "Allocate an int array, write elements, advance a pointer through elements, then free.",
    color: "amber"
  },
  {
    id: "struct-with-pointer",
    title: "Struct With Pointer",
    category: "Data Structures",
    description: "Struct fields and pointer field assignment across heap-allocated nodes.",
    color: "teal"
  },
  {
    id: "linked-list-traversal",
    title: "Linked List Traversal",
    category: "Data Structures",
    description: "Build a two-node singly-linked list and traverse it with a moving pointer.",
    color: "teal"
  },
  {
    id: "leak-and-dangling-pointer",
    title: "Leak & Dangling Pointer",
    category: "Bugs & Pitfalls",
    description: "Lost heap reference and pointer to released memory — two of the most common C bugs.",
    color: "error"
  }
] as const;

const categoryColors: Record<string, string> = {
  Fundamentals: "category--amber",
  "Data Structures": "category--teal",
  "Bugs & Pitfalls": "category--error"
};

export default function AboutPage() {
  return (
    <div className="about-page">
      <nav className="about-nav" aria-label="VisualizeIT navigation">
        <div className="about-nav__inner">
          <Link href="/" className="about-nav__brand">
            <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">
              <rect x="2" y="2" width="28" height="28" rx="6" fill="#F5B82E"/>
              <path d="M9 9 L16 23 L23 9" stroke="#0B0D10" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth="1"/>
            </svg>
            <span className="about-nav__brand-name">VisualizeIT</span>
          </Link>

          <Link href="/" className="about-nav__cta">
            Try the visualizer →
          </Link>
        </div>
      </nav>

      <main className="about-main">
        <header className="about-hero">
          <div className="about-hero__eyebrow">
            <span className="about-hero__chip">Memory Engine</span>
            <span className="about-hero__chip about-hero__chip--dim">v1.0</span>
          </div>
          <h1 className="about-hero__title">
            See C memory<br />
            <span className="about-hero__title-accent">as it happens.</span>
          </h1>
          <p className="about-hero__description">
            VisualizeIT turns abstract C memory concepts into a live, step-by-step canvas.
            Watch stack frames push and pop, heap blocks allocate and free, and pointers
            chase addresses — all synchronized to the source code line that caused it.
          </p>
          <p className="about-hero__description">
            Seven interactive scenarios cover the fundamentals every systems programmer
            needs to internalize: from basic stack layout to memory leaks and dangling
            pointers. Each step shows both the visual state and a plain-English explanation.
          </p>
        </header>

        <section className="about-scenarios" aria-label="Available scenarios">
          <h2 className="about-scenarios__heading">
            <span className="about-scenarios__heading-label">Scenarios</span>
            <span className="about-scenarios__count">7</span>
          </h2>

          <ol className="about-scenario-list">
            {scenarios.map((scenario, index) => (
              <li key={scenario.id} className={`about-scenario-card about-scenario-card--${scenario.color}`}>
                <span className="about-scenario-card__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="about-scenario-card__body">
                  <div className="about-scenario-card__header">
                    <h3 className="about-scenario-card__title">{scenario.title}</h3>
                    <span className={`about-scenario-card__category ${categoryColors[scenario.category]}`}>
                      {scenario.category}
                    </span>
                  </div>
                  <p className="about-scenario-card__description">{scenario.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="about-footer">
          <Link href="/" className="about-footer__cta">
            Open the visualizer →
          </Link>
          <p className="about-footer__note">
            Built with Next.js · Deployed on Vercel
          </p>
        </footer>
      </main>

      <style>{`
        .about-page {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
        }

        /* ─── Nav ─── */

        .about-nav {
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(7, 11, 18, 0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .about-nav__inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 24px;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .about-nav__brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text-primary);
        }

        .about-nav__brand:hover {
          opacity: 0.8;
        }

        .about-nav__brand:focus-visible {
          outline: 2px solid rgba(245, 184, 46, 0.6);
          outline-offset: 4px;
          border-radius: 4px;
        }

        .about-nav__brand-name {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .about-nav__cta {
          font-size: 13px;
          font-weight: 500;
          color: var(--accent-amber);
          text-decoration: none;
          padding: 6px 14px;
          border: 1px solid var(--accent-amber-border);
          border-radius: var(--radius-md);
          background: var(--accent-amber-dim);
          transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
        }

        .about-nav__cta:hover {
          background: rgba(245, 184, 46, 0.18);
          border-color: rgba(245, 184, 46, 0.55);
          transform: translateY(-1px);
        }

        .about-nav__cta:focus-visible {
          outline: 2px solid rgba(245, 184, 46, 0.6);
          outline-offset: 2px;
        }

        /* ─── Main ─── */

        .about-main {
          flex: 1;
          max-width: 760px;
          margin: 0 auto;
          padding: 64px 24px 80px;
          width: 100%;
        }

        /* ─── Hero ─── */

        .about-hero {
          margin-bottom: 64px;
        }

        .about-hero__eyebrow {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .about-hero__chip {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: var(--radius-sm);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .about-hero__chip--dim {
          opacity: 0.5;
        }

        .about-hero__title {
          font-family: var(--font-display);
          font-size: clamp(40px, 7vw, 64px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin: 0 0 28px;
        }

        .about-hero__title-accent {
          color: var(--accent-amber);
        }

        .about-hero__description {
          font-size: 16px;
          line-height: 1.75;
          color: var(--text-secondary);
          margin: 0 0 14px;
          max-width: 580px;
        }

        .about-hero__description:last-child {
          margin-bottom: 0;
        }

        /* ─── Scenarios section ─── */

        .about-scenarios__heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 24px;
        }

        .about-scenarios__heading-label {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .about-scenarios__count {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 99px;
          padding: 1px 8px;
        }

        .about-scenario-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .about-scenario-card {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 16px 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          transition: border-color 150ms ease, background 150ms ease;
        }

        .about-scenario-card:hover {
          border-color: var(--border-default);
          background: var(--bg-elevated);
        }

        .about-scenario-card--amber {
          border-left: 3px solid rgba(245, 184, 46, 0.4);
        }

        .about-scenario-card--teal {
          border-left: 3px solid rgba(63, 167, 255, 0.4);
        }

        .about-scenario-card--error {
          border-left: 3px solid rgba(255, 61, 110, 0.4);
        }

        .about-scenario-card__index {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          padding-top: 2px;
          flex-shrink: 0;
          min-width: 24px;
        }

        .about-scenario-card__body {
          flex: 1;
          min-width: 0;
        }

        .about-scenario-card__header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .about-scenario-card__title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .about-scenario-card__category {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 2px 8px;
          border-radius: 99px;
          flex-shrink: 0;
        }

        .category--amber {
          color: var(--accent-amber);
          background: var(--accent-amber-dim);
          border: 1px solid var(--accent-amber-border);
        }

        .category--teal {
          color: var(--color-pointer);
          background: var(--color-pointer-dim);
          border: 1px solid rgba(63, 167, 255, 0.3);
        }

        .category--error {
          color: var(--color-error);
          background: var(--color-error-dim);
          border: 1px solid rgba(255, 61, 110, 0.3);
        }

        .about-scenario-card__description {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ─── Footer ─── */

        .about-footer {
          margin-top: 64px;
          padding-top: 32px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .about-footer__cta {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--accent-amber);
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: opacity 150ms ease;
        }

        .about-footer__cta:hover {
          opacity: 0.75;
        }

        .about-footer__cta:focus-visible {
          outline: 2px solid rgba(245, 184, 46, 0.6);
          outline-offset: 4px;
          border-radius: 4px;
        }

        .about-footer__note {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
          font-family: var(--font-mono);
        }

        @media (max-width: 560px) {
          .about-main {
            padding: 40px 16px 60px;
          }

          .about-nav__cta {
            font-size: 12px;
            padding: 5px 10px;
          }
        }
      `}</style>
    </div>
  );
}
