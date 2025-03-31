import React, { useState, useEffect } from "react";

const App = () => {
  const [forceCopy, setForceCopy] = useState(false);
  const [currentSite, setCurrentSite] = useState("Unknown");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const url = tabs[0].url;
        if (url.includes("chatgpt.com")) {
          setCurrentSite("ChatGPT");
        } else if (url.includes("perplexity.ai")) {
          setCurrentSite("Perplexity.ai");
        } else {
          setCurrentSite("Unsupported Site");
        }
      }
    });
  }, []);

  const handleExport = () => {
    chrome.runtime.sendMessage({ action: "exportChat", force: forceCopy }, (response) => {
      console.log("Export message sent", response);
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Export AI Conversation</h1>
      <p style={styles.instructions}>
        Export the current conversation (from ChatGPT or Perplexity.ai) to a new Google Doc.
        The extension evaluates the content for deep research quality.
        If it doesn’t qualify, you can force the export.
      </p>
      <p style={styles.siteDetected}>
        <strong>Detected Site: {currentSite}</strong>
      </p>
      <div style={styles.options}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={forceCopy}
            onChange={(e) => setForceCopy(e.target.checked)}
            style={styles.checkbox}
          />
          Force export even if not deep research
        </label>
      </div>
      <button style={styles.button} onClick={handleExport} disabled={currentSite === "Unsupported Site"}>
        Export to Google Docs
      </button>
      {currentSite === "Unsupported Site" && (
        <p style={styles.error}>This site is not supported.</p>
      )}
      <footer style={styles.footer}>
        <small>© 2025 AI Conversation Exporter</small>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    width: "300px",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
  },
  title: {
    marginBottom: "10px",
    fontSize: "20px",
    color: "#333"
  },
  instructions: {
    marginBottom: "15px",
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.4"
  },
  siteDetected: {
    marginBottom: "15px",
    fontSize: "14px",
    color: "#007bff"
  },
  options: {
    marginBottom: "20px"
  },
  checkboxLabel: {
    fontSize: "14px",
    color: "#333",
    cursor: "pointer"
  },
  checkbox: {
    marginRight: "8px"
  },
  button: {
    padding: "10px 15px",
    fontSize: "14px",
    color: "#fff",
    backgroundColor: "#4285f4",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  error: {
    color: "red",
    fontSize: "12px"
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#aaa"
  }
};

export default App;
