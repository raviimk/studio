
'use client';

import React, { createContext, useState, useContext, useMemo } from 'react';
import { useToast } from './use-toast';

interface SystemStateContextType {
  isDeleteDisabled: boolean;
  setDeleteDisabled: (disabled: boolean) => void;
  resetDeleteButton: () => void;
}

const SystemStateContext = createContext<SystemStateContextType | undefined>(undefined);

export function SystemStateProvider({ children }: { children: React.ReactNode }) {
  const [isDeleteDisabled, setDeleteDisabled] = useState(false);
  const { toast } = useToast();

  const resetDeleteButton = () => {
    if (isDeleteDisabled) {
        setDeleteDisabled(false);
        toast({
            title: 'Deletion Re-enabled',
            description: 'The "Delete All Data" button has been re-enabled.',
        });
    }
  };

  const value = useMemo(() => ({
    isDeleteDisabled,
    setDeleteDisabled,
    resetDeleteButton,
  }), [isDeleteDisabled]);

  return (
    <SystemStateContext.Provider value={value}>
      {children}
    </SystemStateContext.Provider>
  );
}

export function useSystemState() {
  const context = useContext(SystemStateContext);
  if (context === undefined) {
    throw new Error('useSystemState must be used within a SystemStateProvider');
  }
  return context;
}
