import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box, Container, Typography, ThemeProvider, CssBaseline } from "@mui/material";
import { zohoTheme } from "./utils/theme";
import { ZohoAuthWrapper } from "./components/ZohoAuthWrapper";
import { AppLayout } from "./components/AppLayout";
import HarvestContractorsPage from "./pages/HarvestContractorsPage";
import HarvestPlannerPage from "./pages/HarvestPlannerPage";

function Home() {
    return (
        <Container sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>Welcome to Cobblestone Operations</Typography>
            <Typography>Use the sidebar to navigate between different sections.</Typography>
        </Container>
    );
}

export default function App() {
    return (
        <ThemeProvider theme={zohoTheme}>
            <CssBaseline />
            <ZohoAuthWrapper>
                <Router>
                    <AppLayout>
                        <Routes>
                            <Route path="/" element={<HarvestPlannerPage />} />
                            <Route path="/harvestcontractors" element={<HarvestContractorsPage />} />
                            <Route path="/harvestplans" element={<HarvestPlannerPage />} />
                        </Routes>
                    </AppLayout>
                </Router>
            </ZohoAuthWrapper>
        </ThemeProvider>
    );
}