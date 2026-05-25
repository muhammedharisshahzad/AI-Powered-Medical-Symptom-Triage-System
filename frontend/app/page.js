"use client";

import { useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClipboard,
  FiSearch,
  FiShield
} from "react-icons/fi";

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

function getAgentIcon(name) {
  return agentIcons[name] || FiClipboard;
}

export default function HomePage() {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [medications, setMedications] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const verdictInfo = result ? verdictConfig[result.verdict] : null;
  const VerdictIcon = verdictInfo ? verdictInfo.icon : null;

  return (
    <>
      <header className="header">
        <div className="brand">
          <img className="brand-logo" src="/api/logo" alt="Project logo" />
          <div>
            <div className="brand-title">Medical Symptom Triage</div>
            <div className="brand-subtitle">Agentic AI workflow</div>
          </div>
        </div>
        <div className="status-pill">Production ready</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">AI powered triage</div>
          <h1>Clarity for urgent decisions.</h1>
          <p className="lead">
            Capture symptoms in plain language and receive a triage verdict with
            specialist reasoning. Built for fast, consistent guidance.
          </p>
          <div className="hero-metrics">
            <div className="metric">
              <span className="metric-label">Agents</span>
              <span className="metric-value">3 specialists</span>
            </div>
            <div className="metric">
              <span className="metric-label">Patterns</span>
              <span className="metric-value">ReAct, Tool Use, Chaining</span>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-title">System snapshot</div>
          <div className="panel-row">
            <div className="panel-icon">
              <FiSearch />
            </div>
            <div>
              <div className="panel-label">Symptom Analyzer</div>
              <div className="panel-copy">Structured observation and concerns.</div>
            </div>
          </div>
          <div className="panel-row">
            <div className="panel-icon">
              <FiShield />
            </div>
            <div>
              <div className="panel-label">Risk Assessor</div>
              <div className="panel-copy">Red flags and interaction checks.</div>
            </div>
          </div>
          <div className="panel-row">
            <div className="panel-icon">
              <FiClipboard />
            </div>
            <div>
              <div className="panel-label">Care Recommender</div>
              <div className="panel-copy">Stepwise care plan and monitoring.</div>
            </div>
          </div>
        </div>
      </section>

      <main className="workspace">
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
            {verdictInfo && VerdictIcon ? (
              <span className={verdictInfo.className}>
                <VerdictIcon className="icon" />
                {verdictInfo.label}
              </span>
            ) : null}
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
                <div className="text-block">{result.final_report}</div>
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

      <footer className="footer">
        Outputs are generated by AI. Always seek licensed medical care for
        urgent symptoms.
      </footer>
    </>
  );
}
