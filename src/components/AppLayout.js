import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Sidebar } from './Sidebar';
import { useViewMode } from '../contexts/ViewModeContext';

export function AppLayout({ children }) {
    const theme = useTheme();
    const actualIsMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { viewMode } = useViewMode();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Determine if we should use mobile layout
    const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && actualIsMobile);

    const handleMobileToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar 
                mobileOpen={mobileOpen}
                onMobileToggle={handleMobileToggle}
                isMobile={isMobile}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    backgroundColor: theme.palette.background.default,
                    minHeight: '100vh',
                    transition: theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    // Add padding for mobile header
                    pt: isMobile ? 7 : 0,
                    // Ensure content doesn't get hidden behind sidebar
                    ml: isMobile ? 0 : 'auto',
                    width: isMobile ? '100%' : 'auto',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}