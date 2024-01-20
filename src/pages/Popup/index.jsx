// Import necessary modules and components
import React from 'react';
import { render } from 'react-dom';

// Import the Popup component and styles
import Popup from './Popup';
import './index.css';

// Render the Popup component into the specified container
render(<Popup />, window.document.querySelector('#app-container'));

// Enable hot module replacement if available
if (module.hot) module.hot.accept();
