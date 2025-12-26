import React from 'react';
import { Paper, Typography, Box, Grid, Divider, Tooltip } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';

export default function LeaveBalanceWidget({ user }) {
  // 1. SAFETY CHECK: If user is completely null, we are still fetching from API
  if (!user) return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="textSecondary">Loading Profile...</Typography>
      </Paper>
  );

  // 2. DATA RECOVERY: If user exists but has no "Wallet" (Old Data), use Defaults
  const balance = user.leaveBalance || { annual: 22, lieu: 0, compOff: 0 };
  const { annual, lieu, compOff } = balance;

  // Helper component
  const BalanceItem = ({ title, count, color, icon, tooltip }) => (
    <Tooltip title={tooltip} arrow>
        <Box sx={{ textAlign: 'center', p: 1, cursor: 'help' }}>
        <Box sx={{ color: color, mb: 1, display: 'flex', justifyContent: 'center' }}>{icon}</Box>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
            {count}
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            {title}
        </Typography>
        </Box>
    </Tooltip>
  );

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #e0e0e0', bgcolor: 'white' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
            Leave Balance
        </Typography>
        <Typography variant="caption" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', px: 1, py: 0.5, borderRadius: 1 }}>
            2025
        </Typography>
      </Box>
      
      <Grid container alignItems="center" justifyContent="space-between">
        
        <Grid item xs={4}>
           <BalanceItem 
             title="Annual" 
             count={annual} 
             color="#1976d2" 
             icon={<FlightTakeoffIcon fontSize="large"/>}
             tooltip="Resets every year (Standard: 22 Days)"
           />
        </Grid>
        
        <Divider orientation="vertical" flexItem sx={{ height: 40, alignSelf: 'center' }} />

        <Grid item xs={3}>
           <BalanceItem 
             title="Lieu Days" 
             count={lieu} 
             color="#ed6c02" 
             icon={<EventAvailableIcon fontSize="large"/>} 
             tooltip="Earned by working on Public Holidays"
           />
        </Grid>

        <Divider orientation="vertical" flexItem sx={{ height: 40, alignSelf: 'center' }} />

        <Grid item xs={3}>
           <BalanceItem 
             title="Comp Off" 
             count={compOff} 
             color="#2e7d32" 
             icon={<WorkHistoryIcon fontSize="large"/>} 
             tooltip="Compensation for Overtime/Weekend work"
           />
        </Grid>

      </Grid>
      
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0', textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
           *Sick Leave is unlimited but requires a medical certificate.
        </Typography>
      </Box>
    </Paper>
  );
}