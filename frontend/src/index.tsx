import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { doLogin } from './services/UserService';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

doLogin().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
