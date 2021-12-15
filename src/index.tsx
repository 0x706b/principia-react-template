import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'

const domRoot = document.getElementById('app')

if (!domRoot) {
  throw new Error('Failed to find the root element')
}

const root = ReactDOM.hydrateRoot(domRoot)

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
