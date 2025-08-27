import React from "react";
import { AppBar, Box, Container, Snackbar, Stack, TextField, Toolbar, Typography, Button } from "@mui/material";


export default function AppShell({ title, apiBase, setApiBase, jwt, setJwt, onSave, toast, setToast, children }) {
return (
<Box sx={{ minHeight: "100vh", bgcolor: "#0b1020", color: "#e6e8ef" }}>
<AppBar position="static" sx={{ bgcolor: "#0f172a" }}>
<Toolbar>
<Typography variant="h6" sx={{ flexGrow: 1 }}>{title}</Typography>
<Stack direction="row" spacing={1} alignItems="center">
<TextField size="small" variant="outlined" label="API Base" value={apiBase} onChange={(e) => setApiBase(e.target.value)} sx={{ bgcolor: "white", borderRadius: 1, width: 360 }} />
<TextField size="small" variant="outlined" label="JWT (optional)" value={jwt} onChange={(e) => setJwt(e.target.value)} sx={{ bgcolor: "white", borderRadius: 1, width: 240 }} />
<Button variant="contained" onClick={onSave}>Save</Button>
</Stack>
</Toolbar>
</AppBar>
<Container sx={{ py: 3 }}>{children}</Container>
<Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} message={toast || ""} />
</Box>
);
}