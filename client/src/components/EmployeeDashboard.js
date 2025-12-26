import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Grid, Box, Card, CardContent, Typography, CardActionArea 
} from '@mui/material';

// Components
import HeaderBanner from './HeaderBanner';
import AttendanceWidget from './AttendanceWidget'; 
import DashboardWidgets from './DashboardWidgets'; 
import NewsWidget from './NewsWidget'; 
import LeaveBalanceWidget from './LeaveBalanceWidget'; 

// Icons
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

// Mock data to show while loading
const mockUser = {
    firstName: "Loading...",
    lastName: "",
    designation: "...",
    department: "...",
    role: "Employee",
    profilePicture: "", 
    leaveBalance: { annual: '-', lieu: '-', compOff: '-' }
};

const EmployeeDashboard = ({ user, onNavigate, children }) => {
  const displayUser = user || mockUser;

  // --- ROLE CHECKS ---
  const isOwner = displayUser.role === 'Owner';
  // Admin or Senior Admin or Owner can see the stats
  const isAdmin = isOwner || displayUser.role === 'Senior Admin' || displayUser.role === 'Admin';

  // --- ADMIN STATS STATE ---
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEmployees: 0, pendingLeaves: 0 });

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fix: Fetch from the correct endpoints
      const [empRes, leaveRes] = await Promise.all([
        axios.get('http://localhost:5001/api/employees', { headers: { Authorization: token } }),
        axios.get('http://localhost:5001/api/leaves', { headers: { Authorization: token } })
      ]);
      
      const pendingCount = leaveRes.data.filter(l => l.status === 'Pending').length;
      
      setStats({ 
        totalEmployees: empRes.data.length, 
        pendingLeaves: pendingCount 
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard stats", err);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      
      {/* 1. HEADER BANNER */}
      <Box sx={{ mb: 3 }}>
        <HeaderBanner user={displayUser} />
      </Box>

      {/* 2. MANAGEMENT WIDGETS (Visible to Owner & Admins) */}
      {isAdmin && !loading && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* TOTAL EMPLOYEES -> Goes to Directory */}
            <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
                    <CardActionArea 
                        onClick={() => onNavigate('directory')} 
                        sx={{ height: '100%' }}
                    >
                        <CardContent>
                            <Typography color="textSecondary" variant="overline" fontWeight="bold">TOTAL EMPLOYEES</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="h3" color="primary" fontWeight="bold">{stats.totalEmployees}</Typography>
                                <PeopleAltIcon sx={{ fontSize: 50, color: '#e0e0e0' }} />
                            </Box>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Grid>

            {/* PENDING LEAVES -> Goes to Leaves Page (Tab 1: Manage Team) */}
            <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%', borderRadius: 2, bgcolor: '#fffde7', border: '1px solid #fff9c4' }}>
                    <CardActionArea 
                        // --- THE FIX: PASS { tab: 1 } TO SWITCH TABS ---
                        onClick={() => onNavigate('leaves', { tab: 1 })} 
                        sx={{ height: '100%' }}
                    >
                        <CardContent>
                            <Typography color="textSecondary" variant="overline" fontWeight="bold">PENDING LEAVES</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="h3" color="success.main" fontWeight="bold">{stats.pendingLeaves}</Typography>
                                <PendingActionsIcon sx={{ fontSize: 50, color: '#fff59d' }} />
                            </Box>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Grid>
        </Grid>
      )}

      {/* 3. CHILDREN (Safety fallback) */}
      {children && <Box sx={{ mb: 3 }}>{children}</Box>}

      {/* 4. MAIN WIDGETS */}
      <Grid container spacing={3}>
        
        {/* LEFT COLUMN */}
        <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
                
                {/* A. ATTENDANCE WIDGET */}
                <Grid item xs={12} md={isOwner ? 12 : 6}>
                    <AttendanceWidget />
                </Grid>

                {/* B. LEAVE BALANCE WIDGET (Hidden for Owner) */}
                {!isOwner && (
                    <Grid item xs={12} md={6}>
                        <LeaveBalanceWidget user={displayUser} />
                    </Grid>
                )}

                {/* C. NEWS WIDGET */}
                <Grid item xs={12}>
                    <NewsWidget />
                </Grid>
            </Grid>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={4}>
           <DashboardWidgets onNavigate={onNavigate} /> 
        </Grid>

      </Grid>
    </Container>
  );
};

export default EmployeeDashboard;