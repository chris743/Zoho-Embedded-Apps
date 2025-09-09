import React, { useState, useEffect, useMemo } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Box,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Stack,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    VpnKey as KeyIcon
} from '@mui/icons-material';
import { UsersApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { UserDialog } from './dialogs/UserDialog';
import { PasswordResetDialog } from './dialogs/PasswordResetDialog';
import { DeleteUserDialog } from './dialogs/DeleteUserDialog';

const USER_ROLES = [
    { value: 'admin', label: 'Administrator', color: 'error' },
    { value: 'manager', label: 'Manager', color: 'warning' },
    { value: 'user', label: 'User', color: 'primary' },
    { value: 'readonly', label: 'Read Only', color: 'default' }
];

export function UserManagement() {
    const { apiClient, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Dialog states
    const [userDialog, setUserDialog] = useState({ open: false, user: null, isEdit: false });
    const [passwordDialog, setPasswordDialog] = useState({ open: false, userId: null, userName: '' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });

    const usersApi = useMemo(() => UsersApi(apiClient), [apiClient]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await usersApi.list();
            const userData = Array.isArray(response.data) ? response.data : 
                           response.data?.items || response.data?.value || [];
            setUsers(userData);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const searchLower = search.toLowerCase();
        return users.filter(user => 
            (user.username || '').toLowerCase().includes(searchLower) ||
            (user.fullName || '').toLowerCase().includes(searchLower) ||
            (user.email || '').toLowerCase().includes(searchLower) ||
            (user.role || '').toLowerCase().includes(searchLower)
        );
    }, [users, search]);

    const handleCreateUser = () => {
        setUserDialog({ open: true, user: null, isEdit: false });
    };

    const handleEditUser = (user) => {
        setUserDialog({ open: true, user, isEdit: true });
    };

    const handleResetPassword = (user) => {
        setPasswordDialog({ open: true, userId: user.id, userName: user.username });
    };

    const handleDeleteUser = (user) => {
        setDeleteDialog({ open: true, userId: user.id, userName: user.username });
    };

    const handleUserDialogClose = () => {
        setUserDialog({ open: false, user: null, isEdit: false });
    };

    const handlePasswordDialogClose = () => {
        setPasswordDialog({ open: false, userId: null, userName: '' });
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialog({ open: false, userId: null, userName: '' });
    };

    const handleSuccess = (message) => {
        showSuccess(message);
        loadUsers(); // Refresh the user list
    };

    const getRoleColor = (role) => {
        const roleConfig = USER_ROLES.find(r => r.value === role);
        return roleConfig?.color || 'default';
    };

    const getRoleLabel = (role) => {
        const roleConfig = USER_ROLES.find(r => r.value === role);
        return roleConfig?.label || role;
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError('');
        setTimeout(() => setSuccess(''), 4000);
    };

    const showError = (message) => {
        setError(message);
        setSuccess('');
    };

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">
                        User Management - {filteredUsers.length} Users
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={handleCreateUser}
                            sx={{ 
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            New User
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={loadUsers}
                            disabled={loading}
                            sx={{ 
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    size="small"
                    label="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                />
            </Box>

            <TableContainer sx={{ maxHeight: "calc(100vh - 400px)" }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="text.secondary">Loading users...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="text.secondary">
                                        {search ? 'No users match the search criteria' : 'No users found'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {user.username}
                                        {user.id === currentUser?.id && (
                                            <Chip size="small" label="You" color="info" sx={{ ml: 1, fontSize: '0.7rem' }} />
                                        )}
                                    </TableCell>
                                    <TableCell>{user.fullName || '-'}</TableCell>
                                    <TableCell>{user.email || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getRoleLabel(user.role)}
                                            size="small"
                                            color={getRoleColor(user.role)}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.isActive ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={user.isActive ? 'success' : 'default'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin.toLocaleDateString() : new Date(user.lastLogin).toLocaleDateString()) : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit User">
                                                <IconButton size="small" onClick={() => handleEditUser(user)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reset Password">
                                                <IconButton size="small" onClick={() => handleResetPassword(user)}>
                                                    <KeyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {user.id !== currentUser?.id && (
                                                <Tooltip title="Delete User">
                                                    <IconButton 
                                                        size="small" 
                                                        color="error"
                                                        onClick={() => handleDeleteUser(user)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ p: 2, borderTop: "1px solid rgba(224, 224, 224, 1)" }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredUsers.length} of {users.length} users
                </Typography>
            </Box>

            {/* User Dialog */}
            <UserDialog
                open={userDialog.open}
                onClose={handleUserDialogClose}
                user={userDialog.user}
                isEdit={userDialog.isEdit}
                onSuccess={handleSuccess}
            />

            {/* Password Reset Dialog */}
            <PasswordResetDialog
                open={passwordDialog.open}
                onClose={handlePasswordDialogClose}
                userId={passwordDialog.userId}
                onSuccess={handleSuccess}
            />

            {/* Delete User Dialog */}
            <DeleteUserDialog
                open={deleteDialog.open}
                onClose={handleDeleteDialogClose}
                userId={deleteDialog.userId}
                userName={deleteDialog.userName}
                onSuccess={handleSuccess}
            />
        </Paper>
    );
}