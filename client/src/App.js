import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { 
  AppBar, Toolbar, Typography, Button, Container, Paper, Box, CssBaseline,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, TextField, Link
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

// --- ICONS ---
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People'; 
import PaidIcon from '@mui/icons-material/Paid'; 
import SchoolIcon from '@mui/icons-material/School'; 
import RateReviewIcon from '@mui/icons-material/RateReview'; 
import AccessTimeIcon from '@mui/icons-material/AccessTime'; 
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person'; 
import EventNoteIcon from '@mui/icons-material/EventNote'; 
import HowToRegIcon from '@mui/icons-material/HowToReg'; 
import WorkIcon from '@mui/icons-material/Work'; // <--- NEW ICON (Recruitment)

// --- COMPONENTS ---
import Login from './components/Login'; 
import Directory from './components/Directory'; 
import EmployeeDashboard from './components/EmployeeDashboard'; 
import AttendanceManagement from './components/AttendanceManagement'; 
import Leaves from './components/Leaves'; 
import Performance from './components/Performance'; 
import Training from './components/Training';
import Payroll from './components/Payroll';
import MyTeam from './components/MyTeam'; 
import MyInfo from './components/MyInfo'; 
import OnboardingDashboard from './components/OnboardingDashboard'; 
import CandidatePortal from './components/CandidatePortal'; 
import Recruitment from './components/Recruitment'; // <--- NEW COMPONENT

import theme from './theme'; 
import './App.css';

const drawerWidth = 240;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token')); 
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [userName, setUserName] = useState(localStorage.getItem('name')); 
  const [currentUserData, setCurrentUserData] = useState(null); 
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [actionTarget, setActionTarget] = useState(null);

  // Toggle between Login and Candidate Portal
  const [showCandidatePortal, setShowCandidatePortal] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const resetToken = queryParams.get('resetToken');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (token) {
      setRole(localStorage.getItem('role'));
      setUserName(localStorage.getItem('name'));
      fetchCurrentUser(); 
    }
  }, [token]);

  // --- 1. FETCH CURRENT USER ---
  const fetchCurrentUser = async () => {
      try {
          const res = await axios.get('https://hrms-backend-8254.onrender.com/api/auth', { 
              headers: { Authorization: localStorage.getItem('token') } 
          });
          setCurrentUserData(res.data);
      } catch (err) { 
          console.error("Error fetching user details", err); 
          if(err.response && err.response.status === 401) handleLogout();
      }
  };

  const handleLogout = () => {
    localStorage.clear(); 
    setToken(null); 
    setRole(null); 
    setUserName(null); 
    setCurrentUserData(null);
    setShowCandidatePortal(false);
  };

  const handleResetSubmit = async () => {
    try {
        await axios.put(`https://hrms-backend-8254.onrender.com/api/auth/reset-password/${resetToken}`, { password: newPassword });
        alert("Password Reset Successfully! Please Login.");
        window.location.href = '/'; 
    } catch (err) { 
        alert("Error: Token invalid or expired."); 
    }
  };

  // --- NAVIGATION HANDLER ---
  const handleNavigate = (view, targetData = null) => {
      setCurrentView(view);
      setActionTarget(targetData);
  };

  // =========================================================
  // VIEW 1: RESET PASSWORD SCREEN (Public)
  // =========================================================
  if (resetToken) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="xs" sx={{ mt: 10 }}>
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Reset Password</Typography>
                <TextField 
                    type="password" label="New Password" fullWidth 
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} 
                    sx={{ mb: 3 }} 
                />
                <Button variant="contained" fullWidth onClick={handleResetSubmit}>Set New Password</Button>
            </Paper>
        </Container>
      </ThemeProvider>
    );
  }

  // =========================================================
  // VIEW 2: CANDIDATE PORTAL (Public - No Login Required)
  // =========================================================
  if (showCandidatePortal) {
      return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <CandidatePortal onBack={() => setShowCandidatePortal(false)} />
        </ThemeProvider>
      );
  }

  // =========================================================
  // VIEW 3: LOGIN SCREEN (Public)
  // =========================================================
  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login 
            setToken={(t) => { 
                setToken(t); 
                setRole(localStorage.getItem('role')); 
                setUserName(localStorage.getItem('name')); 
            }}
            onOnboardClick={() => setShowCandidatePortal(true)} 
        />
      </ThemeProvider>
    );
  }

  // =========================================================
  // VIEW 4: MAIN DASHBOARD (Authenticated)
  // =========================================================
  
  const isOwner = role === 'Owner';
  const isSeniorAdmin = role === 'Senior Admin';
  const isAdmin = role === 'Admin';
  
  const isHR = currentUserData?.department === 'Human Resources';

  // Permission Logic
  const canManageAttendance = isOwner || isSeniorAdmin || isAdmin || isHR;
  const canAccessPayroll = isOwner || isSeniorAdmin;
  const canAccessOnboarding = isOwner || isSeniorAdmin || isHR;
  
  // Recruitment Access (Same as Onboarding)
  const canAccessRecruitment = isOwner || isSeniorAdmin || isHR;

  const renderView = () => {
    switch (currentView) {
      
      case 'dashboard':
        return <EmployeeDashboard user={currentUserData} onNavigate={handleNavigate} />;

      case 'my_info': 
        return (
            <Paper elevation={0} sx={{ padding: 3, border: '1px solid #e0e0e0' }}>
               <MyInfo />
            </Paper>
        );

      case 'directory': 
         return <Directory role={role} isHR={isHR} actionTarget={actionTarget} setActionTarget={setActionTarget} />;
      
      case 'my_team': 
        return (
            <Paper elevation={0} sx={{ padding: 3, border: '1px solid #e0e0e0' }}>
               <MyTeam /> 
            </Paper>
        );

      case 'attendance_mgmt': 
        return (
            <Paper elevation={0} sx={{ padding: 3, border: '1px solid #e0e0e0' }}>
               <AttendanceManagement role={role} isHR={isHR} />
            </Paper>
        );

      case 'recruitment': // <--- NEW VIEW
        return (
            <Paper elevation={0} sx={{ padding: 3, border: '1px solid #e0e0e0' }}>
                <Recruitment />
            </Paper>
        );

      case 'onboarding':
        return (
            <Paper elevation={0} sx={{ padding: 3, border: '1px solid #e0e0e0' }}>
                <OnboardingDashboard role={role} isHR={isHR} />
            </Paper>
        );

      case 'leaves': 
        return <Leaves role={role} initialTab={actionTarget?.tab} />;

      case 'payroll': 
        return (
            <Paper elevation={0} sx={{ padding: 3, borderLeft: "6px solid #ffb74d", border: '1px solid #e0e0e0' }}>
                <Payroll role={role} />
            </Paper>
        );
        
      case 'performance': 
        return (
            <Paper elevation={0} sx={{ padding: 3, border: '1px solid #e0e0e0' }}>
                <Performance role={role} />
            </Paper>
        );
        
      case 'training': 
        return (
            <Paper elevation={0} sx={{ padding: 3, border: '1px solid #e0e0e0' }}>
                <Training role={role} />
            </Paper>
        );
        
      default: return <Typography>Page not found</Typography>;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* --- TOP BAR --- */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                🚀 HRMS Pro
            </Typography>
            <Typography variant="body2" sx={{ marginRight: 2 }}>
                {userName} ({role})
            </Typography>
            <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                Logout
            </Button>
          </Toolbar>
        </AppBar>

        {/* --- SIDEBAR --- */}
        <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            
            {/* GENERAL MENU */}
            <List>
              <ListItem disablePadding>
                  <ListItemButton onClick={() => setCurrentView('dashboard')}>
                      <ListItemIcon><DashboardIcon color={currentView === 'dashboard' ? "primary" : "inherit"}/></ListItemIcon>
                      <ListItemText primary="Home" />
                  </ListItemButton>
              </ListItem>
              
              <ListItem disablePadding>
                  <ListItemButton onClick={() => setCurrentView('my_info')}>
                      <ListItemIcon><PersonIcon color={currentView === 'my_info' ? "primary" : "inherit"}/></ListItemIcon>
                      <ListItemText primary="My Info" />
                  </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                  <ListItemButton onClick={() => setCurrentView('directory')}>
                      <ListItemIcon><PeopleIcon color={currentView === 'directory' ? "primary" : "inherit"}/></ListItemIcon>
                      <ListItemText primary="Directory" />
                  </ListItemButton>
              </ListItem>
            </List>
            
            <Divider />
            
            {/* ME & TEAM MENU */}
            <List>
               <ListItem><Typography variant="caption" color="textSecondary">ME & TEAM</Typography></ListItem>
               
               <ListItem disablePadding>
                   <ListItemButton onClick={() => setCurrentView('attendance_mgmt')}>
                       <ListItemIcon>
                           <AccessTimeIcon color={currentView === 'attendance_mgmt' ? "primary" : "inherit"} />
                       </ListItemIcon>
                       <ListItemText primary={canManageAttendance ? "Attendance Mgmt" : "My Attendance"} />
                   </ListItemButton>
               </ListItem>

               <ListItem disablePadding>
                   <ListItemButton onClick={() => setCurrentView('my_team')}>
                       <ListItemIcon>
                           <SupervisorAccountIcon color={currentView === 'my_team' ? "primary" : "inherit"} />
                       </ListItemIcon>
                       <ListItemText primary="My Team" />
                   </ListItemButton>
               </ListItem>

               <ListItem disablePadding>
                   <ListItemButton onClick={() => handleNavigate('leaves', null)}>
                       <ListItemIcon><EventNoteIcon color={currentView === 'leaves' ? "primary" : "inherit"} /></ListItemIcon>
                       <ListItemText primary="Leaves" />
                   </ListItemButton>
               </ListItem>

               <ListItem disablePadding>
                   <ListItemButton onClick={() => setCurrentView('performance')}>
                       <ListItemIcon><RateReviewIcon color={currentView === 'performance' ? "primary" : "inherit"} /></ListItemIcon>
                       <ListItemText primary="Performance" />
                   </ListItemButton>
               </ListItem>
               
               <ListItem disablePadding>
                   <ListItemButton onClick={() => setCurrentView('training')}>
                       <ListItemIcon><SchoolIcon color={currentView === 'training' ? "primary" : "inherit"} /></ListItemIcon>
                       <ListItemText primary="Training" />
                   </ListItemButton>
               </ListItem>
            </List>
            
            <Divider />
            
            {/* ADMINISTRATION MENU */}
            {(canAccessPayroll || canAccessOnboarding || canAccessRecruitment) && (
              <List>
                 <ListItem><Typography variant="caption" color="textSecondary">ADMINISTRATION</Typography></ListItem>
                 
                 {/* RECRUITMENT (New) */}
                 {canAccessRecruitment && (
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setCurrentView('recruitment')}>
                            <ListItemIcon><WorkIcon color={currentView === 'recruitment' ? "primary" : "inherit"} /></ListItemIcon>
                            <ListItemText primary="Recruitment" />
                        </ListItemButton>
                    </ListItem>
                 )}

                 {/* ONBOARDING */}
                 {canAccessOnboarding && (
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setCurrentView('onboarding')}>
                            <ListItemIcon><HowToRegIcon color={currentView === 'onboarding' ? "primary" : "inherit"} /></ListItemIcon>
                            <ListItemText primary="Onboarding" />
                        </ListItemButton>
                    </ListItem>
                 )}

                 {/* PAYROLL */}
                 {canAccessPayroll && (
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => setCurrentView('payroll')}>
                            <ListItemIcon><PaidIcon color={currentView === 'payroll' ? "primary" : "inherit"} /></ListItemIcon>
                            <ListItemText primary="Payroll" />
                        </ListItemButton>
                    </ListItem>
                 )}
              </List>
            )}
          </Box>
        </Drawer>

        {/* --- MAIN CONTENT AREA --- */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
          <Toolbar /> 
          <Container maxWidth="lg">{renderView()}</Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;