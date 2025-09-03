import React, { useState, useMemo } from 'react';
import {
    Box,
    TextField,
    Popover,
    Paper,
    Typography,
    IconButton,
    Stack,
    Button,
    Chip,
    Divider
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    DateRange as DateRangeIcon,
    Close as CloseIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { format, startOfDay, endOfDay, differenceInDays, addDays, subDays } from 'date-fns';

const PRESET_RANGES = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'Next 3 days', days: 3 },
    { label: 'Next 7 days', days: 7 },
    { label: 'Next 14 days', days: 14 },
    { label: 'Next 30 days', days: 30 }
];

export function DateRangePicker({ 
    startDate, 
    endDate, 
    onChange, 
    placeholder = "Select date range",
    size = "small",
    sx = {}
}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);
    const [isSelectingEnd, setIsSelectingEnd] = useState(false);

    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setIsSelectingEnd(false);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setIsSelectingEnd(false);
    };

    const handleDateSelect = (date) => {
        if (!isSelectingEnd || !tempStartDate) {
            // Start selecting
            setTempStartDate(date);
            setTempEndDate(null);
            setIsSelectingEnd(true);
        } else {
            // End selecting
            if (date < tempStartDate) {
                // If end date is before start date, swap them
                setTempEndDate(tempStartDate);
                setTempStartDate(date);
            } else {
                setTempEndDate(date);
            }
            setIsSelectingEnd(false);
        }
    };

    const handleApply = () => {
        if (tempStartDate && tempEndDate) {
            onChange(tempStartDate, tempEndDate);
            handleClose();
        }
    };

    const handlePresetRange = (days) => {
        const today = startOfDay(new Date());
        const start = days === 0 ? today : addDays(today, 1);
        const end = addDays(today, days);
        onChange(start, end);
        handleClose();
    };

    const handleClear = () => {
        onChange(null, null);
        handleClose();
    };

    const formatDateRange = () => {
        if (!startDate || !endDate) return placeholder;
        
        const startStr = format(startDate, 'MMM dd');
        const endStr = format(endDate, 'MMM dd, yyyy');
        
        if (startDate.getFullYear() === endDate.getFullYear()) {
            return `${startStr} - ${endStr}`;
        }
        return `${format(startDate, 'MMM dd, yyyy')} - ${endStr}`;
    };

    const getDaysDifference = () => {
        if (!startDate || !endDate) return 0;
        return differenceInDays(endDate, startDate) + 1;
    };

    const generateCalendarDays = () => {
        const today = new Date();
        const currentMonth = tempStartDate ? tempStartDate.getMonth() : today.getMonth();
        const currentYear = tempStartDate ? tempStartDate.getFullYear() : today.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            days.push(date);
        }
        
        return days;
    };

    const isDateInRange = (date) => {
        if (!tempStartDate || !tempEndDate) return false;
        return date >= tempStartDate && date <= tempEndDate;
    };

    const isDateSelected = (date) => {
        return (tempStartDate && format(date, 'yyyy-MM-dd') === format(tempStartDate, 'yyyy-MM-dd')) ||
               (tempEndDate && format(date, 'yyyy-MM-dd') === format(tempEndDate, 'yyyy-MM-dd'));
    };

    const isDateToday = (date) => {
        return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    };

    const calendarDays = useMemo(() => generateCalendarDays(), [tempStartDate]);

    return (
        <>
            <TextField
                fullWidth
                size={size}
                value={formatDateRange()}
                onClick={handleClick}
                placeholder={placeholder}
                InputProps={{
                    readOnly: true,
                    startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: startDate && endDate && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            sx={{ mr: -1 }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )
                }}
                sx={{
                    cursor: 'pointer',
                    '& .MuiInputBase-input': {
                        cursor: 'pointer'
                    },
                    ...sx
                }}
            />

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.08)'
                    }
                }}
            >
                <Paper sx={{ p: 3, minWidth: 400 }}>
                    <Stack spacing={3}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={600}>
                                Select Date Range
                            </Typography>
                            <IconButton size="small" onClick={handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        {/* Preset Ranges */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                                Quick Select
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {PRESET_RANGES.map((preset) => (
                                    <Chip
                                        key={preset.label}
                                        label={preset.label}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handlePresetRange(preset.days)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'primary.main',
                                                color: 'white',
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Calendar */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                                {tempStartDate ? format(tempStartDate, 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}
                            </Typography>
                            
                            {/* Day headers */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                    <Typography key={day} variant="caption" textAlign="center" fontWeight={600} color="text.secondary">
                                        {day}
                                    </Typography>
                                ))}
                            </Box>

                            {/* Calendar grid */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                                {calendarDays.map((date, index) => {
                                    const isCurrentMonth = date.getMonth() === (tempStartDate ? tempStartDate.getMonth() : new Date().getMonth());
                                    const isInRange = isDateInRange(date);
                                    const isSelected = isDateSelected(date);
                                    const isToday = isDateToday(date);

                                    return (
                                        <Button
                                            key={index}
                                            size="small"
                                            onClick={() => handleDateSelect(date)}
                                            sx={{
                                                minWidth: 40,
                                                height: 40,
                                                borderRadius: 1,
                                                fontSize: '0.875rem',
                                                fontWeight: isSelected ? 600 : 400,
                                                color: !isCurrentMonth ? 'text.disabled' : 
                                                       isSelected ? 'white' : 
                                                       isToday ? 'primary.main' : 'text.primary',
                                                backgroundColor: isSelected ? 'primary.main' :
                                                               isInRange ? 'primary.light' :
                                                               isToday ? 'primary.light' : 'transparent',
                                                '&:hover': {
                                                    backgroundColor: isSelected ? 'primary.dark' :
                                                                   isInRange ? 'primary.main' :
                                                                   'action.hover'
                                                },
                                                border: isToday && !isSelected ? '2px solid' : 'none',
                                                borderColor: isToday && !isSelected ? 'primary.main' : 'transparent'
                                            }}
                                        >
                                            {date.getDate()}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Selection Summary */}
                        {tempStartDate && tempEndDate && (
                            <Box sx={{ 
                                p: 2, 
                                backgroundColor: 'primary.light', 
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'primary.main'
                            }}>
                                <Typography variant="body2" fontWeight={600} color="primary.dark">
                                    {format(tempStartDate, 'MMM dd, yyyy')} - {format(tempEndDate, 'MMM dd, yyyy')}
                                </Typography>
                                <Typography variant="caption" color="primary.dark">
                                    {getDaysDifference()} day{getDaysDifference() !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        )}

                        {/* Actions */}
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button onClick={handleClose} variant="outlined">
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleApply} 
                                variant="contained"
                                disabled={!tempStartDate || !tempEndDate}
                                startIcon={<CheckIcon />}
                            >
                                Apply
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Popover>
        </>
    );
}
