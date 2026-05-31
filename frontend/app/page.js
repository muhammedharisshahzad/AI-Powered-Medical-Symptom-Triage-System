"use client";

import { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClipboard,
  FiCpu,
  FiDownload,
  FiLock,
  FiSearch,
  FiShield
} from "react-icons/fi";
import { jsPDF } from "jspdf";

import { submitTriage } from "../lib/api";

const verdictConfig = {
  Emergency: {
    label: "Emergency",
    className: "badge badge--emergency",
    icon: FiAlertTriangle
  },
  "See Doctor": {
    label: "See Doctor",
    className: "badge badge--doctor",
    icon: FiActivity
  },
  "Home Care": {
    label: "Home Care",
    className: "badge badge--home",
    icon: FiCheckCircle
  }
};

const agentIcons = {
  "Symptom Analyzer": FiSearch,
  "Risk Assessor": FiShield,
  "Care Recommender": FiClipboard
};

const reportHeadings = [
  "Summary",
  "Why this verdict",
  "Care guidance",
  "When to seek urgent care",
  "Disclaimer"
];

function getAgentIcon(name) {
  return agentIcons[name] || FiClipboard;
}

function parseReport(text) {
  if (!text) {
    return [];
  }

  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const sections = [];
  let current = null;

  lines.forEach((line) => {
    if (!line) {
      return;
    }

    const match = reportHeadings.find((heading) =>
      line.toLowerCase().startsWith(`${heading.toLowerCase()}:`)
    );

    if (match) {
      current = { title: match, lines: [] };
      const remainder = line.slice(match.length + 1).trim();
      if (remainder) {
        current.lines.push(remainder);
      }
      sections.push(current);
      return;
    }

    if (!current) {
      current = { title: "Report", lines: [] };
      sections.push(current);
    }

    current.lines.push(line);
  });

  return sections;
}

function playEmergencySiren() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    const now = context.currentTime;
    const pattern = [
      { time: 0, freq: 880 },
      { time: 0.3, freq: 640 },
      { time: 0.6, freq: 880 }
    ];

    // Web Audio beep pattern for an emergency siren cue.
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.05);

    pattern.forEach((step) => {
      oscillator.frequency.setValueAtTime(step.freq, now + step.time);
    });

    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    oscillator.start(now);
    oscillator.stop(now + 1.2);

    oscillator.onended = () => {
      context.close();
    };
  } catch (error) {
    // Ignore audio errors (autoplay restrictions or missing support).
  }
}

export default function HomePage() {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [medications, setMedications] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flashEmergency, setFlashEmergency] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);

  const handleProceed = () => {
    setShowWorkspace(true);
    window.setTimeout(() => {
      document.getElementById("triage-workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 80);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        user_input: symptoms.trim(),
        age: age ? Number(age) : null,
        sex: sex ? sex.trim() : null,
        medications: medications ? medications.trim() : null
      };
      const data = await submitTriage(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || "Request failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) {
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 16;
    let cursorY = margin;

    const ensureSpace = (needed = lineHeight) => {
      if (cursorY + needed > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
    };

    const writeLines = (lines) => {
      lines.forEach((line) => {
        ensureSpace();
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    writeLines(["Medical Symptom Triage Report"]);
    cursorY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    writeLines([`Generated: ${new Date().toLocaleString()}`]);
    cursorY += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    writeLines(["Verdict"]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    writeLines([result.verdict]);
    cursorY += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    writeLines(["Final Report"]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    writeLines(doc.splitTextToSize(result.final_report, pageWidth - margin * 2));
    cursorY += 12;

    const agentText = result.agents
      .map(
        (agent) =>
          `${agent.name} (${agent.pattern})\n${agent.content}`
      )
      .join("\n\n");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    writeLines(["Specialist Outputs"]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    writeLines(doc.splitTextToSize(agentText, pageWidth - margin * 2));

    doc.save("triage-report.pdf");
  };

  const verdictInfo = result ? verdictConfig[result.verdict] : null;
  const VerdictIcon = verdictInfo ? verdictInfo.icon : null;
  const reportSections = result ? parseReport(result.final_report) : [];

  useEffect(() => {
    if (!result || result.verdict !== "Emergency") {
      return;
    }

    setFlashEmergency(true);
    playEmergencySiren();

    const timeout = setTimeout(() => setFlashEmergency(false), 1200);
    return () => clearTimeout(timeout);
  }, [result]);

  return (
    <>
      {flashEmergency ? (
        <div className="emergency-flash" aria-hidden="true" />
      ) : null}
      <header className="header">
        <div className="brand">
          <img className="brand-logo" src="/api/logo" alt="Project logo" />
          <div>
            <div className="brand-title">Medical Symptom Triage</div>
            <div className="brand-subtitle">Agentic clinical guidance</div>
          </div>
        </div>
        <div className="nav-actions">
          <a href="#overview">Overview</a>
          <button type="button" className="access-button" onClick={handleProceed}>
            Access triage
          </button>
        </div>
      </header>

      <section className="home-hero" id="overview">
        <div className="home-copy">
          <div className="eyebrow">AI powered medical triage</div>
          <h1>Clear symptom guidance, built with multi-agent reasoning.</h1>
          <p className="lead">
            A professional decision-support system that routes patient symptoms
            through specialist agents and returns a structured urgency verdict.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-cta" onClick={handleProceed}>
              Proceed to triage
              <FiArrowRight className="button-icon" />
            </button>
            <span className="hero-note">Python backend ready. n8n workflow ready.</span>
          </div>
        </div>
        <div className="system-panel" aria-label="System architecture summary">
          <div className="panel-title">System architecture</div>
          <div className="system-step">
            <div className="panel-icon">
              <FiSearch />
            </div>
            <div>
              <div className="panel-label">Symptom Analyzer</div>
              <div className="panel-copy">ReAct style symptom interpretation.</div>
            </div>
          </div>
          <div className="system-step">
            <div className="panel-icon">
              <FiShield />
            </div>
            <div>
              <div className="panel-label">Risk Assessor</div>
              <div className="panel-copy">Tool-based red flag and medication checks.</div>
            </div>
          </div>
          <div className="system-step">
            <div className="panel-icon">
              <FiClipboard />
            </div>
            <div>
              <div className="panel-label">Care Recommender</div>
              <div className="panel-copy">Prompt-chained care plan generation.</div>
            </div>
          </div>
          <div className="system-verdict">
            <FiCpu />
            <span>Orchestrator synthesizes final verdict and specialist outputs.</span>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <div>
          <FiActivity />
          <span>Emergency, doctor visit, or home care verdict</span>
        </div>
        <div>
          <FiLock />
          <span>Structured REST response for frontend and n8n demos</span>
        </div>
        <div>
          <FiCheckCircle />
          <span>Transparent specialist reasoning in every result</span>
        </div>
      </section>

      {showWorkspace ? (
      <main className="workspace" id="triage-workspace">
        <form className="form-card" onSubmit={handleSubmit}>
          <h2>Describe the symptoms</h2>
          <p className="muted">
            Share the situation as you would explain it to a clinician.
          </p>

          <label htmlFor="symptoms">Symptoms</label>
          <textarea
            id="symptoms"
            name="symptoms"
            rows={6}
            placeholder="Example: Sudden chest pain with shortness of breath"
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            required
          />

          <div className="form-grid">
            <div>
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                min="0"
                max="120"
                placeholder="Optional"
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="sex">Sex</label>
              <input
                id="sex"
                name="sex"
                type="text"
                placeholder="Optional"
                value={sex}
                onChange={(event) => setSex(event.target.value)}
              />
            </div>
          </div>

          <label htmlFor="medications">Current medications</label>
          <input
            id="medications"
            name="medications"
            type="text"
            placeholder="Optional"
            value={medications}
            onChange={(event) => setMedications(event.target.value)}
          />

          <button
            className="primary-button"
            type="submit"
            disabled={loading || symptoms.trim().length < 5}
          >
            {loading ? "Running triage" : "Run triage"}
          </button>

          <div className="form-note">
            This tool provides decision support only and is not medical advice.
          </div>
        </form>

        <section className="result-card">
          <div className="result-header">
            <div>
              <h2>Triaged outcome</h2>
              <p className="muted">Final verdict plus specialist reasoning.</p>
            </div>
            <div className="result-actions">
              {verdictInfo && VerdictIcon ? (
                <span
                  className={`${verdictInfo.className} badge--pulse ${
                    result?.verdict === "Emergency" ? "badge--urgent" : ""
                  }`}
                >
                  <VerdictIcon className="icon" />
                  {verdictInfo.label}
                </span>
              ) : null}
              {result ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleDownload}
                >
                  <FiDownload className="button-icon" />
                  Download PDF
                </button>
              ) : null}
            </div>
          </div>

          {error ? <div className="alert">{error}</div> : null}

          {!result && !loading ? (
            <div className="empty-state">
              <div className="empty-title">No triage yet</div>
              <div className="muted">
                Submit symptoms to see the three agent outputs and final verdict.
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <div>
                <div className="loading-title">Running agents</div>
                <div className="muted">Synthesizing specialist insight.</div>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="result-body">
              <div className="final-report">
                <h3>Final report</h3>
                {reportSections.length ? (
                  <div className="report-stack">
                    {reportSections.map((section, index) => {
                      const textLines = section.lines.filter(
                        (line) => !line.startsWith("-")
                      );
                      const bullets = section.lines
                        .filter((line) => line.startsWith("-"))
                        .map((line) => line.replace(/^[-]\s?/, ""));

                      return (
                        <div className="report-section" key={`${section.title}-${index}`}>
                          <h4>{section.title}</h4>
                          {textLines.map((line, lineIndex) => (
                            <p className="report-text" key={`${section.title}-t-${lineIndex}`}>
                              {line}
                            </p>
                          ))}
                          {bullets.length ? (
                            <ul className="report-list">
                              {bullets.map((item, itemIndex) => (
                                <li key={`${section.title}-b-${itemIndex}`}>{item}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-block">{result.final_report}</div>
                )}
              </div>

              <div className="agent-section">
                <h3>Specialist outputs</h3>
                <div className="agents-grid">
                  {result.agents.map((agent, index) => {
                    const AgentIcon = getAgentIcon(agent.name);
                    return (
                      <article
                        key={agent.name}
                        className="agent-card"
                        style={{ animationDelay: `${index * 0.08}s` }}
                      >
                        <div className="agent-head">
                          <div className="panel-icon">
                            <AgentIcon />
                          </div>
                          <div>
                            <div className="agent-title">{agent.name}</div>
                            <div className="agent-pattern">{agent.pattern}</div>
                          </div>
                        </div>
                        <div className="text-block">{agent.content}</div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
      ) : null}

      <footer className="footer">
        <span>
          Outputs are generated by AI. Always seek licensed medical care for
          urgent symptoms.
        </span>
        <span>Copyright (c) Muhammad Haris Shahzad.</span>
      </footer>
    </>
  );
}
