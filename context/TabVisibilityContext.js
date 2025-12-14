// context/TabVisibilityContext.js
import React, { createContext, useState, useContext } from 'react';

// Create the context
const TabVisibilityContext = createContext();

// Custom hook to access context
export const useTabVisibilityContext = () => {
    return useContext(TabVisibilityContext);
};

// Provider component
export const TabVisibilityProvider = ({ children }) => {
    const [showTabs, setShowTabs] = useState(true);  // Default to show tabs

    return (
        <TabVisibilityContext.Provider value={{ showTabs, setShowTabs }}>
            {children}
        </TabVisibilityContext.Provider>
    );
};
