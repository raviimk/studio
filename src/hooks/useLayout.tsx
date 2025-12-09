
'use client';

import React, { createContext, useState, useContext, useMemo } from 'react';

interface LayoutContextType {
  isFullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isFullscreen, setFullscreen] = useState(false);

  const value = useMemo(() => ({
    isFullscreen,
    setFullscreen,
  }), [isFullscreen]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
