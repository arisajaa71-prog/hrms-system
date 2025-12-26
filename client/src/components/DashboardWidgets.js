import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Paper, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Box, Divider, Button, Chip, ListItemButton, Tab, Tabs
} from '@mui/material';
import CakeIcon from '@mui/icons-material/Cake';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckIcon from '@mui/icons-material/Check';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function DashboardWidgets({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]); 
  const [history, setHistory] = useState([]); 
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [employees, setEmployees] = useState([]);
  
  // Tab State for Security Widget
  const [secTab, setSecTab] = useState(0);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // --- FIX 1: Add 'Owner' to Admin Check ---
      const isAdmin = role === 'Owner' || role === 'Admin' || role === 'Senior Admin';

      const promises = [
        axios.get('https://hrms-backend-8254.onrender.com/api/employees', { headers: { Authorization: token } }),
        axios.get('https://hrms-backend-8254.onrender.com/api/leaves', { headers: { Authorization: token } })
      ];

      if(isAdmin) {
          promises.push(axios.get('https://hrms-backend-8254.onrender.com/api/requests/pending', { headers: { Authorization: token } }));
          promises.push(axios.get('https://hrms-backend-8254.onrender.com/api/requests/history', { headers: { Authorization: token } }));
      }

      const results = await Promise.all(promises);
      const empData = results[0].data;
      setEmployees(empData);
      
      const leaves = results[1].data;
      if(isAdmin && results[2]) setRequests(results[2].data);
      if(isAdmin && results[3]) setHistory(results[3].data);

      // --- DATE LOGIC FIX: Normalize Today to Midnight ---
      const today = new Date();
      today.setHours(0,0,0,0);
      const currentYear = today.getFullYear();
      let combinedEvents = [];

      // 1. PROCESS BIRTHDAYS
      empData.forEach(emp => {
          if(emp.dob) {
              const dob = new Date(emp.dob);
              const bdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
              
              // Only show if it's today or in the future
              if (bdayThisYear >= today) {
                   combinedEvents.push({
                       id: emp._id + 'bday', 
                       type: 'Birthday', 
                       name: `${emp.firstName} ${emp.lastName}`,
                       date: bdayThisYear, 
                       avatar: emp.profilePicture, 
                       color: '#ff4081', 
                       icon: <CakeIcon fontSize="small" />,
                       displayDate: bdayThisYear // Sort key
                   });
              }
          }
      });

      // 2. PROCESS LEAVES
      leaves.forEach(leave => {
          if (leave.status === 'Approved') {
              const start = new Date(leave.startDate); start.setHours(0,0,0,0);
              const end = new Date(leave.endDate); end.setHours(0,0,0,0);

              // Only show if the leave has NOT finished yet (End Date is today or future)
              if (end >= today) {
                  // --- AVATAR FIX: LOOK UP EMPLOYEE ---
                  const empId = leave.employee?._id || leave.employee; 
                  const realEmp = empData.find(e => e._id === empId);

                  combinedEvents.push({
                      id: leave._id, 
                      type: 'Out of Office', 
                      name: realEmp ? `${realEmp.firstName} ${realEmp.lastName}` : 'Unknown',
                      date: start, // Keep original start date
                      endDate: end, // Store end date for logic check later
                      avatar: realEmp?.profilePicture, 
                      color: '#9e9e9e', 
                      icon: <BeachAccessIcon fontSize="small" />,
                      // If it started before today, use today for sorting so it appears at top
                      displayDate: start < today ? today : start 
                  });
              }
          }
      });

      // Sort by the "Relevant" date
      combinedEvents.sort((a, b) => a.displayDate - b.displayDate);
      setEvents(combinedEvents.slice(0, 5));

    } catch (err) { console.error("Error fetching widgets:", err); }
  };

  const markResolved = async (id, e) => {
      e.stopPropagation();
      try {
          const token = localStorage.getItem('token');
          await axios.put(`https://hrms-backend-8254.onrender.com/api/requests/${id}/resolve`, {}, { headers: { Authorization: token } });
          fetchData(); 
      } catch (err) { alert("Error resolving request"); }
  };

  const handleRequestClick = (req) => {
      const targetEmp = employees.find(e => e.email === req.email);
      if (targetEmp) {
          onNavigate('directory', { id: targetEmp._id, tab: 1 });
      } else {
          alert("Employee profile not found.");
      }
  };

  const getAvatarSrc = (path) => path ? `https://hrms-backend-8254.onrender.com/${path}` : null;
  
  // --- FIX 2: Add 'Owner' to Render Logic ---
  const isAdmin = role === 'Owner' || role === 'Admin' || role === 'Senior Admin';
  
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <Box>
      {/* --- ADMIN: SECURITY WIDGET --- */}
      {isAdmin && (
          <Paper elevation={0} sx={{ p: 0, mb: 3, border: '1px solid #ffcc80', bgcolor: '#fff3e0', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockResetIcon color="warning" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e65100' }}>Security</Typography>
                </Box>
            </Box>
            
            <Tabs 
                value={secTab} 
                onChange={(e, v) => setSecTab(v)} 
                textColor="inherit" 
                indicatorColor="primary"
                variant="fullWidth"
                sx={{ minHeight: 40, '& .MuiTab-root': { py: 1, minHeight: 40, fontSize: '0.8rem' } }}
            >
                <Tab label={`To Do (${requests.length})`} />
                <Tab label="History" />
            </Tabs>
            <Divider />

            {/* TAB 0: PENDING TASKS */}
            {secTab === 0 && (
                <List sx={{ p: 0 }}>
                    {requests.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center', color: '#999' }}><Typography variant="body2">No pending requests</Typography></Box>
                    ) : (
                        requests.map(req => (
                            <React.Fragment key={req._id}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleRequestClick(req)}>
                                        <ListItemText 
                                            primary={<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{req.name}</Typography>}
                                            secondary={<span style={{ fontSize: '0.75rem' }}>Needs Password Reset</span>}
                                        />
                                        <Button 
                                            variant="outlined" color="success" size="small" startIcon={<CheckIcon/>}
                                            onClick={(e) => markResolved(req._id, e)}
                                            sx={{ mr: 1, bgcolor: 'white', minWidth: '80px' }}
                                        >
                                            Done
                                        </Button>
                                        <ArrowForwardIosIcon fontSize="small" color="disabled" sx={{ fontSize: '0.8rem' }} />
                                    </ListItemButton>
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))
                    )}
                </List>
            )}

            {/* TAB 1: HISTORY */}
            {secTab === 1 && (
                <List sx={{ p: 0, maxHeight: 200, overflow: 'auto' }}>
                    {history.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center', color: '#999' }}><Typography variant="body2">No history yet</Typography></Box>
                    ) : (
                        history.map(req => (
                            <React.Fragment key={req._id}>
                                <ListItem sx={{ py: 1 }}>
                                    <ListItemText 
                                        primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{req.name}</Typography>}
                                        secondary={
                                            <span style={{ fontSize: '0.7rem', color: '#666' }}>
                                                <HistoryIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                                Resolved: {new Date(req.resolvedAt).toLocaleDateString()}
                                            </span>
                                        }
                                    />
                                    <Chip label="Done" size="small" color="default" variant="outlined" />
                                </ListItem>
                                <Divider component="li" />
                            </React.Fragment>
                        ))
                    )}
                </List>
            )}
          </Paper>
      )}

      {/* --- EVENTS WIDGET --- */}
      <Paper elevation={0} sx={{ p: 0, border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>My Team Events</Typography>
          <Button size="small" sx={{ textTransform: 'none', color: '#666', bgcolor: '#f5f5f5', borderRadius: 2 }}>All</Button>
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {events.length === 0 ? (
             <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="textSecondary">No upcoming events.</Typography></Box>
          ) : (
             events.map((evt, index) => {
               let dateText = evt.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
               if (evt.type === 'Out of Office' && evt.date < today && evt.endDate >= today) {
                  dateText = "Ongoing";
               }

               return (
                 <React.Fragment key={evt.id}>
                    <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                        <ListItemAvatar>
                            <Avatar src={getAvatarSrc(evt.avatar)} sx={{ bgcolor: !evt.avatar ? evt.color : 'transparent' }}>
                                {!evt.avatar && evt.name[0]}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                            primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{evt.name}</Typography>}
                            secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    {evt.icon} <Typography variant="caption" color="textSecondary">{evt.type}</Typography>
                                </Box>
                            }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                             <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: '#555' }}>
                                {dateText}
                             </Typography>
                        </Box>
                    </ListItem>
                    {index < events.length - 1 && <Divider component="li" variant="inset" />}
                 </React.Fragment>
               );
             })
          )}
        </List>
      </Paper>
    </Box>
  );
}