import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Stack, Button, Box, Container } from "@mui/material";
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
<Router>
<Box sx={{ flexGrow: 1 }}>
<AppBar position="static" sx={{ bgcolor: "#0f172a" }}>
<Toolbar>
<Typography variant="h6" sx={{ flexGrow: 1 }}>Cobblestone Maintenance</Typography>
<Stack direction="row" spacing={2}>
<Button color="inherit" component={Link} to="/">Home</Button>
<Button color="inherit" component={Link} to="/harvestcontractors">Harvest Contractors</Button>
<Button color="inherit" component={Link} to="/harvestplans">Harvest plans</Button>
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
);
}