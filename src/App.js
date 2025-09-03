import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Stack, Button, Box, Container, ThemeProvider, CssBaseline } from "@mui/material";
import { zohoTheme } from "./utils/theme";
import { ZohoAuthWrapper } from "./components/ZohoAuthWrapper";
import HarvestContractorsPage from "./pages/HarvestContractorsPage";
import HarvestPlannerPage from "./pages/HarvestPlannerPage";

function Home() {
return (
<Container sx={{ py: 3 }}>
<Typography variant="h4" gutterBottom>Welcome to Cobblestone Maintenance</Typography>
<Typography>Select a section from the nav bar above.</Typography>
</Container>
);
}


export default function App() {
return (
<ThemeProvider theme={zohoTheme}>
<CssBaseline />
<ZohoAuthWrapper>
<Router>
<Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
<AppBar position="static" elevation={0}>
<Toolbar sx={{ px: 3 }}>
<Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
Cobblestone Operations
</Typography>
<Stack direction="row" spacing={1}>
<Button 
  color="inherit" 
  component={Link} 
  to="/"
  sx={{ 
    px: 2, 
    py: 1, 
    borderRadius: 1,
    '&:hover': { bgcolor: 'rgba(66, 133, 244, 0.08)' }
  }}
>
  Home
</Button>
<Button 
  color="inherit" 
  component={Link} 
  to="/harvestcontractors"
  sx={{ 
    px: 2, 
    py: 1, 
    borderRadius: 1,
    '&:hover': { bgcolor: 'rgba(66, 133, 244, 0.08)' }
  }}
>
  Contractors
</Button>
<Button 
  color="inherit" 
  component={Link} 
  to="/harvestplans"
  sx={{ 
    px: 2, 
    py: 1, 
    borderRadius: 1,
    '&:hover': { bgcolor: 'rgba(66, 133, 244, 0.08)' }
  }}
>
  Harvest Plans
</Button>
</Stack>
</Toolbar>
</AppBar>

<Routes>
<Route path="/" element={<HarvestPlannerPage />} />
<Route path="/harvestcontractors" element={<HarvestContractorsPage />} />
<Route path="/harvestplans" element={<HarvestPlannerPage />} />
</Routes>
</Box>
</Router>
</ZohoAuthWrapper>
</ThemeProvider>
);
}