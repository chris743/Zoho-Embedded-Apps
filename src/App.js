import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { zohoTheme } from "./utils/theme";
import { ZohoAuthWrapper } from "./components/ZohoAuthWrapper";
import { AppLayout } from "./components/AppLayout";
import HarvestContractorsPage from "./pages/HarvestContractorsPage";
import HarvestPlannerPage from "./pages/HarvestPlannerPage";


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