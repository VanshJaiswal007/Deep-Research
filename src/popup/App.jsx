import React, { useState } from 'react';

const App = () => {
  const [forceCopy, setForceCopy] = useState(false);

  const handleExport = () => {
    chrome.runtime.sendMessage({ action: "exportChat", force: forceCopy }, (response) => {
      console.log("Export message sent", response);
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Export ChatGPT Conversation</h1>
      <p style={styles.instructions}>
        Export the current conversation to a new Google Doc.
        The extension evaluates the content for deep research quality.
        If it doesn’t qualify, you can force the export.
      </p>
      <div style={styles.options}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={forceCopy}
            onChange={(e) => setForceCopy(e.target.checked)}
            style={styles.checkbox}
          />
          Force copy even if not deep research
        </label>
      </div>
      <button style={styles.button} onClick={handleExport}>
        Export to Google Docs
      </button>
      <footer style={styles.footer}>
        <small>© 2025 ChatGPT Exporter</small>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    width: '300px',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    marginBottom: '10px',
    fontSize: '20px',
    color: '#333',
  },
  instructions: {
    marginBottom: '15px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.4',
  },
  options: {
    marginBottom: '20px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '8px',
  },
  button: {
    padding: '10px 15px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#4285f4',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#aaa',
  },
};

export default App;
