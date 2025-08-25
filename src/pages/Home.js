// home.js — Simple landing screen
import React from "react";
import { Card, CardHeader, CardContent, Button, Typography } from "@mui/material";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader title="Welcome" />
      <CardContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          This space will branch into feature pages. Start with Planned Harvests for basic CRUD over your table.
        </Typography>
        <Button variant="contained" endIcon={<ChevronRight />} onClick={() => navigate("/planned")}>
          Go to Planned Harvests
        </Button>
      </CardContent>
    </Card>
  );
}
