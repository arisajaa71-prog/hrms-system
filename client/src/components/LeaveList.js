import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  styled, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Chip, Typography, Box, CircularProgress, Alert, tableCellClasses,
  IconButton, Dialog, DialogTitle, DialogContent, TextField, MenuItem, DialogActions, Stack, Tooltip,
  Tabs, Tab, FormControl, InputLabel, Select, InputAdornment, Avatar,
  Accordion, AccordionSummary, AccordionDetails, Grid
} from '@mui/material';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description'; 

// --- STYLES ---
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main, 
    color: theme.palette.common.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  '&:last-child td, &:last-child th': { border: 0 },
}));

export default function LeaveList() {
  const [tab, setTab] = useState(0);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Admin Tools
  const [openCredit, setOpenCredit] = useState(false);
  const [creditData, setCreditData] = useState({ employeeId: '', type: 'lieu', amount: 1 });
  const [openBlock, setOpenBlock] = useState(false);
  const [blockData, setBlockData] = useState({ startDate: '', endDate: '', reason: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
        const token = localStorage.getItem('token');
        const [leavesRes, empsRes] = await Promise.all([
            axios.get('https://hrms-backend-8254.onrender.com/api/leaves', { headers: { Authorization: token } }),
            axios.get('https://hrms-backend-8254.onrender.com/api/employees', { headers: { Authorization: token } })
        ]);
        setLeaves(leavesRes.data);
        setEmployees(empsRes.data);
        setLoading(false);
    } catch (err) { setError("Failed to load data."); setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://hrms-backend-8254.onrender.com/api/leaves/${id}`, { status }, { headers: { Authorization: token } });
      fetchData(); 
    } catch (err) { alert("Error updating status"); }
  };

  // --- REVOKE / CANCEL FUNCTION ---
  const handleCancelLeave = async (id) => {
      if(!window.confirm("Are you sure you want to REVOKE this leave? If it was approved, the balance will be refunded.")) return;
      
      try {
          const token = localStorage.getItem('token');
          await axios.put(`https://hrms-backend-8254.onrender.com/api/leaves/${id}/cancel`, {}, { headers: { Authorization: token } });
          fetchData(); // Refresh to see the new status
      } catch (err) { alert("Error cancelling leave"); }
  };

  const handleViewDoc = (path) => {
      if (!path) return;
      const cleanPath = path.replace(/\\/g, "/"); 
      window.open(`https://hrms-backend-8254.onrender.com/${cleanPath}`, '_blank');
  };

  const handleAddCredit = async () => {
    try {
        const token = localStorage.getItem('token');
        await axios.put('https://hrms-backend-8254.onrender.com/api/leaves/adjust-balance', creditData, { headers: { Authorization: token } });
        alert("Balance Updated"); setOpenCredit(false); fetchData();
    } catch (err) { alert("Error adding credit"); }
  };

  const handleBlockDates = async () => {
    try {
        const token = localStorage.getItem('token');
        await axios.post('https://hrms-backend-8254.onrender.com/api/leaves/block-dates', blockData, { headers: { Authorization: token } });
        alert("Dates Blocked"); setOpenBlock(false);
    } catch (err) { alert("Error blocking dates"); }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved': return <Chip label="Approved" color="success" size="small" icon={<CheckCircleIcon />} sx={{ fontWeight: 'bold' }} />;
      case 'Rejected': return <Chip label="Rejected" color="error" size="small" icon={<CancelIcon />} sx={{ fontWeight: 'bold' }} />;
      case 'Cancelled': return <Chip label="Cancelled" size="small" variant="outlined" sx={{ fontWeight: 'bold', color: '#9e9e9e', borderColor: '#9e9e9e' }} />;
      default: return <Chip label="Pending" color="warning" size="small" icon={<HourglassEmptyIcon />} variant="outlined" sx={{ fontWeight: 'bold', border: '2px solid' }} />;
    }
  };

  const getFilteredBalances = () => {
      return employees.filter(emp => {
          const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
          return name.includes(search.toLowerCase()) && (deptFilter === 'All' || emp.department === deptFilter);
      });
  };

  const getEmployeeHistory = (empId) => leaves.filter(l => (l.employee?._id === empId || l.employee === empId));
  const getUpcomingLeaves = () => {
      const today = new Date(); today.setHours(0,0,0,0);
      return leaves.filter(l => l.status === 'Approved' && new Date(l.startDate) >= today).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
  };
  const departments = ['All', ...new Set(employees.map(e => e.department))];

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
           <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary" indicatorColor="primary">
               <Tab label={`Requests (${leaves.filter(l => l.status === 'Pending').length})`} />
               <Tab label="All Balances & History" />
               <Tab label="Forecast" />
           </Tabs>
           <Stack direction="row" spacing={2}>
               <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setOpenCredit(true)} sx={{ bgcolor: '#2e7d32' }}>Credit</Button>
               <Button variant="contained" startIcon={<BlockIcon />} onClick={() => setOpenBlock(true)} color="error">Block Dates</Button>
           </Stack>
      </Box>

      {/* ================= TAB 0: REQUESTS ================= */}
      {tab === 0 && (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <StyledTableCell>Employee</StyledTableCell>
                <StyledTableCell>Leave Type</StyledTableCell>
                <StyledTableCell>Dates</StyledTableCell>
                <StyledTableCell>Reason</StyledTableCell>
                <StyledTableCell align="center">Doc</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.length === 0 ? (
                  <TableRow><StyledTableCell colSpan={7} align="center">No pending requests</StyledTableCell></TableRow>
              ) : (
                  leaves.map((leave) => (
                    <StyledTableRow key={leave._id}>
                      <StyledTableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                        <Box sx={{display:'flex', gap:1, alignItems:'center'}}>
                            <Avatar src={leave.employee?.profilePicture ? `https://hrms-backend-8254.onrender.com/${leave.employee.profilePicture}` : null} sx={{ width: 30, height: 30 }}/>
                            {leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Unknown'}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>{leave.leaveType}</StyledTableCell>
                      <StyledTableCell>{new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}</StyledTableCell>
                      <StyledTableCell sx={{ fontStyle: 'italic', color: '#555' }}>"{leave.reason}"</StyledTableCell>
                      
                      {/* DOCUMENT */}
                      <StyledTableCell align="center">
                          {leave.attachment ? (
                              <Tooltip title="View Document">
                                  <IconButton color="primary" onClick={() => handleViewDoc(leave.attachment)}>
                                      <DescriptionIcon />
                                  </IconButton>
                              </Tooltip>
                          ) : '-'}
                      </StyledTableCell>

                      <StyledTableCell>{getStatusChip(leave.status)}</StyledTableCell>
                      
                      {/* ACTIONS */}
                      <StyledTableCell align="center">
                        {leave.status === 'Pending' ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                             <Tooltip title="Approve"><IconButton color="success" onClick={() => updateStatus(leave._id, 'Approved')}><CheckIcon/></IconButton></Tooltip>
                             <Tooltip title="Reject"><IconButton color="error" onClick={() => updateStatus(leave._id, 'Rejected')}><CloseIcon/></IconButton></Tooltip>
                          </Box>
                        ) : leave.status === 'Approved' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <CheckIcon color="success" />
                                <Tooltip title="Revoke & Refund">
                                    <IconButton 
                                        size="small" 
                                        color="warning" 
                                        onClick={() => handleCancelLeave(leave._id)}
                                    >
                                        <BlockIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ) : (
                            leave.status === 'Cancelled' ? <BlockIcon color="disabled" fontSize="small"/> : <CloseIcon color="error" />
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ================= TAB 1: BALANCES & HISTORY ================= */}
      {tab === 1 && (
           <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment> }} />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Department</InputLabel>
                    <Select value={deptFilter} label="Department" onChange={(e) => setDeptFilter(e.target.value)}>
                        {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>
            <Box>
                {getFilteredBalances().map(emp => {
                    const empHistory = getEmployeeHistory(emp._id);
                    return (
                        <Accordion key={emp._id} sx={{ mb: 1, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                    <Avatar src={emp.profilePicture ? `https://hrms-backend-8254.onrender.com/${emp.profilePicture}` : null} />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography fontWeight="bold">{emp.firstName} {emp.lastName}</Typography>
                                        <Typography variant="caption" color="textSecondary">{emp.department}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
                                        <Chip label={`Annual: ${emp.leaveBalance?.annual || 0}`} size="small" color="primary" variant="outlined" />
                                        <Chip label={`Sick: ${emp.leaveBalance?.sick || 0}`} size="small" color="warning" variant="outlined" />
                                    </Box>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: '#fafafa', p: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={0} sx={{ p: 2, border: '1px solid #ddd' }}>
                                            <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">Balances</Typography>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}><Typography variant="body2">Annual</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="body2" fontWeight="bold">{emp.leaveBalance?.annual || 0}</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="body2">Sick</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="body2" fontWeight="bold">{emp.leaveBalance?.sick || 0}</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="body2">Lieu</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="body2" fontWeight="bold">{emp.leaveBalance?.lieu || 0}</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="body2">Comp Off</Typography></Grid>
                                                <Grid item xs={6}><Typography variant="body2" fontWeight="bold">{emp.leaveBalance?.compOff || 0}</Typography></Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><HistoryIcon fontSize="small"/> History</Typography>
                                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ddd', maxHeight: 200 }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead><TableRow><StyledTableCell>Type</StyledTableCell><StyledTableCell>Dates</StyledTableCell><StyledTableCell>Status</StyledTableCell><StyledTableCell>Action</StyledTableCell></TableRow></TableHead>
                                                <TableBody>
                                                    {empHistory.length === 0 ? <TableRow><StyledTableCell colSpan={4} align="center">No history.</StyledTableCell></TableRow> : 
                                                        empHistory.map(h => (
                                                            <TableRow key={h._id}>
                                                                <StyledTableCell>{h.leaveType}</StyledTableCell>
                                                                <StyledTableCell>{new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}</StyledTableCell>
                                                                <StyledTableCell>{getStatusChip(h.status)}</StyledTableCell>
                                                                <StyledTableCell>
                                                                    {h.status === 'Approved' && (
                                                                        <Tooltip title="Revoke">
                                                                            <IconButton size="small" color="warning" onClick={() => handleCancelLeave(h._id)}>
                                                                                <BlockIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </StyledTableCell>
                                                            </TableRow>
                                                        ))
                                                    }
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Box>
           </>
       )}

       {/* ================= TAB 2: FORECAST ================= */}
       {tab === 2 && (
           <Box>
               <Alert severity="info" sx={{ mb: 2 }}>Upcoming approved leaves.</Alert>
               {getUpcomingLeaves().map(leave => (
                   <Paper key={leave._id} elevation={2} sx={{ p: 2, mb: 2, borderLeft: '5px solid #1976d2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                           <Avatar src={leave.employee?.profilePicture ? `https://hrms-backend-8254.onrender.com/${leave.employee.profilePicture}` : null} />
                           <Box><Typography variant="subtitle1" fontWeight="bold">{leave.employee?.firstName} {leave.employee?.lastName}</Typography><Typography variant="body2" color="textSecondary">{leave.leaveType}</Typography></Box>
                       </Box>
                       <Box sx={{ textAlign: 'right' }}><Typography variant="h6" color="primary" fontWeight="bold">{new Date(leave.startDate).toLocaleDateString()}</Typography><Chip label="Approved" size="small" color="success" /></Box>
                   </Paper>
               ))}
           </Box>
       )}

       {/* DIALOG: GRANT CREDIT (FIXED: Added Sick Leave) */}
       <Dialog open={openCredit} onClose={() => setOpenCredit(false)}>
           <DialogTitle>Grant Credit</DialogTitle>
           <DialogContent sx={{ minWidth: 400, mt: 1 }}>
               <TextField select label="Employee" fullWidth sx={{ mb: 2, mt: 1 }} value={creditData.employeeId} onChange={(e) => setCreditData({...creditData, employeeId: e.target.value})}>
                   {employees.map(e => <MenuItem key={e._id} value={e._id}>{e.firstName} {e.lastName}</MenuItem>)}
               </TextField>
               
               <TextField 
                   select 
                   label="Type" 
                   fullWidth 
                   sx={{ mb: 2 }} 
                   value={creditData.type} 
                   onChange={(e) => setCreditData({...creditData, type: e.target.value})}
               >
                   <MenuItem value="annual">Annual</MenuItem>
                   <MenuItem value="sick">Sick Leave</MenuItem> {/* <--- ADDED THIS OPTION */}
                   <MenuItem value="lieu">Lieu Day</MenuItem>
                   <MenuItem value="compOff">Comp Off</MenuItem>
               </TextField>

               <TextField type="number" label="Days" fullWidth value={creditData.amount} onChange={(e) => setCreditData({...creditData, amount: e.target.value})} />
           </DialogContent>
           <DialogActions><Button onClick={() => setOpenCredit(false)}>Cancel</Button><Button onClick={handleAddCredit} variant="contained" color="success">Add</Button></DialogActions>
       </Dialog>

        {/* Block Dates Dialog */}
       <Dialog open={openBlock} onClose={() => setOpenBlock(false)}>
           <DialogTitle>Block Dates</DialogTitle>
           <DialogContent>
               <TextField type="date" label="Start" fullWidth sx={{mt:2}} InputLabelProps={{shrink:true}} value={blockData.startDate} onChange={(e) => setBlockData({...blockData, startDate: e.target.value})}/>
               <TextField type="date" label="End" fullWidth sx={{mt:2}} InputLabelProps={{shrink:true}} value={blockData.endDate} onChange={(e) => setBlockData({...blockData, endDate: e.target.value})}/>
               <TextField label="Reason" fullWidth sx={{mt:2}} value={blockData.reason} onChange={(e) => setBlockData({...blockData, reason: e.target.value})}/>
           </DialogContent>
           <DialogActions><Button onClick={() => setOpenBlock(false)}>Cancel</Button><Button onClick={handleBlockDates} variant="contained" color="error">Block</Button></DialogActions>
       </Dialog>
    </Box>
  );
}