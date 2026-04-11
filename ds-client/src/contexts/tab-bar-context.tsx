import React, { createContext, useContext } from 'react';

const TabBarContext = createContext<React.ReactNode>(null);

export const TabBarProvider = TabBarContext.Provider;

export function useTabBar() {
  return useContext(TabBarContext);
}
