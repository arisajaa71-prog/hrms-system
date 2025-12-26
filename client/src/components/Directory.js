import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Paper, Typography, Box, Avatar, Chip, TextField, InputAdornment, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled, tableCellClasses,
  Grid, MenuItem, Autocomplete, Slider, Tooltip, Card, CardContent, Badge
} from '@mui/material';
import Tree from 'react-d3-tree'; 
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

// --- ICONS ---
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; 
import ListIcon from '@mui/icons-material/List';
import TuneIcon from '@mui/icons-material/Tune'; 
import DeleteIcon from '@mui/icons-material/Delete'; 
import LocationCityIcon from '@mui/icons-material/LocationCity'; 
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; 
import CameraAltIcon from '@mui/icons-material/CameraAlt'; 
import BadgeIcon from '@mui/icons-material/Badge';
import GroupsIcon from '@mui/icons-material/Groups';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; 
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; 
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; 

// --- STYLES & CONSTANTS ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#EF5350'];

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main, 
    color: theme.palette.common.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': { backgroundColor: '#e3f2fd !important' },
  '&:last-child td, &:last-child th': { border: 0 },
}));

const wideMenuProps = { PaperProps: { style: { width: 'auto', minWidth: 300 } } };

// --- HELPERS ---
function getAvatarProps(emp) {
    if (emp && emp.profilePicture) {
        return { src: `http://localhost:5001/${emp.profilePicture}`, alt: emp.firstName };
    }
    const name = emp ? `${emp.firstName} ${emp.lastName}` : "User";
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    let color = '#';
    for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xff; color += `00${value.toString(16)}`.slice(-2); }
    return { sx: { bgcolor: color }, children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}` };
}

const transformToTreeData = (nodes) => {
    return nodes.map(node => ({
      name: `${node.firstName} ${node.lastName}`,
      attributes: { ...node, role: node.designation },
      children: node.children ? transformToTreeData(node.children) : []
    }));
};

const renderForeignObjectNode = ({ nodeDatum, toggleNode, foreignObjectProps, onProfileClick }) => {
    const emp = nodeDatum.attributes;
    return (
      <g>
        <foreignObject {...foreignObjectProps}>
          <Paper 
              elevation={3} 
              sx={{ 
                  p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                  width: '100%', height: '100%', border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff',
                  cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': { boxShadow: 6, borderColor: 'primary.main', transform: 'scale(1.02)' }
              }}
              onClick={(e) => { e.stopPropagation(); if (emp && emp._id) onProfileClick(emp); }}
          >
              <Avatar {...getAvatarProps(emp)} sx={{ width: 50, height: 50, mb: 1, ...getAvatarProps(emp).sx }} />
              <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ width: '100%', fontSize: '0.9rem' }}>{nodeDatum.name}</Typography>
              <Typography variant="caption" color="textSecondary" noWrap sx={{ width: '100%' }}>{emp.designation}</Typography>
              <Chip label={emp.department} size="small" sx={{ mt: 1, height: 20, fontSize: '0.7rem', bgcolor: '#e3f2fd', color: '#1565c0' }} />
          </Paper>
        </foreignObject>
      </g>
    );
};

export default function Directory({ role, isHR, actionTarget, setActionTarget }) { 
  const navigate = useNavigate(); 
  
  // --- STATE MANAGEMENT ---
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All'); 
  const [viewMode, setViewMode] = useState(0); 

  const [sepSibling, setSepSibling] = useState(2); 
  const [sepTeam, setSepTeam] = useState(4); 
  
  const [openAdd, setOpenAdd] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null); 
  const [tabValue, setTabValue] = useState(0); 
  const [isEditing, setIsEditing] = useState(false);
  
  const [editData, setEditData] = useState({}); 
  const [selectedFile, setSelectedFile] = useState(null); 
  
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  const [adminResetPass, setAdminResetPass] = useState('');

  const [openPromote, setOpenPromote] = useState(false);
  const [promoteData, setPromoteData] = useState({
      newDesignation: '', newDepartment: '', newReportsTo: '', newLocation: '', effectiveDate: ''
  });

  const [openOnboarding, setOpenOnboarding] = useState(false);
  const [newEmployee, setNewEmployee] = useState(null);

  // --- ROLE CHECKING ---
  const isOwner = role === 'Owner';
  const isSeniorAdmin = role === 'Senior Admin';
  const isAdmin = role === 'Admin';
  
  const isManagement = isOwner || isSeniorAdmin || isAdmin; 
  const canEdit = isOwner || isSeniorAdmin; 
  // Allow Role Editing only for Owner or Senior Admin
  const canEditRole = isOwner || isSeniorAdmin; 
  
  const canSeePrivate = isManagement; 
  const canSeeJoiningDate = isManagement;
  const canSeeDOB = isManagement;
  
  const showRoleColumn = isOwner || isSeniorAdmin || isHR;

  let currentUserId = null;
  try { currentUserId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).user.id; } catch(e) {}

  const initialFormState = {
    employeeId: '', 
    firstName: '', lastName: '', email: '', department: '', role: 'Employee', 
    designation: 'Staff', dob: '', mobile: '', joiningDate: '', reportsTo: '', workLocation: 'Head Office' 
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { fetchEmployees(); }, []);

  const availableDepartments = [
      'Human Resources', 'IT', 'Operations', 'Management', 'Finance', 'Sales', 
      ...new Set(employees.map(e => e.department))
  ].filter((v, i, a) => v && a.indexOf(v) === i); 

  useEffect(() => {
      if (actionTarget && employees.length > 0) {
          const target = employees.find(e => e._id === actionTarget.id);
          if (target) {
              handleCardClick(target); 
              setTabValue(actionTarget.tab || 0); 
              if(setActionTarget) setActionTarget(null);
          }
      }
  }, [actionTarget, employees, setActionTarget]);

  const fetchEmployees = async () => {
    try { 
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/employees', { headers: { Authorization: token } }); 
        setEmployees(res.data); 
    } catch(err) { console.error(err); }
  };

  const buildHierarchy = () => {
      if (employees.length === 0) return [];
      const empMap = {};
      employees.forEach(emp => empMap[emp._id] = { ...emp, children: [] });
      const roots = [];
      employees.forEach(emp => {
          if (emp.reportsTo && empMap[emp.reportsTo._id]) {
              empMap[emp.reportsTo._id].children.push(empMap[emp._id]);
          } else {
              roots.push(empMap[emp._id]);
          }
      });
      return roots;
  };
  
  const hierarchyRoots = buildHierarchy();
  let treeData = null;
  if (hierarchyRoots.length > 0) {
      const transformed = transformToTreeData(hierarchyRoots);
      if (transformed.length === 1) treeData = transformed[0];
      else treeData = { name: 'Organization', attributes: { role: '', department: '' }, children: transformed };
  }

  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());
  
  const filteredEmployees = employees
    .filter(emp => {
        const matchesSearch = emp.firstName.toLowerCase().includes(searchTerm) || emp.lastName.toLowerCase().includes(searchTerm);
        const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
        return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
        return (a.employeeId || '').localeCompare((b.employeeId || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

  const totalHeadcount = employees.length;
  const deptCounts = employees.reduce((acc, emp) => {
      const dept = emp.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
  }, {});
  const pieData = Object.entries(deptCounts).map(([key, value]) => ({ name: key, value }));

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  
  const handleOpenAddModal = () => { setFormData(initialFormState); setSelectedFile(null); setOpenAdd(true); };
  
  const handleAddSubmit = async () => { 
    try {
        const token = localStorage.getItem('token');
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (selectedFile) data.append('image', selectedFile);
        data.append('salary', 0); 
        
        const res = await axios.post('http://localhost:5001/api/employees/add', data, { 
            headers: { Authorization: token, 'Content-Type': 'multipart/form-data' } 
        });
        
        setOpenAdd(false); 
        setNewEmployee(res.data);
        setOpenOnboarding(true); 
        fetchEmployees();

    } catch(err) { alert(err.response?.data?.msg || "Error adding employee"); }
  };
  
  const handleSetSalaryNow = () => {
      setOpenOnboarding(false);
      setTimeout(() => {
          navigate('/payroll', { state: { onboardId: newEmployee._id } });
      }, 100);
  };

  const handleUpdate = async () => { 
      try {
        const token = localStorage.getItem('token');
        if (selectedFile) {
            const data = new FormData();
            data.append('firstName', editData.firstName);
            data.append('lastName', editData.lastName);
            data.append('email', editData.email);
            data.append('department', editData.department);
            data.append('designation', editData.designation);
            data.append('role', editData.role);
            data.append('employeeId', editData.employeeId);
            data.append('mobile', editData.mobile);
            data.append('dob', editData.dob);
            data.append('joiningDate', editData.joiningDate);
            data.append('workLocation', editData.workLocation);
            if (editData.reportsTo) data.append('reportsTo', editData.reportsTo);
            data.append('image', selectedFile);

            const res = await axios.put(`http://localhost:5001/api/employees/${selectedEmp._id}`, data, {
                headers: { Authorization: token, 'Content-Type': 'multipart/form-data' }
            });
            alert("Profile & Photo Updated!");
            setSelectedEmp(res.data);
        } else {
            const payload = {
                firstName: editData.firstName,
                lastName: editData.lastName,
                email: editData.email,
                department: editData.department,
                designation: editData.designation,
                role: editData.role,
                employeeId: editData.employeeId,
                mobile: editData.mobile,
                dob: editData.dob,
                joiningDate: editData.joiningDate,
                reportsTo: editData.reportsTo,
                workLocation: editData.workLocation
            };
            const res = await axios.put(`http://localhost:5001/api/employees/${selectedEmp._id}`, payload, {
                headers: { Authorization: token, 'Content-Type': 'application/json' }
            });
            alert("Profile Updated Successfully!");
            setSelectedEmp(res.data);
        }
        setIsEditing(false);
        fetchEmployees();
      } catch (err) { alert(err.response?.data?.msg || "Error updating profile"); }
  };

  const handleDelete = async () => { 
      if (!window.confirm(`Are you sure you want to delete ${selectedEmp.firstName}?`)) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5001/api/employees/${selectedEmp._id}`, { headers: { Authorization: token } });
          alert("Deleted"); setOpenView(false); fetchEmployees();
      } catch (err) { alert("Error deleting"); }
  };

  const handleChangePassword = async () => { 
      try {
          const token = localStorage.getItem('token');
          await axios.put('http://localhost:5001/api/auth/change-password', passData, { headers: { Authorization: token } });
          alert("Password Changed Successfully!");
          setPassData({ currentPassword: '', newPassword: '' });
      } catch (err) { alert(err.response?.data?.msg || "Error changing password"); }
  };

  const handleAdminReset = async () => { 
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5001/api/employees/${selectedEmp._id}/force-reset`, 
            { newPassword: adminResetPass }, { headers: { Authorization: token } }
          );
          alert(`Password reset to: ${adminResetPass}`);
          setAdminResetPass('');
      } catch (err) { alert("Error resetting password"); }
  };

  const handleCardClick = (emp) => { 
      setSelectedEmp(emp); 
      const managerId = emp.reportsTo ? (emp.reportsTo._id || emp.reportsTo) : '';
      setEditData({ ...emp, reportsTo: managerId }); 
      setSelectedFile(null); setIsEditing(false); setTabValue(0); setOpenView(true); 
  };

  const handlePromoteClick = (emp, e) => { 
      e.stopPropagation(); setSelectedEmp(emp); 
      setPromoteData({ newDesignation: emp.designation, newDepartment: emp.department, newReportsTo: emp.reportsTo?._id || '', newLocation: emp.workLocation || 'Head Office', effectiveDate: new Date().toISOString().split('T')[0] }); 
      setOpenPromote(true); 
  };

  const handleSubmitPromotion = async () => { 
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5001/api/employees/${selectedEmp._id}/promote`, promoteData, { headers: { Authorization: token } });
        alert("Employee Promoted Successfully!"); setOpenPromote(false); fetchEmployees(); 
    } catch (err) { alert(err.response?.data?.msg || "Error promoting employee"); }
  };

  const isMyProfile = selectedEmp && selectedEmp._id === currentUserId;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>🏢 Team Directory</Typography>
        <Box>
            <Tabs value={viewMode} onChange={(e,v) => setViewMode(v)} sx={{ mb: 2 }}>
                <Tab icon={<ListIcon />} label="List" />
                <Tab icon={<AccountTreeIcon />} label="Hierarchy" />
            </Tabs>
        </Box>
        {canEdit && <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenAddModal}>Add Employee</Button>}
      </Box>

      {viewMode === 0 && (
        <>
            {isManagement ? (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            <GroupsIcon sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: 140, opacity: 0.1 }} />
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 'bold', textTransform: 'uppercase' }}>Total Headcount</Typography>
                                <Typography variant="h2" fontWeight="bold" sx={{ mt: 1 }}>{totalHeadcount}</Typography>
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label="Active" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Employees</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}> 
                        <Card elevation={3} sx={{ height: 280, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 2, pb: 0 }}><Typography variant="h6" fontWeight="bold" color="textPrimary">Department Distribution</Typography></Box>
                            <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}> 
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ paddingRight: 20, fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={5}> 
                        <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FilterListIcon color="primary"/> Quick Filters</Typography>
                                <TextField fullWidth placeholder="Search Name..." size="small" value={searchTerm} variant="outlined" sx={{ bgcolor: '#f5f5f5' }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }} onChange={handleSearch} />
                                <TextField select label="Department" size="small" fullWidth value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                                    <MenuItem value="All">All Departments</MenuItem>
                                    {availableDepartments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                </TextField>
                                <Box sx={{ mt: 'auto', pt: 2 }}>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>Active Departments:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {Object.entries(deptCounts).map(([dept, count]) => (
                                            <Chip key={dept} label={`${dept}: ${count}`} variant={deptFilter === dept ? "filled" : "outlined"} color={deptFilter === dept ? "primary" : "default"} onClick={() => setDeptFilter(dept === deptFilter ? 'All' : dept)} size="small" sx={{ cursor: 'pointer', borderColor: '#e0e0e0' }} />
                                        ))}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            ) : (
                <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 2 }}>
                    <SearchIcon color="primary" />
                    <TextField fullWidth placeholder="Search for a colleague..." variant="standard" InputProps={{ disableUnderline: true }} value={searchTerm} onChange={handleSearch} />
                    <Divider orientation="vertical" flexItem />
                    <TextField select variant="standard" InputProps={{ disableUnderline: true }} sx={{ width: 220 }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                        <MenuItem value="All">All Departments</MenuItem>
                        {availableDepartments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                </Paper>
            )}
        </>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 0 && (
          <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 700 }} aria-label="directory table">
            <TableHead>
                <TableRow>
                <StyledTableCell>ID</StyledTableCell> 
                <StyledTableCell>Employee</StyledTableCell>
                <StyledTableCell>Designation</StyledTableCell>
                <StyledTableCell>Department</StyledTableCell>
                {showRoleColumn && <StyledTableCell>System Role</StyledTableCell>}
                {isManagement && <StyledTableCell>Manager</StyledTableCell>}
                {isManagement && <StyledTableCell>Mobile</StyledTableCell>}
                {canEdit && <StyledTableCell align="center">Actions</StyledTableCell>} 
                </TableRow>
            </TableHead>
            <TableBody>
                {filteredEmployees.map((emp) => (
                <StyledTableRow key={emp._id} onClick={() => handleCardClick(emp)}>
                    <StyledTableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{emp.employeeId || '-'}</StyledTableCell>
                    <StyledTableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar {...getAvatarProps(emp)} sx={{ width: 40, height: 40, ...getAvatarProps(emp).sx }} />
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{emp.firstName} {emp.lastName}</Typography>
                            <Typography variant="caption" color="textSecondary">{emp.email}</Typography>
                        </Box>
                    </Box>
                    </StyledTableCell>
                    <StyledTableCell>{emp.designation}</StyledTableCell>
                    <StyledTableCell><Chip label={emp.department} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'bold' }} /></StyledTableCell>
                    
                    {showRoleColumn && (
                        <StyledTableCell>
                            <Chip 
                                icon={<AdminPanelSettingsIcon style={{ fontSize: 16 }} />}
                                label={emp.role} 
                                size="small" 
                                color={emp.role === 'Owner' ? 'warning' : emp.role.includes('Admin') ? 'secondary' : 'default'} 
                                variant={emp.role === 'Employee' ? 'outlined' : 'filled'}
                            />
                        </StyledTableCell>
                    )}

                    {isManagement && (
                        <StyledTableCell>
                            {emp.reportsTo ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SupervisorAccountIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                        {emp.reportsTo.firstName ? `${emp.reportsTo.firstName} ${emp.reportsTo.lastName}` : '...'}
                                    </Typography>
                                </Box>
                            ) : '-'}
                        </StyledTableCell>
                    )}
                    {isManagement && <StyledTableCell>{emp.mobile || '-'}</StyledTableCell>}
                    {canEdit && (
                        <StyledTableCell align="center">
                            <Tooltip title="Promote Employee">
                                <IconButton color="primary" onClick={(e) => handlePromoteClick(emp, e)} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', '&:hover': { bgcolor: '#c8e6c9' } }}>
                                    <TrendingUpIcon />
                                </IconButton>
                            </Tooltip>
                        </StyledTableCell>
                    )}
                </StyledTableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
      )}

      {/* --- TREE VIEW --- */}
      {viewMode === 1 && (
          <Paper elevation={3} sx={{ borderRadius: 2, height: '80vh', overflow: 'hidden', border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" color="primary" fontWeight="bold">Organizational Structure</Typography>
                    <Typography variant="caption" color="textSecondary">Scroll to zoom, drag to move. Click card for details.</Typography>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 1, display: 'flex', gap: 4, alignItems: 'center', bgcolor: '#fff' }}>
                      <Box sx={{ width: 150 }}><Typography variant="caption" display="block" gutterBottom><TuneIcon fontSize="inherit"/> Same Team Spacing</Typography><Slider size="small" value={sepSibling} min={1} max={5} step={0.5} onChange={(e,v) => setSepSibling(v)} /></Box>
                      <Box sx={{ width: 150 }}><Typography variant="caption" display="block" gutterBottom><TuneIcon fontSize="inherit"/> Different Team Gap</Typography><Slider size="small" value={sepTeam} min={2} max={10} step={0.5} onChange={(e,v) => setSepTeam(v)} /></Box>
                  </Paper>
              </Box>
              <Box sx={{ flexGrow: 1, bgcolor: '#fafafa' }}>
                  {treeData ? <Tree data={treeData} orientation="vertical" translate={{ x: 600, y: 50 }} pathFunc="step" separation={{ siblings: sepSibling, nonSiblings: sepTeam }} nodeSize={{ x: 250, y: 200 }} renderCustomNodeElement={(rd3tProps) => renderForeignObjectNode({ ...rd3tProps, foreignObjectProps: { width: 220, height: 160, x: -110, y: -20 }, onProfileClick: handleCardClick })} /> : <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Typography color="textSecondary">No hierarchy data available. Assign managers to see the chart.</Typography></Box>}
              </Box>
          </Paper>
      )}

      {/* --- DIALOGS (View/Edit, Add, Promote) --- */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="sm" fullWidth>
        {selectedEmp && (
            <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
                {isEditing ? 'Edit Profile' : 'Employee Profile'}
                <Box>
                    {canEdit && !isEditing && tabValue === 0 && <IconButton onClick={() => setIsEditing(true)} color="primary"><EditIcon /></IconButton>}
                    <IconButton onClick={() => setOpenView(false)}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            {(isMyProfile || canEdit) && (
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} centered sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tab label="Info" />
                    <Tab label="Security" icon={isMyProfile ? <LockIcon fontSize="small"/> : <SecurityIcon fontSize="small"/>} iconPosition="start" />
                </Tabs>
            )}
            <DialogContent>
                {tabValue === 0 && (
                    <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 2 }}>
                        <Avatar {...getAvatarProps(selectedEmp)} sx={{ width: 100, height: 100, fontSize: '2.5rem', mb: 2, ...getAvatarProps(selectedEmp).sx }} />
                        {isEditing && <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>Change Photo <input type="file" hidden onChange={handleFileChange} /></Button>}
                        {isEditing ? (
                            <Grid container spacing={2}>
                                {/* EDIT: ADD ID FIELD HERE */}
                                <Grid item xs={12}><TextField fullWidth label="Employee ID" value={editData.employeeId || ''} onChange={(e) => setEditData({...editData, employeeId: e.target.value})} helperText="Unique ID (e.g., EMP001)" /></Grid>
                                
                                {/* --- THE FIX: ADD ROLE DROPDOWN HERE FOR EDIT MODE --- */}
                                {canEditRole && (
                                    <Grid item xs={12}>
                                        <TextField select label="System Role" fullWidth value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})} helperText="Caution: Changing this affects permissions immediately.">
                                            <MenuItem value="Employee">Employee</MenuItem>
                                            <MenuItem value="Admin">Admin</MenuItem>
                                            <MenuItem value="Senior Admin">Senior Admin</MenuItem>
                                        </TextField>
                                    </Grid>
                                )}

                                <Grid item xs={6}><TextField fullWidth label="First Name" value={editData.firstName} onChange={(e) => setEditData({...editData, firstName: e.target.value})} /></Grid>
                                <Grid item xs={6}><TextField fullWidth label="Last Name" value={editData.lastName} onChange={(e) => setEditData({...editData, lastName: e.target.value})} /></Grid>
                                <Grid item xs={6}><TextField fullWidth label="Designation" value={editData.designation} onChange={(e) => setEditData({...editData, designation: e.target.value})} /></Grid>
                                <Grid item xs={6}><Autocomplete freeSolo options={availableDepartments} value={editData.department || ''} onInputChange={(event, newInputValue) => setEditData({...editData, department: newInputValue})} renderInput={(params) => <TextField {...params} label="Department" fullWidth />} componentsProps={{ paper: { sx: { minWidth: 300 } } }} /></Grid>
                            </Grid>
                        ) : (
                            <>
                                <Typography variant="h5">{selectedEmp.firstName} {selectedEmp.lastName}</Typography>
                                <Typography color="textSecondary">{selectedEmp.designation} • {selectedEmp.department}</Typography>
                                {selectedEmp.employeeId && <Chip label={`ID: ${selectedEmp.employeeId}`} size="small" sx={{ mt: 1 }} />}
                                {selectedEmp.reportsTo && <Chip icon={<SupervisorAccountIcon />} label={`Reports to: ${selectedEmp.reportsTo.firstName} ${selectedEmp.reportsTo.lastName}`} sx={{ mt: 1, ml: 1 }} variant="outlined" />}
                            </>
                        )}
                    </Box>
                    <Grid container spacing={2}>
                        {isEditing && (
                            <Grid item xs={12}>
                                <TextField select fullWidth label="Reports To (Line Manager)" value={editData.reportsTo || ''} onChange={(e) => setEditData({...editData, reportsTo: e.target.value})} SelectProps={wideMenuProps}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {employees.filter(e => e._id !== selectedEmp._id).map(e => (<MenuItem key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.designation})</MenuItem>))}
                                </TextField>
                            </Grid>
                        )}
                        <Grid item xs={6}><Typography variant="subtitle2" color="textSecondary">Email</Typography>{isEditing ? <TextField size="small" fullWidth value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} /> : <Typography>{selectedEmp.email}</Typography>}</Grid>
                        {canSeeJoiningDate && <Grid item xs={6}><Typography variant="subtitle2" color="textSecondary">Joining Date</Typography>{isEditing ? <TextField type="date" size="small" fullWidth value={editData.joiningDate ? new Date(editData.joiningDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditData({...editData, joiningDate: e.target.value})} /> : <Typography>{selectedEmp.joiningDate ? new Date(selectedEmp.joiningDate).toLocaleDateString() : 'N/A'}</Typography>}</Grid>}
                        <Grid item xs={12}><Divider /></Grid>
                        {canSeeDOB && <Grid item xs={6}><Typography variant="subtitle2" color="textSecondary">DOB</Typography>{isEditing ? <TextField type="date" size="small" fullWidth value={editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : ''} onChange={(e) => setEditData({...editData, dob: e.target.value})} /> : <Typography>{selectedEmp.dob ? new Date(selectedEmp.dob).toLocaleDateString() : 'N/A'}</Typography>}</Grid>}
                        {canSeePrivate && (
                            <>
                                <Grid item xs={6}><Typography variant="subtitle2" color="textSecondary">Mobile</Typography>{isEditing ? <TextField size="small" fullWidth value={editData.mobile} onChange={(e) => setEditData({...editData, mobile: e.target.value})} /> : <Typography>{selectedEmp.mobile || 'N/A'}</Typography>}</Grid>
                                <Grid item xs={12}><Typography variant="subtitle2" color="textSecondary">Location</Typography>{isEditing ? <TextField fullWidth label="City" value={editData.workLocation} onChange={(e) => setEditData({...editData, workLocation: e.target.value})} /> : <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocationCityIcon color="action" fontSize="small" /><Typography>{selectedEmp.workLocation || 'Head Office'}</Typography></Box>}</Grid>
                            </>
                        )}
                    </Grid>
                    </>
                )}
                {tabValue === 1 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        {isMyProfile ? (
                            <>
                                <Typography variant="h6" gutterBottom>Change Password</Typography>
                                <TextField fullWidth type="password" label="Current Password" sx={{ mb: 2 }} value={passData.currentPassword} onChange={(e) => setPassData({...passData, currentPassword: e.target.value})} />
                                <TextField fullWidth type="password" label="New Password (Min 6 chars)" sx={{ mb: 2 }} value={passData.newPassword} onChange={(e) => setPassData({...passData, newPassword: e.target.value})} />
                                <Button variant="contained" color="primary" fullWidth onClick={handleChangePassword}>Update Password</Button>
                            </>
                        ) : (
                            canEdit && (
                                <Paper sx={{ p: 2, bgcolor: '#fff4e5', border: '1px solid #ffe0b2' }}>
                                    <Typography variant="h6" color="warning.main">Admin Override</Typography>
                                    <TextField fullWidth label="Set Temporary Password" sx={{ mb: 2, mt: 2 }} value={adminResetPass} onChange={(e) => setAdminResetPass(e.target.value)} />
                                    <Button variant="contained" color="warning" fullWidth onClick={handleAdminReset}>Force Reset Password</Button>
                                </Paper>
                            )
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {isEditing && <Button onClick={handleDelete} color="error" startIcon={<DeleteIcon />} sx={{ mr: 'auto' }}>Delete</Button>}
                {isEditing ? <><Button onClick={() => { setIsEditing(false); fetchEmployees(); }}>Cancel</Button><Button variant="contained" startIcon={<SaveIcon />} onClick={handleUpdate}>Save</Button></> : <Button onClick={() => setOpenView(false)}>Close</Button>}
            </DialogActions>
            </>
        )}
      </Dialog>

      <Dialog open={openPromote} onClose={() => setOpenPromote(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TrendingUpIcon color="primary" /> Promote Employee</DialogTitle>
          <DialogContent dividers>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Promoting: {selectedEmp?.firstName} {selectedEmp?.lastName}</Typography>
              <Grid container spacing={2}>
                  <Grid item xs={12}><TextField label="New Designation" fullWidth value={promoteData.newDesignation} onChange={(e) => setPromoteData({...promoteData, newDesignation: e.target.value})} /></Grid>
                  <Grid item xs={6}><TextField label="New Department" fullWidth value={promoteData.newDepartment} onChange={(e) => setPromoteData({...promoteData, newDepartment: e.target.value})} /></Grid>
                  <Grid item xs={6}><TextField label="New Location" fullWidth value={promoteData.newLocation} onChange={(e) => setPromoteData({...promoteData, newLocation: e.target.value})} /></Grid>
                  <Grid item xs={12}>
                      <TextField select label="New Manager" fullWidth value={promoteData.newReportsTo} onChange={(e) => setPromoteData({...promoteData, newReportsTo: e.target.value})} SelectProps={wideMenuProps}>
                          <MenuItem value=""><em>No Manager</em></MenuItem>
                          {employees.filter(e => e._id !== selectedEmp?._id).map(e => (<MenuItem key={e._id} value={e._id}>{e.firstName} {e.lastName} - {e.designation}</MenuItem>))}
                      </TextField>
                  </Grid>
                  <Grid item xs={12}><TextField type="date" label="Effective Date" fullWidth InputLabelProps={{ shrink: true }} value={promoteData.effectiveDate} onChange={(e) => setPromoteData({...promoteData, effectiveDate: e.target.value})} /></Grid>
              </Grid>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setOpenPromote(false)}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleSubmitPromotion}>Confirm</Button>
          </DialogActions>
      </Dialog>
      
      {/* ADD EMPLOYEE DIALOG - UPDATED with EMP ID */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <input accept="image/*" style={{ display: 'none' }} id="avatar-upload-file" type="file" onChange={handleFileChange} />
                  <label htmlFor="avatar-upload-file">
                      <Tooltip title="Click to upload photo">
                          <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={<CameraAltIcon sx={{ bgcolor: 'white', borderRadius: '50%', p: 0.5, border: '1px solid #ddd', color: 'primary.main', width: 30, height: 30 }} />}>
                              <Avatar src={selectedFile ? URL.createObjectURL(selectedFile) : ""} sx={{ width: 100, height: 100, fontSize: '3rem', bgcolor: selectedFile ? 'transparent' : 'primary.main', cursor: 'pointer', border: '2px solid #eee' }}>{selectedFile ? null : <PersonAddIcon fontSize="inherit" />}</Avatar>
                          </Badge>
                      </Tooltip>
                  </label>
              </Box>
              <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#fcfcfc', border: '1px solid #f0f0f0', height: '100%' }}>
                          <Typography variant="h6" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '2px solid #e3f2fd', pb: 1 }}><BadgeIcon /> Personal Details</Typography>
                          <Grid container spacing={2}>
                              {/* --- NEW EMP ID FIELD --- */}
                              <Grid item xs={12}>
                                  <TextField label="Employee ID" fullWidth value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} placeholder="e.g. EMP001" helperText="Leave blank to auto-generate" InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment> }} />
                              </Grid>
                              <Grid item xs={12}><TextField label="First Name" fullWidth value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></Grid>
                              <Grid item xs={12}><TextField label="Last Name" fullWidth value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></Grid>
                              <Grid item xs={12}><TextField label="Date of Birth" type="date" InputLabelProps={{shrink: true}} fullWidth value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} /></Grid>
                              <Grid item xs={12}><TextField label="Email Address" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></Grid>
                              <Grid item xs={12}><TextField label="Mobile Number" fullWidth value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} /></Grid>
                          </Grid>
                      </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: '#fcfcfc', border: '1px solid #f0f0f0', height: '100%' }}>
                          <Typography variant="h6" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '2px solid #e3f2fd', pb: 1 }}><BusinessIcon /> Work Information</Typography>
                          <Grid container spacing={2}>
                              <Grid item xs={12}><Autocomplete freeSolo options={availableDepartments} value={formData.department} onInputChange={(event, newInputValue) => { setFormData({ ...formData, department: newInputValue }); }} renderInput={(params) => (<TextField {...params} label="Department" fullWidth />)} /></Grid>
                              <Grid item xs={12}><TextField label="Designation (Job Title)" fullWidth value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} /></Grid>
                              <Grid item xs={12}>
                                  <TextField select label="Reports To (Manager)" fullWidth value={formData.reportsTo} onChange={(e) => setFormData({...formData, reportsTo: e.target.value})} SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}>
                                      <MenuItem value=""><em>None</em></MenuItem>
                                      {employees.map(e => (<MenuItem key={e._id} value={e._id}>{e.firstName} {e.lastName} ({e.designation})</MenuItem>))}
                                  </TextField>
                              </Grid>
                              <Grid item xs={12}>
                                  <TextField select label="System Role" fullWidth value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} >
                                      <MenuItem value="Employee">Employee</MenuItem>
                                      <MenuItem value="Admin">Admin</MenuItem>
                                      <MenuItem value="Senior Admin">Senior Admin</MenuItem>
                                  </TextField>
                              </Grid>
                              <Grid item xs={12}><TextField label="Work Location" fullWidth value={formData.workLocation} onChange={(e) => setFormData({...formData, workLocation: e.target.value})} /></Grid>
                              <Grid item xs={12}><TextField label="Joining Date" type="date" InputLabelProps={{shrink: true}} fullWidth value={formData.joiningDate} onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} /></Grid>
                          </Grid>
                      </Paper>
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleAddSubmit}>Create Profile</Button>
          </DialogActions>
      </Dialog>

      {/* --- ONBOARDING SUCCESS DIALOG --- */}
      <Dialog open={openOnboarding} onClose={() => setOpenOnboarding(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ textAlign: 'center', bgcolor: '#e8f5e9', py: 3 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">Employee Created!</Typography>
              <Typography variant="body2" color="textSecondary">{newEmployee?.firstName} {newEmployee?.lastName} has been added successfully.</Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3e0', border: '1px solid #ffb74d' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <MonetizationOnIcon color="warning" fontSize="large" sx={{ mt: 0.5 }} />
                      <Box>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Action Required: Payroll Setup</Typography>
                          <Typography variant="body2" color="textSecondary" paragraph>This employee currently has <strong>$0 Salary</strong>. They will not appear in the payroll run until you configure their compensation.</Typography>
                          <Button variant="contained" color="warning" size="large" endIcon={<ArrowForwardIcon />} onClick={handleSetSalaryNow} fullWidth sx={{ fontWeight: 'bold' }}>Set Salary Now</Button>
                      </Box>
                  </Box>
              </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
              <Button onClick={() => setOpenOnboarding(false)} color="inherit">Do it later</Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
}