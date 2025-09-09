import React from "react";
import { Box, Container, Paper, Typography } from "@mui/material";
import { UserManagement } from "../components/UserManagement";

export default function UserManagementPage() {
    return (
        <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
            {/* Header Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: 'background.paper', border: '1px solid #E8EBF0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        User Management
                    </Typography>
                </Box>
            </Paper>

            {/* Main Content */}
            <Paper elevation={0} sx={{ bgcolor: 'background.paper', border: '1px solid #E8EBF0', borderRadius: 2 }}>
                <UserManagement />
            </Paper>
        </Container>
    );
}