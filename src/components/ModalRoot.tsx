import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalRootProps {
  children: ReactNode;
}

export const ModalRoot = ({ children }: ModalRootProps) => {
  // Create portal to render modal outside of main component tree
  // This prevents animation interference from parent components
  return createPortal(
    <>
      {/* Stable backdrop layer to prevent blinking and system interference */}
      <div className="fixed inset-0 z-40 bg-transparent" 
           style={{ 
             transform: 'translate3d(0, 0, 0)',
             willChange: 'transform',
             backfaceVisibility: 'hidden'
           }} />
      {/* Secondary stabilizing layer */}
      <div className="fixed inset-0 z-45 bg-transparent pointer-events-none"
           style={{ 
             transform: 'translate3d(0, 0, 0)',
             willChange: 'transform'
           }} />
      <div className="modal-root relative z-50"
           style={{ 
             transform: 'translate3d(0, 0, 0)',
             willChange: 'transform',
             backfaceVisibility: 'hidden',
             isolation: 'isolate'
           }}>
        {children}
      </div>
    </>,
    document.body
  );
};