import React, { useState } from 'react';
import PromptInput from './components/PromptInput';
import Dashboard from './components/Dashboard';
import './App.css';

const EXAMPLE_PROMPTS = [
  'Show me monthly sales revenue for Q3 2024 broken down by region',
  'Compare product category performance for 2024',
  'What are the top performing regions by profit this year?',
  'Show revenue trend for Electronics category over the past year',
  'Give me a complete sales overview for Q4 2024',
];

const App: React.FC = () => {
  const [submittedPrompt, setSubmittedPrompt] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (prompt: string) => {
    setLoading(true);
    setTimeout(() => {
      setSubmittedPrompt(prompt);
      setLoading(false);
    }, 400);
  };

  const handleChipClick = (prompt: string) => {
    setActivePrompt(prompt);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">
            <span className="logo-icon">📊</span>
            <div>
              <h1 className="header-title">Intelligent Dashboard Generator</h1>
              <p className="header-subtitle">Describe your data needs in plain English</p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="input-section">
          <div className="prompt-chips">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                className="chip"
                onClick={() => handleChipClick(p)}
                title={p}
              >
                {p}
              </button>
            ))}
          </div>
          <PromptInput
            onSubmit={handleSubmit}
            loading={loading}
            initialValue={activePrompt}
          />
        </section>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Analyzing your request…</p>
          </div>
        )}

        {!loading && submittedPrompt && (
          <section className="dashboard-section">
            <Dashboard prompt={submittedPrompt} />
          </section>
        )}

        {!submittedPrompt && !loading && (
          <div className="welcome-state">
            <div className="welcome-icon">✨</div>
            <h2>Start by describing your dashboard</h2>
            <p>Click one of the example prompts above or type your own query to generate an intelligent data dashboard.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
