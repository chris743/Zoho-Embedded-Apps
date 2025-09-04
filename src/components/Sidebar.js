import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    useTheme,
    alpha
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Home as HomeIcon,
    People as PeopleIcon,
    CalendarMonth as CalendarIcon,
    Business as BusinessIcon,
    ExpandLess,
    ExpandMore
} from '@mui/icons-material';

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
            }
        ]
    },
    {
        id: 'contractors',
        label: 'Contractors',
        icon: PeopleIcon,
        path: '/harvestcontractors'
    }
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(true);
    const [expandedItems, setExpandedItems] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const handleToggleCollapse = () => {
        setCollapsed(!collapsed);
        // Reset expanded items when collapsing
        if (!collapsed) {
            setExpandedItems({});
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
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems[item.id];
        const active = item.path ? isActive(item.path) : 
                      item.children?.some(child => isActive(child.path));

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
                            {item.children.map((child) => (
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
            {/* Toggle button when sidebar is collapsed */}
            {collapsed && (
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
                variant="permanent"
                open={!collapsed}
                sx={{
                    width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    '& .MuiDrawer-paper': {
                        width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                        backgroundColor: theme.palette.background.paper,
                        borderRight: `1px solid ${theme.palette.divider}`,
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
                    )}
                </Box>
                
                <Divider />
                
                <List sx={{ pt: 1 }}>
                    {menuItems.map(renderMenuItem)}
                </List>
            </Drawer>
        </>
    );
}