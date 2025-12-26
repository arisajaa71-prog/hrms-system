import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Paper, Typography, Box, Grid, TextField, Button, Tabs, Tab, MenuItem, 
  Divider, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Card, CardContent, CardActions, Avatar // <--- NEW IMPORTS for Docs
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WorkIcon from '@mui/icons-material/Work';
import FolderIcon from '@mui/icons-material/Folder';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description'; // <--- NEW
import DownloadIcon from '@mui/icons-material/Download';       // <--- NEW

// Component Import
import HeaderBanner from './HeaderBanner';

export default function MyInfo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', content: '' });
  const [tabValue, setTabValue] = useState(0); 

  const [formData, setFormData] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Decode token safely to get ID
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const myId = payload.user.id;
      
      setCurrentUserId(myId);

      const res = await axios.get('http://localhost:5001/api/employees', { 
        headers: { Authorization: token } 
      });
      
      const me = res.data.find(e => e._id === myId);
      if (me) {
          setFormData({
              ...me,
              dob: me.dob ? new Date(me.dob).toISOString().split('T')[0] : '',
              joiningDate: me.joiningDate ? new Date(me.joiningDate).toISOString().split('T')[0] : ''
          });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
      setSaving(true);
      setMsg({ type: '', content: '' });
      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5001/api/employees/${currentUserId}`, formData, {
              headers: { Authorization: token }
          });
          setMsg({ type: 'success', content: 'Profile Updated Successfully!' });
      } catch (err) {
          setMsg({ type: 'error', content: 'Failed to update profile.' });
      } finally {
          setSaving(false);
      }
  };

  // Helper to format dates for the table
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  // --- NEW HELPER: Render Document Card ---
  const renderDocumentCard = (title, filePath) => {
      if (!filePath) return null;

      // Clean path to ensure URL works
      const fileUrl = `http://localhost:5001/${filePath.replace(/\\/g, "/")}`;

      return (
          <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <DescriptionIcon />
                      </Avatar>
                      <Box>
                          <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
                          <Typography variant="caption" color="textSecondary">Document</Typography>
                      </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                      <Button 
                          size="small" 
                          startIcon={<DownloadIcon />} 
                          href={fileUrl} 
                          target="_blank" 
                          fullWidth
                      >
                          View / Download
                      </Button>
                  </CardActions>
              </Card>
          </Grid>
      );
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <HeaderBanner user={formData} /> 

      <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
              <Tab icon={<AccountCircleIcon/>} iconPosition="start" label="Personal" />
              <Tab icon={<WorkIcon/>} iconPosition="start" label="Job" />
              <Tab icon={<FolderIcon/>} iconPosition="start" label="Documents" />
          </Tabs>
      </Paper>

      {msg.content && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.content}</Alert>}

      {/* === TAB 0: PERSONAL INFORMATION === */}
      {tabValue === 0 && (
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>General Information</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Employee ID" value={formData.employeeId || ''} disabled variant="filled" /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="First Name" value={formData.firstName || ''} disabled variant="filled" /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Last Name" value={formData.lastName || ''} disabled variant="filled" /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Date of Joining" value={formData.joiningDate || ''} disabled variant="filled" /></Grid>

                  <Grid item xs={12} md={4}>
                      <TextField select fullWidth label="Gender" name="gender" value={formData.gender || ''} onChange={handleChange}>
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                      </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                      <TextField type="date" fullWidth label="Date of Birth" name="dob" InputLabelProps={{ shrink: true }} value={formData.dob || ''} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                      <TextField select fullWidth label="Marital Status" name="maritalStatus" value={formData.maritalStatus || ''} onChange={handleChange}>
                          <MenuItem value="Single">Single</MenuItem>
                          <MenuItem value="Married">Married</MenuItem>
                          <MenuItem value="Divorced">Divorced</MenuItem>
                          <MenuItem value="Widowed">Widowed</MenuItem>
                      </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Nationality" name="nationality" value={formData.nationality || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Citizenship 1" name="citizenship1" value={formData.citizenship1 || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Citizenship 2" name="citizenship2" value={formData.citizenship2 || ''} onChange={handleChange} /></Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>Address</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}><TextField fullWidth label="Street 1" name="street1" value={formData.street1 || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth label="Street 2" name="street2" value={formData.street2 || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="City" name="city" value={formData.city || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Postal Code" name="postalCode" value={formData.postalCode || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Country" name="country" value={formData.country || ''} onChange={handleChange} /></Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>Contact Information</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Work Email" name="email" value={formData.email || ''} onChange={handleChange} helperText="Unique login ID" /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Personal Email" name="personalEmail" value={formData.personalEmail || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Mobile Phone" name="mobile" value={formData.mobile || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Work Phone" name="workPhone" value={formData.workPhone || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Extension" name="extension" value={formData.extension || ''} onChange={handleChange} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Home Phone" name="homePhone" value={formData.homePhone || ''} onChange={handleChange} /></Grid>
              </Grid>

              <Box sx={{ textAlign: 'right' }}>
                  <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                  </Button>
              </Box>
          </Paper>
      )}

      {/* === TAB 1: JOB INFORMATION === */}
      {tabValue === 1 && (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            
            {/* 1. CURRENT POSITION */}
            <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
               <WorkIcon /> Current Position
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Job Title" value={formData.designation || ''} disabled variant="filled" />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Department" value={formData.department || ''} disabled variant="filled" />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Work Location" value={formData.workLocation || 'Head Office'} disabled variant="filled" />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField 
                        fullWidth 
                        label="Reports To" 
                        value={formData.reportsTo ? `${formData.reportsTo.firstName} ${formData.reportsTo.lastName}` : 'No Manager'} 
                        disabled 
                        variant="filled" 
                    />
                </Grid>
            </Grid>

            <Divider sx={{ mb: 4 }} />

            {/* 2. JOB HISTORY */}
            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
               <HistoryIcon /> Job History
            </Typography>

            {formData.jobHistory && formData.jobHistory.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Effective Date</strong></TableCell>
                                <TableCell><strong>Job Title</strong></TableCell>
                                <TableCell><strong>Department</strong></TableCell>
                                <TableCell><strong>Location</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {formData.jobHistory.map((job, index) => (
                                <TableRow key={index}>
                                    <TableCell>{formatDate(job.endDate)}</TableCell>
                                    <TableCell>{job.title}</TableCell>
                                    <TableCell>{job.department}</TableCell>
                                    <TableCell>{job.location || 'Head Office'}</TableCell>
                                    <TableCell><Chip label="Promoted" color="success" size="small" variant="outlined" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                    No promotion history available.
                </Typography>
            )}

        </Paper>
      )}

      {/* === TAB 2: DOCUMENTS (UPDATED) === */}
      {tabValue === 2 && (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
               <FolderIcon /> My Documents
            </Typography>

            {/* Check if any documents exist */}
            {!formData.documents || Object.values(formData.documents).every(doc => !doc) ? (
                <Box sx={{ textAlign: 'center', py: 5, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                    <DescriptionIcon sx={{ fontSize: 60, color: '#e0e0e0' }} />
                    <Typography color="textSecondary" sx={{ mt: 2 }}>
                        No documents found in your profile.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {renderDocumentCard("Passport", formData.documents.passport)}
                    {renderDocumentCard("National ID", formData.documents.nationalId)}
                    {renderDocumentCard("Resume / CV", formData.documents.resume)}
                    {renderDocumentCard("Signed Contract", formData.documents.contract)}
                </Grid>
            )}
        </Paper>
      )}
    </Box>
  );
}