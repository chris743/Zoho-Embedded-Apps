import React, { useMemo, useState, useEffect } from "react";
import { TextField, CircularProgress, Alert } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { UsersApi } from "../../../api/auth";
import { useAuth } from "../../../contexts/AuthContext";

/**
 * FieldRepresentativeSelector
 * Selects a field representative from users with 'fieldrep' role
 * props:
 *  - value: { id: string, username: string, fullName: string } | null
 *  - onChange: (fieldRep: { id: string, username: string, fullName: string } | null) => void
 */
export function FieldRepresentativeSelector({ value, onChange }) {
    const [fieldReps, setFieldReps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { apiClient } = useAuth();

    const usersApi = useMemo(() => UsersApi(apiClient), [apiClient]);

    // List option normalized to have consistent keys
    const options = useMemo(() => {
        return (fieldReps || [])
            .filter(user => user.role === 'fieldrep' && user.isActive !== false)
            .map((user) => ({
                id: user.id,
                username: user.username || '',
                fullName: user.fullName || user.full_name || '',
                email: user.email || '',
                label: `${user.fullName || user.full_name || user.username} (${user.username})`,
            }));
    }, [fieldReps]);

    const selected = useMemo(() => {
        if (!value || !value.id) return null;
        return options.find(opt => opt.id === value.id) || null;
    }, [value, options]);

    // Load field representatives when component mounts
    useEffect(() => {
        const loadFieldReps = async () => {
            setLoading(true);
            setError('');
            
            try {
                const response = await usersApi.list();
                const userData = Array.isArray(response.data) ? response.data : 
                               response.data?.items || response.data?.value || [];
                setFieldReps(userData);
            } catch (err) {
                setError(err?.response?.data?.message || err?.message || 'Failed to load field representatives');
            } finally {
                setLoading(false);
            }
        };

        loadFieldReps();
    }, [usersApi]);

    const handleChange = (event, newValue) => {
        if (newValue) {
            onChange?.({
                id: newValue.id,
                username: newValue.username,
                fullName: newValue.fullName
            });
        } else {
            onChange?.(null);
        }
    };

    return (
        <div>
            {error && (
                <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            <Autocomplete
                options={options}
                value={selected}
                onChange={handleChange}
                getOptionLabel={(option) => option.label}
                loading={loading}
                loadingText="Loading field representatives..."
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Field Representative"
                        placeholder="Select a field representative"
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
                renderOption={(props, option) => (
                    <div {...props}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>
                                    {option.fullName || option.username}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                    {option.username}
                                    {option.email && ` • ${option.email}`}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
