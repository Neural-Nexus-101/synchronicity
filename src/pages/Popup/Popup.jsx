// Import necessary modules and styles
import React, { useState, useEffect, useRef } from 'react';
import './Popup.css';
import icon from './icon-34-copy.png'; // Tell webpack this JS file uses this image

// Define the Popup component
const Popup = () => {
  // State variables
  const [status, setStatus] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Ref to store the Chrome extension port
  let port = useRef(null);

  // Effect hook to handle the connection and messages
  useEffect(() => {
    try {
      // Connect to the Chrome extension
      port.current = chrome.runtime.connect({ name: 'set-options' });

      // Listen for messages from the background script
      port.current.onMessage.addListener(function (msg) {
        if (msg.action === 'SET_IS_WATCHING') {
          setIsWatching(msg.payload.isWatching);
        }
        if (msg.action === 'SET_IS_PANEL_OPEN') {
          setIsPanelOpen(msg.payload.isPanelOpen);
        }
        setIsConnected(true);
        return true;
      });

      // Handle disconnection
      port.current.onDisconnect.addListener(function () {
        // Additional cleanup if needed
      });
    } catch (error) {
      // Handle connection errors
      // console.error({ message: `port couldn't connect `, error });
    }
  }, [isPanelOpen]);

  // Function to reset posture
  function resetPosture() {
    try {
      // Send message to background script to reset posture
      port.current && port.current.postMessage({ action: 'RESET_POSTURE' });

      // Set status message and clear after a delay
      setStatus('Posture Reset at current position');
      setTimeout(() => setStatus(''), 2500);
    } catch (error) {
      console.log({ message: `resetPosture`, error });
    }
  }

  // Async function to toggle watching state
  async function toggleWatching() {
    try {
      // Send message to background script to toggle watching state
      port.current &&
        port.current.postMessage({
          action: 'TOGGLE_WATCHING',
          payload: { isWatching: !isWatching },
        });

      // Update local state
      setIsWatching((isWatching) => !isWatching);
    } catch (error) {
      console.log({ message: `toggleWatching`, error });
    }
  }

  // Async function to open the video popup
  async function openVideoPopup() {
    // Create a new popup window
    chrome.windows.create({
      url: 'options.html',
      type: 'popup',
      height: 400,
      width: 700,
    });

    // Set the panel open state and handle reconnection
    await setIsPanelOpen(true);
    // TODO: handle reconnect from popup after options panel opens
    // Faking it for now by forcing a reload of the page
    setTimeout(() => window.location.reload(), 600);
  }

  // Render the component
  return (
    <div className="popup-wrapper">
      <div>
        <img src={icon} alt="Icon" style={{ height: '250px', width: '250px' }} /> {/* Display the image */}
        {/* Rest of your component */}
      </div>
      <div className="button-container">
        {!isWatching && !isPanelOpen && (
          <button className="btn btn-open" onClick={() => openVideoPopup()}>
            Open Popup
          </button>
        )}
        {isWatching && (
          <button className="btn btn-reset" onClick={() => resetPosture()}>
            Reset Posture
          </button>
        )}
        {isConnected && (
          <button
            className={`btn ${isWatching ? 'btn-stop' : 'btn-start'}`}
            onClick={() => toggleWatching()}
          >
            {isWatching ? 'Stop' : 'Start'}
          </button>
        )}
      </div>
      <p>{status}</p>
    </div>
  );
};

// Export the Popup component
export default Popup;
