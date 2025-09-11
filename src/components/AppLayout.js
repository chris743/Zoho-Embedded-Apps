import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

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
                    backgroundColor: theme.palette.grey[50],
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