import React, { createContext, useContext, useState } from 'react';

interface HeaderContextType {
  headerContent: React.ReactNode | null;
  setHeaderContent: (content: React.ReactNode | null) => void;
}

const HeaderContext = createContext<HeaderContextType>({
  headerContent: null,
  setHeaderContent: () => {},
});

export const HeaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [headerContent, setHeaderContent] = useState<React.ReactNode | null>(null);
  return (
    <HeaderContext.Provider value={{ headerContent, setHeaderContent }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);
