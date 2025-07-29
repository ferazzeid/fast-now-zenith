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
      {/* Invisible static backdrop to block animation interference */}
      <div className="fixed inset-0 z-40 bg-transparent pointer-events-none" />
      <div className="modal-root relative z-50">
        {children}
      </div>
    </>,
    document.body
  );
};