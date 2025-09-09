import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";


export default function ConfirmDialog({ open, title, message, onCancel, onConfirm, confirmText = "Delete", confirmColor = "error" }) {
return (
<Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
<DialogTitle>{title}</DialogTitle>
<DialogContent><Typography sx={{ mt: 1 }}>{message}</Typography></DialogContent>
<DialogActions>
<Button onClick={onCancel}>Cancel</Button>
<Button variant="contained" color={confirmColor} onClick={onConfirm}>{confirmText}</Button>
</DialogActions>
</Dialog>
);
}