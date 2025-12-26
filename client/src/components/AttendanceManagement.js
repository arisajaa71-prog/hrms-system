import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Avatar, TextField, Grid, Alert, Tabs, Tab,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Button,
  InputAdornment
} from '@mui/material';

// Icons for Sorting/Actions
import DownloadIcon from '@mui/icons-material/Download';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; 
import SearchIcon from '@mui/icons-material/Search';

// =========================================================
// SUB-COMPONENT: SHIFT MANAGER (Tab 2)
// =========================================================
const ShiftManager = () => {
  const [employees, setEmployees] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://hrms-backend-8254.onrender.com/api/employees', {
        headers: { Authorization: token }
      });
      // Exclude Owner from Shift Manager
      const staffOnly = res.data.filter(e => e.role !== 'Owner');
      setEmployees(staffOnly);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const handleShiftChange = async (id, newShift) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://hrms-backend-8254.onrender.com/api/employees/${id}`, 
        { workShift: newShift }, 
        { headers: { Authorization: token } }
      );
      
      setEmployees(prev => prev.map(emp => 
        emp._id === id ? { ...emp, workShift: newShift } : emp
      ));
      setMsg(`Shift updated to ${newShift}`);
    } catch (err) {
      console.error("Error updating shift:", err);
      alert("Failed to update shift");
    }
  };

  const getShiftColor = (shift) => {
    if (shift === 'Morning') return 'warning'; 
    if (shift === 'Evening') return 'info';    
    return 'default'; 
  };

  return (
    <Box>
       <Typography variant="h6" gutterBottom>Assign Employee Shifts</Typography>
       <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Changing a shift updates the employee's late threshold immediately. 
          (Morning: 08:30, Evening: 12:00, Normal: 08:00)
       </Typography>

       <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
         <Table>
           <TableHead sx={{ bgcolor: '#f5f5f5' }}>
             <TableRow>
               <TableCell>Employee</TableCell>
               <TableCell>Department</TableCell>
               <TableCell>Current Shift</TableCell>
               <TableCell>Action</TableCell>
             </TableRow>
           </TableHead>
           <TableBody>
             {employees.map((emp) => (
               <TableRow key={emp._id}>
                 <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                       <Avatar src={emp.profilePicture ? `https://hrms-backend-8254.onrender.com/${emp.profilePicture}` : null} />
                       <Typography variant="subtitle2" fontWeight="bold">{emp.firstName} {emp.lastName}</Typography>
                    </Box>
                 </TableCell>
                 <TableCell>{emp.department}</TableCell>
                 <TableCell>
                    <Chip 
                      label={emp.workShift || 'Normal'} 
                      color={getShiftColor(emp.workShift)} 
                      size="small" 
                    />
                 </TableCell>
                 <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={emp.workShift || 'Normal'}
                        onChange={(e) => handleShiftChange(emp._id, e.target.value)}
                        sx={{ fontSize: '0.85rem' }}
                      >
                        <MenuItem value="Normal">Normal (8:00)</MenuItem>
                        <MenuItem value="Morning">Morning (8:30)</MenuItem>
                        <MenuItem value="Evening">Evening (12:00)</MenuItem>
                      </Select>
                    </FormControl>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </TableContainer>

       <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg('')} message={msg} />
    </Box>
  );
};

// =========================================================
// MAIN COMPONENT: ATTENDANCE MANAGEMENT
// =========================================================
export default function AttendanceManagement({ role, isHR }) { // Added isHR prop for future flexibility
  const [tab, setTab] = useState(0); 
  
  // View Mode: If Employee, force 'month', otherwise default 'day'
  const [viewMode, setViewMode] = useState(role === 'Employee' ? 'month' : 'day');
  
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [monthVal, setMonthVal] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [attendance, setAttendance] = useState([]);
  const [missing, setMissing] = useState([]); 
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All'); 
  
  // Sort
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [viewMode, dateVal, monthVal]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let url = 'https://hrms-backend-8254.onrender.com/api/attendance/history';
      if (viewMode === 'day') {
          url += `?date=${dateVal}`;
      } else {
          url += `?month=${monthVal}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: token }
      });
      
      setAttendance(res.data || []); 
      
      // Handle Missing list (if sent by backend, though history route usually sends array of records)
      // If your backend separates them, adjust here. Assuming standard list:
      // Note: The history route we built returns a flat array of attendance.
      // Missing logic is usually separate, but if your backend sends { attendance: [], missing: [] }
      // then use res.data.attendance. If it sends just [], use res.data.
      
      if (Array.isArray(res.data)) {
         setAttendance(res.data);
      } else {
         setAttendance(res.data.attendance || []);
         // Filter Owner from missing list
         const rawMissing = res.data.missing || [];
         setMissing(rawMissing.filter(e => e.role !== 'Owner'));
      }

    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // --- HELPER: GET EMPLOYEE OBJECT SAFLY ---
  // This bridges the gap between old 'userId' and new 'employee' field names
  const getEmp = (row) => row.employee || row.userId || {};

  // --- PROCESSING DATA ---
  const getProcessedData = () => {
    let filtered = attendance.filter(item => {
        const emp = getEmp(item);

        // Hide Owner
        if (emp.role === 'Owner') return false;

        const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        
        const matchesSearch = name.includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesDept = deptFilter === 'All' || emp.department === deptFilter;

        return matchesSearch && matchesStatus && matchesDept;
    });

    // Sort
    if (sortConfig.key) {
        filtered.sort((a, b) => {
            let aValue, bValue;
            const empA = getEmp(a);
            const empB = getEmp(b);

            if (sortConfig.key === 'name') {
                aValue = `${empA.firstName} ${empA.lastName}`.toLowerCase();
                bValue = `${empB.firstName} ${empB.lastName}`.toLowerCase();
            } else {
                aValue = a[sortConfig.key] ? new Date(a[sortConfig.key]).getTime() : 0;
                bValue = b[sortConfig.key] ? new Date(b[sortConfig.key]).getTime() : 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return filtered;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    const data = getProcessedData();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Employee,Department,In,Out,Status,Late Minutes,Overtime\n"; 
    
    data.forEach(row => {
        const emp = getEmp(row);
        const name = `${emp.firstName} ${emp.lastName}`;
        const date = new Date(row.date).toLocaleDateString();
        const checkIn = row.clockIn ? new Date(row.clockIn).toLocaleTimeString() : (row.clockInTime ? new Date(row.clockInTime).toLocaleTimeString() : '-');
        const checkOut = row.clockOut ? new Date(row.clockOut).toLocaleTimeString() : (row.clockOutTime ? new Date(row.clockOutTime).toLocaleTimeString() : '-');
        
        csvContent += `${date},${name},${emp.department},${checkIn},${checkOut},${row.status},${row.lateMinutes},${row.isOvertime ? 'Yes' : 'No'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${viewMode === 'day' ? dateVal : monthVal}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const getStatusColor = (status) => {
    if (status === 'Present') return 'success';
    if (status === 'Late') return 'warning';
    if (status === 'Absent') return 'error';
    return 'default';
  };
  
  const formatTime = (time) => time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ verticalAlign: 'middle', ml: 0.5 }}/> : <ArrowDownwardIcon fontSize="small" sx={{ verticalAlign: 'middle', ml: 0.5 }}/>;
  };

  const processedData = getProcessedData();

  // Extract unique departments safely
  const uniqueDepartments = [...new Set(attendance.map(item => getEmp(item).department).filter(Boolean))];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          {role === 'Employee' ? 'My Attendance' : 'Attendance Overview'}
        </Typography>

        {role !== 'Employee' && (
          <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary" indicatorColor="primary">
            <Tab label="Log & History" />
            <Tab label="Manage Shifts" />
          </Tabs>
        )}
      </Box>

      {/* --- TAB 0: HISTORY & FILTERS --- */}
      {tab === 0 && (
        <>
          {/* FILTER BAR */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
             <Grid container spacing={2} alignItems="center">
                
                {/* 1. VIEW MODE TOGGLE */}
                <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>View Mode</InputLabel>
                        <Select value={viewMode} label="View Mode" onChange={(e) => setViewMode(e.target.value)}>
                            <MenuItem value="day">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarTodayIcon fontSize="small"/> Daily
                                </Box>
                            </MenuItem>
                            <MenuItem value="month">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarViewMonthIcon fontSize="small"/> Monthly
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* 2. DATE / MONTH PICKER */}
                <Grid item xs={12} md={2}>
                    {viewMode === 'day' ? (
                        <TextField 
                            label="Select Date" type="date" fullWidth size="small"
                            value={dateVal} onChange={(e) => setDateVal(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    ) : (
                        <TextField 
                            label="Select Month" type="month" fullWidth size="small"
                            value={monthVal} onChange={(e) => setMonthVal(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    )}
                </Grid>

                {/* 3. DEPARTMENT FILTER */}
                <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Department</InputLabel>
                        <Select value={deptFilter} label="Department" onChange={(e) => setDeptFilter(e.target.value)}>
                            <MenuItem value="All">All Departments</MenuItem>
                            {uniqueDepartments.map(dept => (
                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* 4. Search Name */}
                <Grid item xs={12} md={3}>
                    <TextField 
                        placeholder="Search Employee..." fullWidth size="small"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                        }}
                        value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                </Grid>

                {/* 5. Status Filter */}
                <Grid item xs={12} md={1.5}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="Present">Present</MenuItem>
                            <MenuItem value="Late">Late</MenuItem>
                            <MenuItem value="Absent">Absent</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* 6. Export Button */}
                <Grid item xs={12} md={1.5} sx={{ textAlign: 'right' }}>
                    <Button 
                        variant="outlined" startIcon={<DownloadIcon />} size="small"
                        onClick={handleExport}
                        sx={{ minWidth: '100px' }}
                    >
                        Export
                    </Button>
                </Grid>
             </Grid>
          </Paper>

          {/* --- MISSING ALERTS SECTION --- */}
          {role !== 'Employee' && viewMode === 'day' && missing.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold' }}>
                    ⚠️ Action Required: {missing.length} Employees have not clocked in today!
                </Alert>
                <Grid container spacing={2}>
                    {missing.map(emp => (
                        <Grid item xs={12} md={4} key={emp._id}>
                            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderLeft: '4px solid #d32f2f' }}>
                                <Avatar src={`https://hrms-backend-8254.onrender.com/${emp.profilePicture}`} sx={{ width: 50, height: 50 }} />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">{emp.firstName} {emp.lastName}</Typography>
                                    <Typography variant="caption" color="textSecondary">{emp.department}</Typography>
                                    <Typography variant="caption" display="block" color="error" fontWeight="bold">NOT SEEN</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
              </Box>
          )}

          {/* TABLE */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  {/* COLUMN 1: DATE */}
                  <TableCell onClick={() => handleSort('date')} sx={{ cursor: 'pointer', '&:hover': {bgcolor: '#e0e0e0'} }}>
                      <strong>Date</strong> <SortArrow columnKey="date" />
                  </TableCell>
                  
                  {/* COLUMN 2: EMPLOYEE */}
                  <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer', '&:hover': {bgcolor: '#e0e0e0'} }}>
                      <strong>Employee</strong> <SortArrow columnKey="name" />
                  </TableCell>

                  <TableCell onClick={() => handleSort('clockIn')} sx={{ cursor: 'pointer', '&:hover': {bgcolor: '#e0e0e0'} }}>
                      <strong>In</strong> <SortArrow columnKey="clockIn" />
                  </TableCell>
                  <TableCell onClick={() => handleSort('clockOut')} sx={{ cursor: 'pointer', '&:hover': {bgcolor: '#e0e0e0'} }}>
                      <strong>Out</strong> <SortArrow columnKey="clockOut" />
                  </TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Late By</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedData.length === 0 && missing.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No records found matching filters.</TableCell></TableRow>
                ) : (
                    processedData.map((row) => {
                      const emp = getEmp(row);
                      // Handle field names from both old (clockInTime) and new (clockIn) schemas
                      const timeIn = row.clockIn || row.clockInTime;
                      const timeOut = row.clockOut || row.clockOutTime;

                      return (
                        <TableRow key={row._id} hover>
                          <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={emp.profilePicture ? `https://hrms-backend-8254.onrender.com/${emp.profilePicture}` : null} />
                              <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                      {emp.firstName} {emp.lastName}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                      {emp.department}
                                  </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>{formatTime(timeIn)}</TableCell>
                          <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>{formatTime(timeOut)}</TableCell>
                          <TableCell>
                              {row.isOvertime ? (
                                  <Chip 
                                      label="Overtime" 
                                      size="small" 
                                      sx={{ bgcolor: '#7b1fa2', color: 'white', fontWeight: 'bold' }} 
                                      icon={<AccessTimeIcon style={{color:'white'}} />} 
                                  />
                              ) : (
                                  <Chip label={row.status} color={getStatusColor(row.status)} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                              )}
                          </TableCell>
                          <TableCell>
                              {row.isOvertime ? '-' : (row.lateMinutes > 0 ? <span style={{ color: 'orange', fontWeight: 'bold' }}>{row.lateMinutes} mins</span> : '-')}
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* --- TAB 1: SHIFT MANAGER (Admin Only) --- */}
      {tab === 1 && role !== 'Employee' && (
        <ShiftManager />
      )}
    </Box>
  );
}