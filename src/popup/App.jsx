import React from 'react';

const App = () => {
  const handleExport = () => {
    chrome.runtime.sendMessage({ action: "exportChat" }, (response) => {
      console.log("Export message sent", response);
    });
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Export ChatGPT Conversation</h1>
      <button onClick={handleExport}>Export to Google Docs</button>
    </div>
  );
};

export default App;
