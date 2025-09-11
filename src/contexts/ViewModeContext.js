import React, { createContext, useContext, useState } from 'react';

const ViewModeContext = createContext();

export const useViewMode = () => {
    const context = useContext(ViewModeContext);
    if (!context) {
        throw new Error('useViewMode must be used within a ViewModeProvider');
    }
    return context;
};

export const ViewModeProvider = ({ children }) => {
    // Get initial preference from localStorage or default to 'auto'
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('harvest-planner-view-mode');
        return saved || 'auto'; // 'auto', 'mobile', 'desktop'
    });

    const toggleViewMode = () => {
        const newMode = viewMode === 'mobile' ? 'desktop' : 'mobile';
        setViewMode(newMode);
        localStorage.setItem('harvest-planner-view-mode', newMode);
    };

    const setAutoMode = () => {
        setViewMode('auto');
        localStorage.setItem('harvest-planner-view-mode', 'auto');
    };

    const setMobileMode = () => {
        setViewMode('mobile');
        localStorage.setItem('harvest-planner-view-mode', 'mobile');
    };

    const setDesktopMode = () => {
        setViewMode('desktop');
        localStorage.setItem('harvest-planner-view-mode', 'desktop');
    };

    return (
        <ViewModeContext.Provider value={{
            viewMode,
            toggleViewMode,
            setAutoMode,
            setMobileMode,
            setDesktopMode
        }}>
            {children}
        </ViewModeContext.Provider>
    );
};
