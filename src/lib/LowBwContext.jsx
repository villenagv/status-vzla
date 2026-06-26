import { createContext, useContext, useState } from 'react';

const LowBwContext = createContext(null);

export function LowBwProvider({ children }) {
  const [lowBw, setLowBw] = useState(() => localStorage.getItem('svzla_lowbw') === '1');
  const toggle = () => {
    setLowBw(v => {
      const next = !v;
      localStorage.setItem('svzla_lowbw', next ? '1' : '0');
      return next;
    });
  };
  return (
    <LowBwContext.Provider value={{ lowBw, toggle }}>
      {children}
    </LowBwContext.Provider>
  );
}

export function useLowBw() {
  return useContext(LowBwContext);
}