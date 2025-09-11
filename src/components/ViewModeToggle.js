import React from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    PhoneAndroid as MobileIcon,
    DesktopWindows as DesktopIcon,
    AutoAwesome as AutoIcon
} from '@mui/icons-material';
import { useViewMode } from '../contexts/ViewModeContext';

export function ViewModeToggle() {
    const { viewMode, setAutoMode, setMobileMode, setDesktopMode } = useViewMode();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleModeChange = (mode) => {
        switch (mode) {
            case 'auto':
                setAutoMode();
                break;
            case 'mobile':
                setMobileMode();
                break;
            case 'desktop':
                setDesktopMode();
                break;
            default:
                break;
        }
        handleClose();
    };

    const getCurrentIcon = () => {
        switch (viewMode) {
            case 'mobile':
                return <MobileIcon />;
            case 'desktop':
                return <DesktopIcon />;
            case 'auto':
            default:
                return <AutoIcon />;
        }
    };

    const getCurrentTooltip = () => {
        switch (viewMode) {
            case 'mobile':
                return 'Mobile View (Click to change)';
            case 'desktop':
                return 'Desktop View (Click to change)';
            case 'auto':
            default:
                return 'Auto View (Click to change)';
        }
    };

    return (
        <Box>
            <Tooltip title={getCurrentTooltip()}>
                <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                >
                    {getCurrentIcon()}
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        minWidth: 180,
                        '& .MuiMenuItem-root': {
                            px: 2,
                            py: 1,
                        },
                    },
                }}
            >
                <MenuItem onClick={() => handleModeChange('auto')} selected={viewMode === 'auto'}>
                    <ListItemIcon>
                        <AutoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        <Box>
                            <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Auto</Box>
                            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Responsive to screen size
                            </Box>
                        </Box>
                    </ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleModeChange('mobile')} selected={viewMode === 'mobile'}>
                    <ListItemIcon>
                        <MobileIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        <Box>
                            <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Mobile</Box>
                            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Always mobile layout
                            </Box>
                        </Box>
                    </ListItemText>
                </MenuItem>

                <MenuItem onClick={() => handleModeChange('desktop')} selected={viewMode === 'desktop'}>
                    <ListItemIcon>
                        <DesktopIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        <Box>
                            <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Desktop</Box>
                            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Always desktop layout
                            </Box>
                        </Box>
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
}
