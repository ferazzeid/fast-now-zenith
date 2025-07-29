import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AnimationProvider } from './components/AnimationController'

createRoot(document.getElementById("root")!).render(
  <AnimationProvider>
    <App />
  </AnimationProvider>
);
