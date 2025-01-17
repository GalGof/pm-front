import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'

import reportWebVitals from './reportWebVitals';
import './index.css';
import App from './app/App';
import store from './app/Store'


const root = ReactDOM.createRoot(document.getElementById('root'));
if (0) {
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
} else {
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
