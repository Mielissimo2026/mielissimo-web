import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App' // <--- ESTO ES LO IMPORTANTE: Traemos el cerebro de la app
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Al renderizar <App />, cargamos el Banner, el Router y todo lo que arreglamos */}
    <App /> 
    <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
  </StrictMode>,
)