chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "exportChat") {
      // Query the active ChatGPT tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const chatTab = tabs[0];
        chrome.scripting.executeScript({
          target: { tabId: chatTab.id },
          func: extractChatContent
        }, (results) => {
          if (results && results[0] && results[0].result) {
            const chatContent = results[0].result;
            // Open a new Google Doc
            chrome.tabs.create({ url: "https://docs.google.com/document/create" }, (docTab) => {
              // Wait a few seconds to allow the doc to load
              setTimeout(() => {
                chrome.scripting.executeScript({
                  target: { tabId: docTab.id },
                  func: pasteContent,
                  args: [chatContent]
                });
              }, 5000);
            });
          }
        });
      });
    }
    return true;
  });
  
  /**
   * Extracts only the current conversation text by:
   * 1. Selecting the conversation container (inside <main>).
   * 2. Splitting the text into lines.
   * 3. Filtering out unwanted lines or labels, while keeping "You said:" and "ChatGPT said:".
   */
  function extractChatContent() {
    const mainEl = document.querySelector('main');
    if (!mainEl) {
      console.error("Main container not found");
      return "";
    }
    
    // Attempt to narrow down to the conversation container.
    const conversationContainer = mainEl.querySelector('div.flex.flex-col.gap-4');
    let rawText = conversationContainer ? conversationContainer.innerText : mainEl.innerText;
    
    // Split the text into lines and trim each line.
    let lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Define unwanted substrings that you want to filter out.
    const unwantedPatterns = [
      "Share",
      "Search",
      "Reason",
      "ChatGPT can make mistakes. Check important info.",
      "4o"
    ];
    
    // Filter out lines that include any unwanted pattern.
    lines = lines.filter(line => {
      return !unwantedPatterns.some(pattern => line.includes(pattern));
    });
    
    const filteredText = lines.join('\n\n');
    console.log("Filtered conversation:", filteredText);
    return filteredText;
  }
  
  /**
   * In the Google Docs tab, copies the provided content to the clipboard.
   */
  function pasteContent(content) {
    navigator.clipboard.writeText(content).then(() => {
      alert("Content copied to clipboard! Please press Ctrl+V in the Google Doc to paste.");
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  }
  
  
  