import {
    Box, Typography
} from "@mui/material";

import { commonStyles } from "../../utils/theme";


export function KV({ label, value, mono = false }) {
    return (
        <Box sx={{ mb: 0.8 }}>
            <Typography
                variant="caption"
                sx={{
                    ...commonStyles.fieldLabel,
                    display: 'block',
                    mb: 0.5
                }}
            >
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    ...commonStyles.fieldValue,
                    fontFamily: mono ? "monospace" : "inherit",
                    fontSize: '0.875rem'
                }}
            >
                {value ?? "-"}
            </Typography>
        </Box>
    );
}