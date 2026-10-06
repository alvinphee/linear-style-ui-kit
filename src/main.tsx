import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './shadcn-default.css'

// The theme comparison (#/compare) loads the app in a frame with
// "?shadcn-default=colours,text,radius,details": each part named gives way
// to shadcn's default theme (src/shadcn-default.css).
const shadcnDefault = new URLSearchParams(window.location.search).get('shadcn-default')
if (shadcnDefault !== null) document.documentElement.dataset.shadcnDefault = shadcnDefault.split(',').join(' ')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
