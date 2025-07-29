import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalRootProps {
  children: ReactNode;
}

export const ModalRoot = ({ children }: ModalRootProps) => {
  // Create portal to render modal outside of main component tree
  // This prevents animation interference from parent components
  return createPortal(
    <div className="modal-root">
      {children}
    </div>,
    document.body
  );
};