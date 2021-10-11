import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'

const root = document.getElementById('app')

if (!root) {
  throw new Error('Failed to find the root element')
}

ReactDOM.createRoot(root, { hydrate: true }).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
