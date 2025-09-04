import React from 'react';
import { Box, useTheme } from '@mui/material';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }) {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
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
                }}
            >
                {children}
            </Box>
        </Box>
    );
}