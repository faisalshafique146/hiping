import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const GITHUB_URL = "https://github.com";
const INSTALL_COMMAND = "npm install -g hiping-agent";
const PILLS = ["Peer-to-peer", "Encrypted", "Zero config", "Free forever"];
const STEPS = [
  {
    number: "01",
    icon: "⚡",
    title: "Install the agent",
    copy: "One npm command installs HiPing on Windows and gets your machine ready in seconds."
  },
  {
    number: "02",
    icon: "🔑",
    title: "Get your code",
    copy: "A 6-digit code appears in your terminal so you can pair without touching router settings."
  },
  {
    number: "03",
    icon: "🌐",
    title: "Connect from anywhere",
    copy: "Open HiPing in any browser, enter the code, and your terminal is live."
  }
];
const FEATURES = [
  { icon: "🔒", title: "End-to-end encrypted", copy: "Real-time, low latency" },
  { icon: "🪟", title: "Windows PowerShell native", copy: "Built around the shell you already use" },
  { icon: "🆓", title: "Free forever", copy: "No subscription wall, no seat math" },
  { icon: "⚙", title: "Zero config", copy: "No VPN, no port forwarding, no extra setup" }
];

export default function Landing() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="landing-nav__logo" to="/">
          <span>Hi</span>
          <span>Ping</span>
        </Link>

        <nav className="landing-nav__links" aria-label="Primary">
          <a href="#how-it-works">How it works</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>

        <Link className="landing-nav__cta" to="/app">
          Open Terminal -&gt;
        </Link>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="hero-badge__dot" />
            <span>Windows · Free · Remote Access</span>
          </div>

          <h1 className="hero-title">
            Your Windows terminal,
            <br />
            <span>anywhere.</span>
          </h1>

          <p className="hero-text">
            HiPing lets you access your Windows terminal from any browser. No VPN, no port
            forwarding. Just a 6-digit code.
          </p>

          <div className="hero-actions">
            <Link className="hero-button hero-button--primary" to="/app">
              Connect Now -&gt;
            </Link>
            <a className="hero-button hero-button--ghost" href={GITHUB_URL} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </div>

          <div className="hero-pills">
            {PILLS.map((pill) => (
              <span className="hero-pill" key={pill}>
                {pill}
              </span>
            ))}
          </div>

          <div className="install-card">
            <code className="install-card__code">$ {INSTALL_COMMAND}</code>
            <button className="install-card__button" type="button" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="terminal-showcase">
          <div className="terminal-showcase__glow" />
          <div className="terminal-card">
            <div className="terminal-card__bar">
              <div className="terminal-card__dots">
                <span />
                <span />
                <span />
              </div>
              <div className="terminal-card__title">PowerShell - hiping</div>
            </div>

            <div className="terminal-card__body">
              <p>
                <span className="tone-dim">PS C:\Users\you&gt; </span>
                <span className="tone-text">hiping start</span>
              </p>
              <p className="terminal-line--blank" />
              <p>
                <span className="tone-green">●</span> <span className="tone-text">HiPing agent running</span>
              </p>
              <p className="terminal-line--blank" />
              <p>
                <span className="tone-dim">  Machine:</span> <span className="tone-muted">DESKTOP-WIN11</span>
              </p>
              <p>
                <span className="tone-dim">  Network:</span> <span className="tone-muted">192.168.1.10</span>
              </p>
              <p className="terminal-line--blank" />
              <p>
                <span className="tone-dim">  Code:</span>{" "}
                <span className="tone-cyan tone-cyan--large">4 8 2 - 9 1 0</span>
              </p>
              <p className="terminal-line--blank" />
              <p>
                <span className="tone-dim">  Waiting for connections...</span>
              </p>
              <p className="terminal-line--blank" />
              <p>
                <span className="tone-green">✓</span> <span className="tone-text">Browser connected</span>
              </p>
              <p>
                <span className="tone-dim">  Session active - terminal shared</span>
              </p>
              <p className="terminal-line--blank" />
              <p>
                <span className="tone-dim">PS C:\Users\you&gt; </span>
                <span className="terminal-cursor" />
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-divider" />

      <section className="how-section" id="how-it-works">
        <p className="section-eyebrow">// how it works</p>
        <h2 className="section-title">Three steps. No setup.</h2>

        <div className="steps-grid">
          {STEPS.map((step) => (
            <article className="step-card" key={step.number}>
              <p className="step-card__number">{step.number}</p>
              <div className="step-card__icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>

        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-card__icon">{feature.icon}</div>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="landing-divider" />

      <section className="cta-section">
        <div className="cta-section__glow" />
        <h2 className="section-title">
          Ready to go <span>&quot;HiPing&quot;</span>?
        </h2>
        <p className="cta-copy">
          Spin up the Windows agent, enter your code, and jump into your shell from any browser in
          seconds.
        </p>
        <div className="hero-actions">
          <Link className="hero-button hero-button--primary" to="/app">
            Open Terminal -&gt;
          </Link>
          <a className="hero-button hero-button--ghost" href={GITHUB_URL} target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <Link className="landing-footer__logo" to="/">
          <span>Hi</span>
          <span>Ping</span>
        </Link>
        <div className="landing-footer__links">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Link to="/app">Web</Link>
        </div>
        <p>Built for developers</p>
      </footer>
    </main>
  );
}
