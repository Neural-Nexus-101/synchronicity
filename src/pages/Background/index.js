// Set badge text to 'OFF' for the browser action
chrome.browserAction.setBadgeText({ text: 'OFF' });

// Connect to port for messaging to content script
chrome.runtime.onConnect.addListener(function (port) {
  // Listen to options script and send posture message to content script
  if (port.name === 'relay-detection') {
    port.onMessage.addListener(handlePostureMessage);
  }
});

/**
 * Handle posture messages from content script
 *
 * @param {Object} msg - Posture message received
 */
function handlePostureMessage(msg) {
  // Query the active tabs in the current window
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    function (tabs) {
      // Check if there is an active tab
      if (!tabs[0]) return;

      // Send the posture message to the active tab
      chrome.tabs.sendMessage(tabs[0].id, msg);
    }
  );
}
