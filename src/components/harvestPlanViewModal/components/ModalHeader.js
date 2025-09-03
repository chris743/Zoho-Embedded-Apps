import React, { useMemo } from "react";
import {
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import formatDate from "../utils/dateutils";

/**
 * Modal header with title and action buttons
 */
export function ModalHeader({ 
  plan, 
  block, 
  onClose, 
  onCopyAll 
}) {
  const title = useMemo(() => {
    if (!plan) return "View Harvest Plan";
    const blockName = block?.NAME ?? block?.name ?? `Block ${plan.grower_block_id}`;
    return `View Harvest Plan — ${formatDate(plan.date)} • ${blockName}`;
  }, [plan, block]);

  return (
    <DialogTitle
      sx={{
        py: 3,
        px: 4,
        pr: 12,
        bgcolor: 'background.paper',
        borderBottom: '1px solid #E8EBF0',
      }}
    >
      <Typography variant="h5" fontWeight={600} color="text.primary">
        {title}
      </Typography>

      <Box sx={{ position: 'absolute', right: 16, top: 16, display: 'flex', gap: 1 }}>
        <Tooltip title="Copy record + associations (JSON)">
          <IconButton
            size="small"
            onClick={onCopyAll}
            sx={{
              bgcolor: 'background.surface',
              border: '1px solid #E0E4E7',
              '&:hover': { bgcolor: '#E8EBF0' },
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <IconButton
          onClick={onClose}
          sx={{
            bgcolor: 'error.main',
            color: 'white',
            '&:hover': { bgcolor: 'error.dark' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
  );
}
