import React, { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  loading?: boolean;
  initialValue?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, loading = false, initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <textarea
        className="prompt-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe the dashboard you want... e.g. 'Show me monthly revenue trends for Q3 2024 by region'"
        rows={3}
        disabled={loading}
      />
      <button
        type="submit"
        className="prompt-submit"
        disabled={loading || !value.trim()}
      >
        {loading ? (
          <span className="loading-indicator">
            <span className="spinner" />
            Generating…
          </span>
        ) : (
          '✨ Generate Dashboard'
        )}
      </button>
    </form>
  );
};

export default PromptInput;
