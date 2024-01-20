// Import React and ReactDOM for rendering
import React from 'react';
import { render } from 'react-dom';

// Import the Options component
import Options from './Options';

// Render the Options component with a title prop
render(
  <Options title={'Settings'} />,
  window.document.querySelector('#app-container')
);

// Enable hot module replacement if available
if (module.hot) module.hot.accept();
