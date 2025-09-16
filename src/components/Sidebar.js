import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Typography,
    Divider,
    Collapse,
    Button,
    useTheme,
    alpha
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    People as PeopleIcon,
    CalendarMonth as CalendarIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    ExpandLess,
    ExpandMore
} from '@mui/icons-material';
import { ViewModeToggle } from './ViewModeToggle';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 64;

const menuItems = [
    {
        id: 'harvest',
        label: 'Harvest Management',
        icon: CalendarIcon,
        children: [
            {
                id: 'harvest-plans',
                label: 'Harvest Plans',
                path: '/harvestplans'
            },
            {
                id: 'process-plans',
                label: 'Process Plans',
                path: '/processplans'
            }
        ]
    },
    {
        id: 'contractors',
        label: 'Contractors',
        icon: PeopleIcon,
        path: '/harvestcontractors'
    },
    {
        id: 'admin',
        label: 'Administration',
        icon: SettingsIcon,
        children: [
            {
                id: 'users',
                label: 'User Management',
                path: '/users',
                requiresRole: ['admin']
            },
            {
                id: 'placeholder-growers',
                label: 'Placeholder Growers',
                path: '/placeholder-growers'
            }
        ]
    }
];

export function Sidebar({ mobileOpen, onMobileToggle, isMobile }) {
    const [collapsed, setCollapsed] = useState(false); // Always start expanded
    const [expandedItems, setExpandedItems] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { user, logout } = useAuth();

    const hasRole = (requiredRoles) => {
        if (!requiredRoles || requiredRoles.length === 0) return true;
        if (!user?.role) return false;
        return requiredRoles.includes(user.role);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleToggleCollapse = () => {
        if (isMobile) {
            onMobileToggle();
        } else {
            setCollapsed(!collapsed);
            // Reset expanded items when collapsing
            if (!collapsed) {
                setExpandedItems({});
            }
        }
    };

    const handleItemClick = (item) => {
        if (item.children) {
            if (collapsed) {
                // If collapsed, expand sidebar and show submenu
                setCollapsed(false);
                setExpandedItems({ [item.id]: true });
            } else {
                // Toggle submenu
                setExpandedItems(prev => ({
                    ...prev,
                    [item.id]: !prev[item.id]
                }));
            }
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const handleSubItemClick = (path) => {
        navigate(path);
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const renderMenuItem = (item) => {
        // Check if user has permission to see this item
        if (!hasRole(item.requiresRole)) return null;
        
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems[item.id];
        const active = item.path ? isActive(item.path) : 
                      item.children?.some(child => hasRole(child.requiresRole) && isActive(child.path));

        return (
            <React.Fragment key={item.id}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => handleItemClick(item)}
                        sx={{
                            minHeight: 48,
                            justifyContent: collapsed ? 'center' : 'initial',
                            px: 2.5,
                            py: 1.5,
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            color: active ? theme.palette.primary.main : theme.palette.text.primary,
                            '&:hover': {
                                backgroundColor: active ? 
                                    alpha(theme.palette.primary.main, 0.15) : 
                                    alpha(theme.palette.text.primary, 0.08),
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: collapsed ? 0 : 3,
                                justifyContent: 'center',
                                color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                            }}
                        >
                            <item.icon />
                        </ListItemIcon>
                        {!collapsed && (
                            <>
                                <ListItemText 
                                    primary={item.label} 
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: active ? 600 : 500
                                    }}
                                />
                                {hasChildren && (
                                    isExpanded ? <ExpandLess /> : <ExpandMore />
                                )}
                            </>
                        )}
                    </ListItemButton>
                </ListItem>

                {!collapsed && hasChildren && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.children.filter(child => hasRole(child.requiresRole)).map((child) => (
                                <ListItem key={child.id} disablePadding>
                                    <ListItemButton
                                        onClick={() => handleSubItemClick(child.path)}
                                        sx={{
                                            pl: 6,
                                            pr: 2.5,
                                            py: 1,
                                            borderRadius: 1,
                                            mx: 1,
                                            mb: 0.5,
                                            backgroundColor: isActive(child.path) ? 
                                                alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                            color: isActive(child.path) ? 
                                                theme.palette.primary.main : theme.palette.text.secondary,
                                            '&:hover': {
                                                backgroundColor: isActive(child.path) ? 
                                                    alpha(theme.palette.primary.main, 0.15) : 
                                                    alpha(theme.palette.text.primary, 0.08),
                                            },
                                        }}
                                    >
                                        <ListItemText 
                                            primary={child.label}
                                            primaryTypographyProps={{
                                                fontSize: '0.8125rem',
                                                fontWeight: isActive(child.path) ? 600 : 400
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>
                )}
            </React.Fragment>
        );
    };

    return (
        <>
            {/* Toggle button when sidebar is collapsed or on mobile */}
            {(collapsed || isMobile) && (
                <IconButton
                    onClick={handleToggleCollapse}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        zIndex: theme.zIndex.drawer + 1,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            )}

            <Drawer
                variant={isMobile ? "temporary" : "permanent"}
                open={isMobile ? mobileOpen : !collapsed}
                onClose={isMobile ? onMobileToggle : undefined}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile
                }}
                sx={{
                    width: isMobile ? DRAWER_WIDTH : (collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH),
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    '& .MuiDrawer-paper': {
                        width: isMobile ? DRAWER_WIDTH : (collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH),
                        transition: isMobile ? 'none' : theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                        backgroundColor: theme.palette.background.paper,
                        borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: isMobile ? theme.shadows[16] : 'none',
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        p: collapsed ? 1 : 2,
                        minHeight: 64,
                    }}
                >
                    {!collapsed && (
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Cobblestone
                        </Typography>
                    )}
                    {!collapsed && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ViewModeToggle />
                            <IconButton 
                                onClick={handleToggleCollapse}
                                size="small"
                                sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1,
                                }}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>
                
                <Divider />
                
                <List sx={{ pt: 1, flexGrow: 1 }}>
                    {menuItems.map(renderMenuItem)}
                </List>

                {/* User Section */}
                {!collapsed && (
                    <>
                        <Divider />
                        <Box sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Signed in as
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                                {user?.fullName || user?.username || 'User'}
                            </Typography>
                            <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                startIcon={<LogoutIcon />}
                                onClick={handleLogout}
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    fontWeight: 500
                                }}
                            >
                                Sign Out
                            </Button>
                        </Box>
                    </>
                )}
            </Drawer>
        </>
    );
}