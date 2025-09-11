import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { zohoTheme } from "./utils/theme";
import { ZohoAuthWrapper } from "./components/ZohoAuthWrapper";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { AppLayout } from "./components/AppLayout";
import HarvestContractorsPage from "./pages/HarvestContractorsPage";
import HarvestPlannerPage from "./pages/HarvestPlannerPage";
import ProcessPlansPage from "./pages/ProcessPlansPage";
import UserManagementPage from "./pages/UserManagementPage";


export default function App() {
    return (
        <ThemeProvider theme={zohoTheme}>
            <CssBaseline />
            <ViewModeProvider>
                <ZohoAuthWrapper>
                    <Router>
                        <AppLayout>
                            <Routes>
                                <Route path="/" element={<HarvestPlannerPage />} />
                                <Route path="/harvestcontractors" element={<HarvestContractorsPage />} />
                                <Route path="/harvestplans" element={<HarvestPlannerPage />} />
                                <Route path="/processplans" element={<ProcessPlansPage />} />
                                <Route path="/users" element={<UserManagementPage />} />
                            </Routes>
                        </AppLayout>
                    </Router>
                </ZohoAuthWrapper>
            </ViewModeProvider>
        </ThemeProvider>
    );
}