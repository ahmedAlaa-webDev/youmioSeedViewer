// Listen for the command to show NFTs
chrome.commands.onCommand.addListener((command) => {
  if (command === 'show-nfts') {
    openSidePanel();
  }
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  openSidePanel(tab);
});

/**
 * Opens the side panel to display NFTs
 * @param {Object} tab - The current tab (optional)
 */
function openSidePanel(tab) {
  // If tab is provided, open side panel for that specific window
  if (tab && tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId })
      .then(() => {
        console.log('Side panel opened successfully');
      })
      .catch((error) => {
        console.error('Error opening side panel:', error);
      });
  } else {
    // Otherwise, open for the current window
    chrome.windows.getCurrent((window) => {
      chrome.sidePanel.open({ windowId: window.id })
        .then(() => {
          console.log('Side panel opened successfully');
        })
        .catch((error) => {
          console.error('Error opening side panel:', error);
        });
    });
  }
}

// Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('OpenSea NFT Viewer extension installed');
  } else if (details.reason === 'update') {
    console.log('OpenSea NFT Viewer extension updated');
  }
});

// Handle messages from panel.js for fetching staking points
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchStakingPoints') {
    // Fetch staking points from Youmio API
    const { tokenId, nftType } = request;
    const url = `https://staking.youmio.ai/api/seeds/points?id=${tokenId}&type=${nftType}`;
    
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          // Not an error - just means no staking data for this NFT
          if (response.status === 404) {
            console.log(`[Staking] No data found for token ${tokenId} (${nftType}) - returning 0 points`);
          } else {
            console.warn(`[Staking] API error for token ${tokenId}: HTTP ${response.status}`);
          }
          sendResponse({ success: true, points: 0 }); // Still success, just 0 points
          return null; // Don't try to parse JSON
        }
        return response.json();
      })
      .then(data => {
        if (!data) return; // Already handled above
        
        console.log(`[Staking] Data for token ${tokenId}:`, JSON.stringify(data));
        const points = data.points !== undefined ? data.points : (data.totalPoints || data.stakingPoints || 0);
        console.log(`[Staking] Token ${tokenId} has ${points} points`);
        sendResponse({ success: true, points: points });
      })
      .catch(error => {
        console.warn(`[Staking] Network error for token ${tokenId}:`, error.message);
        sendResponse({ success: true, points: 0 }); // Network error, assume 0 points
      });
    
    // Return true to indicate async response
    return true;
  }
});