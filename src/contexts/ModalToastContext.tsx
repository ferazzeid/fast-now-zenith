import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalToastContextType {
  isModalEditing: boolean;
  setModalEditing: (editing: boolean) => void;
  suppressToasts: boolean;
}

const ModalToastContext = createContext<ModalToastContextType | undefined>(undefined);

export const useModalToastContext = () => {
  const context = useContext(ModalToastContext);
  if (!context) {
    throw new Error('useModalToastContext must be used within a ModalToastProvider');
  }
  return context;
};

interface ModalToastProviderProps {
  children: ReactNode;
}

export const ModalToastProvider = ({ children }: ModalToastProviderProps) => {
  const [isModalEditing, setIsModalEditing] = useState(false);

  const setModalEditing = (editing: boolean) => {
    console.log('🔇 Modal editing state changed:', editing);
    setIsModalEditing(editing);
  };

  return (
    <ModalToastContext.Provider
      value={{
        isModalEditing,
        setModalEditing,
        suppressToasts: isModalEditing,
      }}
    >
      {children}
    </ModalToastContext.Provider>
  );
};