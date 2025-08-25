import React from "react";
import {BrowserRouter, Routes, Route, Link, useLocation} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Typography,
  Container,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

import Home from "./pages/Home"
import HarvestPlanPage from "./pages/HarvestPlanPage"

function NavTabs() {
  const location = useLocation();
  const value = location.pathname.startswith("/planned") ? 1 : 0;
  return (
    <Tabs value={value} aria-label="nav tabs">
      <Tab label="Home" component={Link} to="/"/>
      <Tab label="Planned Harvests" component={Link} to="/planned"/>
    </Tabs>
  );
}

export default function App(){
  return(
    <BrowserRouter>
      <AppBar>
        <Toolbar>
          <HomeIcon>
            <Typography>
              Cobblestone Fruit
            </Typography>
            <NavTabs/>
          </HomeIcon>
        </Toolbar>
      </AppBar>

      <Container>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/planned" element={<HarvestPlanPage/>} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}