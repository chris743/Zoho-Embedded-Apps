import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { PlaceholderGrowersTable } from '../components/tables/PlaceholderGrowersTable';

export function PlaceholderGrowersPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Placeholder Growers Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage placeholder growers that can be used in harvest plans when specific blocks are not yet known.
        </Typography>
      </Box>
      
      <PlaceholderGrowersTable />
    </Container>
  );
}
