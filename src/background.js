chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "exportChat") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const chatTab = tabs[0];
  
        // Extract chat content from ChatGPT or Perplexity.ai
        chrome.scripting.executeScript({
          target: { tabId: chatTab.id },
          func: extractChatContent
        }, (results) => {
          if (results && results[0] && results[0].result) {
            const chatContent = results[0].result;
            const score = evaluateDeepResearch(chatContent);
            console.log("Total deep research score:", score, "out of 80");
  
            const threshold = 36;
            if (score >= threshold || message.force === true) {
              console.log("Deep research content detected, or force copy enabled.");
              chrome.tabs.create({ url: "https://docs.google.com/document/create" }, (docTab) => {
                setTimeout(() => {
                  chrome.scripting.executeScript({
                    target: { tabId: docTab.id },
                    func: pasteContent,
                    args: [chatContent]
                  });
                }, 5000);
              });
            } else {
              chrome.notifications.create({
                type: "basic",
                iconUrl: "icon.png",
                title: "Export Cancelled",
                message: "The conversation does not appear to contain deep research content."
              });
            }
          }
        });
      });
    }
    return true;
  });
  
  /**
   * Extract chat content from ChatGPT or Perplexity.ai.
   * 
   * For ChatGPT (chatgpt.com): Uses a known conversation container.
   * For Perplexity.ai: Uses the <main> element, then:
   *  - If "Answer" and "Sources" markers are found, extracts the text in between.
   *  - Otherwise, filters out unwanted UI text.
   */
  function extractChatContent() {
    let chatText = "";
    const hostname = window.location.hostname;
    console.log("Extracting chat from:", hostname);
  
    if (hostname.includes("chatgpt.com")) {
      const mainEl = document.querySelector("main");
      if (!mainEl) {
        console.error("Main container not found on ChatGPT.");
        return "No chat content found.";
      }
      const conversationContainer = mainEl.querySelector("div.flex.flex-col.gap-4");
      chatText = conversationContainer ? conversationContainer.innerText : mainEl.innerText;
      // Filter out unwanted UI elements
      let lines = chatText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
      const unwantedPatterns = ["Share", "Search", "Reason", "ChatGPT can make mistakes. Check important info.", "4o"];
      lines = lines.filter(line => !unwantedPatterns.some(pattern => line.includes(pattern)));
      chatText = lines.join("\n\n");
    } 
    else if (hostname.includes("perplexity.ai")) {
        const contentDivs = document.querySelectorAll("div.prose.text-pretty.inline.leading-normal.break-words");

        if (!contentDivs.length) return "No chat content found.";
    
        chatText = Array.from(contentDivs).map(div => div.innerText.trim()).join("\n\n");
        //chatText = lines.join("\n\n");
    }
  
    if (!chatText) {
      console.log("No chat content found.");
      return "No chat content found.";
    }
    console.log("Extracted chat content:", chatText);
    return chatText;
  }
  
  /**
   * Copies content to the clipboard and notifies the user.
   * Due to security restrictions, the extension copies the content
   * and instructs the user to paste it manually into Google Docs.
   */
  function pasteContent(content) {
    navigator.clipboard.writeText(content).then(() => {
      if (Notification.permission === "granted") {
        new Notification("Content Copied", {
          body: "Content copied to clipboard! Please press Ctrl+V in the Google Doc to paste.",
          icon: "icon.png"
        });
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Content Copied", {
              body: "Content copied to clipboard! Please press Ctrl+V in the Google Doc to paste.",
              icon: "icon.png"
            });
          }
        });
      }
    }).catch(err => console.error("Failed to copy text: ", err));
  }
  
  /**
   * Helper function: Scores a category based on keyword matches.
   * Returns 5 if two or more matches, 3 if one, or 1 if none.
   */
  function scoreCategory(text, keywords, regex = null) {
    let count = 0;
    keywords.forEach(keyword => {
      const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const keywordRegex = new RegExp(`\\b${escapedKeyword}\\b`, "gi");
      const matches = text.match(keywordRegex);
      if (matches) count += matches.length;
    });
    if (regex) count += (text.match(regex) || []).length;
    return count >= 2 ? 5 : count === 1 ? 3 : 1;
  }
  
  /**
   * Evaluates deep research quality (max score: 80) based on 16 categories.
   */
  function evaluateDeepResearch(text) {
    let totalScore = 0;
  
    // Category 1: Specificity & Granularity (dates and large numbers)
    const dateRegex = /(?:\b\d{4}\b|(?:\d{1,2}[\/-]){2}\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b)/gi;
    const numberRegex = /\b\d{3,}(?:,\d{3})*(?:\.\d+)?\b/g;
    totalScore += ((text.match(dateRegex) || []).length + (text.match(numberRegex) || []).length) >= 2 ? 5 : 3;
  
    // 15 additional categories for deep research
    const categories = [
      { keywords: ["leaked", "internal memo", "anonymous source", "confidential", "insider", "whistleblower", "classified"] },
      { keywords: ["predicts", "forecast", "according to", "study finds", "research shows", "announced", "reported", "estimated"] },
      { keywords: ["disruption", "competitive", "market share", "monopoly", "funding round", "price", "benchmark", "shift"] },
      { keywords: ["breakthrough", "patent", "innovation", "novel approach", "prototype", "peer-reviewed", "research paper"], regex: /US-\d{4}\/\d{6}/g },
      { keywords: ["risk assessment", "safety protocol", "liability", "compliance", "mitigation"], regex: /\b\d{1,3}\s*(?:%|percent|per cent)\b/gi },
      { keywords: ["deployed", "launched", "implementation", "adoption rate", "rollout", "pilot program", "case deployment"] },
      { keywords: ["job displacement", "automation", "skills gap", "reskilling", "upskilling", "labor market", "employment trends"] },
      { keywords: ["economic impact", "long-term effects", "societal shift", "policy response", "strategic planning"] },
      { keywords: ["introduction", "conclusion", "summary", "key takeaway", "report explores", "section", "analysis"] },
      { keywords: ["interdisciplinary", "multidisciplinary", "cross-sector", "holistic approach", "industry convergence"] },
      { keywords: ["investment", "series funding", "venture capital", "acquisition", "fundraising", "grants"], regex: /(?:\$|€|£)\d{1,3}(?:,\d{3})*(?:\.\d+)?[MB]?\b/gi },
      { keywords: ["data-driven", "statistics", "figures", "metrics", "analysis"], regex: /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g },
      { keywords: ["ethical implications", "algorithmic bias", "transparency", "accountability", "governance"] },
      { keywords: ["artificial general intelligence", "superintelligence", "long-term prediction", "roadmap", "paradigm shift"] },
      { keywords: ["comprehensive analysis", "research report", "methodology", "findings", "results", "case study", "sources", "detailed study"], regex: /doi:\s*\d{2}\.\d{4}\/\w+/gi }
    ];
  
    categories.forEach(category => {
      totalScore += scoreCategory(text, category.keywords, category.regex);
    });
  
    console.log(`Deep Research Detailed Score: ${totalScore}/80`);
    return totalScore;
  }
  
  