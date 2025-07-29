import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AnimationProvider } from './components/AnimationController'
import { WalkingStatsProvider } from './contexts/WalkingStatsContext'

createRoot(document.getElementById("root")!).render(
  <AnimationProvider>
    <WalkingStatsProvider>
      <App />
    </WalkingStatsProvider>
  </AnimationProvider>
);
