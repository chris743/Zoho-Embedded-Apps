import React from "react";
import {
  DialogActions,
  Box,
  Button
} from "@mui/material";

/**
 * Modal actions section with edit and close buttons
 */
export function ModalActions({ onClose, onEdit, plan }) {
  return (
    <DialogActions
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderTop: '1px solid #E8EBF0',
        gap: 2,
      }}
    >
      <Box sx={{ flexGrow: 1 }} />

      {onEdit && plan ? (
        <Button
          variant="contained"
          onClick={() => onEdit(plan)}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Edit Plan
        </Button>
      ) : null}

      <Button
        variant="outlined"
        onClick={onClose}
        sx={{
          borderRadius: 2,
          px: 3,
          py: 1,
          textTransform: 'none',
          fontWeight: 500,
        }}
      >
        Close
      </Button>
    </DialogActions>
  );
}
