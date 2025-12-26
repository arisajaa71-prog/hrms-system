import React, { useState, useEffect } from 'react';
import { Box, Paper, Tabs, Tab, Grid, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

import LeaveForm from './LeaveForm';
import LeaveHistory from './LeaveHistory';
import LeaveList from './LeaveList';

export default function Leaves({ role, initialTab }) {
  // Default to 0, or use the passed prop if available
  const [tab, setTab] = useState(initialTab || 0);

  // --- LISTEN FOR CHANGES ---
  // If the user clicks the dashboard button while already on this page, switch the tab
  useEffect(() => {
      if (typeof initialTab !== 'undefined') {
          setTab(initialTab);
      }
  }, [initialTab]);

  const isOwner = role === 'Owner';
  const isEmployee = role === 'Employee';
  
  // OWNER VIEW (Directly Manager)
  if (isOwner) {
      return (
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
              <Typography variant="h5" sx={{ mb: 3 }}>Manage Leave Requests</Typography>
              <LeaveList />
          </Paper>
      );
  }

  // EMPLOYEE VIEW (Directly Personal)
  if (isEmployee) {
      return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 0, border: '1px solid #e0e0e0', height: '100%' }}>
                    <LeaveForm />
                </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                    <LeaveHistory />
                </Paper>
            </Grid>
        </Grid>
      );
  }

  // ADMIN/SENIOR ADMIN VIEW (Tabs)
  return (
    <Box>
        <Paper square sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            <Tabs 
                value={tab} 
                onChange={(e, v) => setTab(v)} 
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
                sx={{ bgcolor: '#f5f5f5' }}
            >
                <Tab icon={<PersonIcon />} iconPosition="start" label="My Leaves & History" />
                <Tab icon={<SupervisorAccountIcon />} iconPosition="start" label="Manage Team Leaves" />
            </Tabs>
        </Paper>

        {tab === 0 && (
            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{ p: 0, border: '1px solid #e0e0e0', height: '100%' }}>
                        <LeaveForm />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={7}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                        <LeaveHistory />
                    </Paper>
                </Grid>
            </Grid>
        )}

        {tab === 1 && (
             <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                 <Typography variant="h6" gutterBottom color="primary">Team Approvals & Balances</Typography>
                 <LeaveList />
             </Paper>
        )}
    </Box>
  );
}