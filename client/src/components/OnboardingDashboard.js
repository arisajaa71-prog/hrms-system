import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Grid, MenuItem, Alert, Divider, LinearProgress,
    FormControlLabel, Checkbox, InputAdornment, IconButton, Tooltip
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';

export default function OnboardingDashboard({ role, isHR }) {
    const [candidates, setCandidates] = useState([]);
    
    // Dialog States
    const [openInitiate, setOpenInitiate] = useState(false);
    const [openReview, setOpenReview] = useState(false);
    
    // Data States
    const [employees, setEmployees] = useState([]); 
    const [selectedCandidate, setSelectedCandidate] = useState(null); 
    
    // Work Email State
    const [workEmail, setWorkEmail] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', department: '',
        designation: '', reportsTo: '', joiningDate: '', offerSalary: ''
    });
    const [newAccessCode, setNewAccessCode] = useState(null);

    const canAccess = role === 'Owner' || role === 'Senior Admin' || isHR;

    useEffect(() => {
        if (canAccess) {
            fetchCandidates();
            fetchManagers();
        }
    }, [canAccess]);

    const fetchCandidates = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://hrms-backend-8254.onrender.com/api/onboarding', {
                headers: { Authorization: token }
            });
            setCandidates(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://hrms-backend-8254.onrender.com/api/employees', {
                headers: { Authorization: token }
            });
            setEmployees(res.data);
        } catch (err) { console.error(err); }
    };

    const calculateProgress = (candidate) => {
        if (!candidate.checklist) return 0;
        const totalTasks = 5; 
        let completed = 0;
        if (candidate.checklist.contractSigned) completed++;
        if (candidate.checklist.itSetup) completed++;
        if (candidate.checklist.accessCard) completed++;
        if (candidate.checklist.orientationScheduled) completed++;
        if (candidate.checklist.welcomeKit) completed++;
        return (completed / totalTasks) * 100;
    };

    // --- HANDLERS ---

    const handleInitiate = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('https://hrms-backend-8254.onrender.com/api/onboarding/initiate', formData, {
                headers: { Authorization: token }
            });
            setNewAccessCode(res.data.accessCode);
            fetchCandidates();
        } catch (err) {
            alert(err.response?.data?.msg || "Error initiating onboarding");
        }
    };

    // DELETE HANDLER
    const handleDelete = async (id, name) => {
        if(!window.confirm(`Are you sure you want to delete the onboarding record for ${name}? This cannot be undone.`)) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`https://hrms-backend-8254.onrender.com/api/onboarding/${id}`, {
                headers: { Authorization: token }
            });
            setCandidates(candidates.filter(c => c._id !== id));
        } catch (err) {
            alert("Error deleting record");
        }
    };

    // REQUEST CHANGES HANDLER (Rejection Loop)
    const handleRequestChanges = async () => {
        if(!window.confirm("Send back to candidate for changes? They will be able to log in again to update info.")) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(`https://hrms-backend-8254.onrender.com/api/onboarding/request-changes/${selectedCandidate._id}`, {}, {
                headers: { Authorization: token }
            });
            alert("Status updated! The candidate can now re-submit their information.");
            setOpenReview(false);
            fetchCandidates();
        } catch (err) {
            alert("Error updating status");
        }
    };

    const handleOpenReview = (candidate) => {
        setSelectedCandidate(candidate);
        const suggestedEmail = `${candidate.firstName.trim().toLowerCase()}.${candidate.lastName.trim().toLowerCase()}@company.com`;
        setWorkEmail(suggestedEmail);
        setOpenReview(true);
    };

    const handleChecklistToggle = async (taskName, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`https://hrms-backend-8254.onrender.com/api/onboarding/update-checklist/${selectedCandidate._id}`, 
                { task: taskName, status: !currentStatus },
                { headers: { Authorization: token } }
            );
            setSelectedCandidate(res.data);
            fetchCandidates(); 
        } catch (err) {
            console.error("Checklist update failed");
        }
    };

    const handleApprove = async () => {
        if(!window.confirm(`Confirm Hiring ${selectedCandidate.firstName}? Login Email: ${workEmail}`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`https://hrms-backend-8254.onrender.com/api/onboarding/approve/${selectedCandidate._id}`, 
                { workEmail }, 
                { headers: { Authorization: token } }
            );
            alert("Candidate Hired Successfully!");
            setOpenReview(false);
            fetchCandidates();
        } catch (err) {
            alert(err.response?.data?.msg || "Error approving candidate");
        }
    };

    const handleCloseInitiate = () => {
        setOpenInitiate(false);
        setNewAccessCode(null);
        setFormData({ firstName: '', lastName: '', email: '', department: '', designation: '', reportsTo: '', joiningDate: '', offerSalary: '' });
    };

    const renderDocLink = (path, label) => {
        if (!path) return <Typography variant="caption" color="textSecondary">Not Uploaded</Typography>;
        const url = `https://hrms-backend-8254.onrender.com/${path.replace(/\\/g, "/")}`;
        return (
            <Button variant="outlined" size="small" startIcon={<DescriptionIcon />} href={url} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none' }}>
                View {label}
            </Button>
        );
    };

    if (!canAccess) return <Alert severity="error">Access Denied: HR Only</Alert>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Onboarding Pipeline</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenInitiate(true)}>
                    New Hire
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><b>Candidate</b></TableCell>
                            <TableCell><b>Role</b></TableCell>
                            <TableCell><b>Internal Progress</b></TableCell>
                            <TableCell><b>Status</b></TableCell>
                            <TableCell align="right"><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {candidates.map((c) => {
                            const progress = calculateProgress(c);
                            return (
                                <TableRow key={c._id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="bold">{c.firstName} {c.lastName}</Typography>
                                        <Typography variant="caption">{c.email}</Typography>
                                        <Box sx={{ mt: 0.5 }}><Chip label={c.accessCode} size="small" variant="outlined" icon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(c.accessCode)} /></Box>
                                    </TableCell>
                                    <TableCell>
                                        {c.designation} <br/>
                                        <Chip label={c.department} size="small" />
                                    </TableCell>
                                    <TableCell sx={{ width: 200 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: '100%', mr: 1 }}>
                                                <LinearProgress variant="determinate" value={progress} color={progress === 100 ? "success" : "primary"} />
                                            </Box>
                                            <Box sx={{ minWidth: 35 }}>
                                                <Typography variant="body2" color="textSecondary">{`${Math.round(progress)}%`}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={c.status} 
                                            color={c.status === 'Completed' ? 'success' : c.status === 'Reviewing' ? 'warning' : 'default'} 
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => handleOpenReview(c)}>
                                                Manage
                                            </Button>
                                            <Tooltip title="Delete Record">
                                                <IconButton color="error" size="small" onClick={() => handleDelete(c._id, c.firstName)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- INITIATE DIALOG --- */}
            <Dialog open={openInitiate} onClose={handleCloseInitiate} maxWidth="md" fullWidth>
                <DialogTitle>Initiate New Onboarding</DialogTitle>
                <DialogContent>
                    {newAccessCode ? (
                        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9', border: '1px solid #4caf50', borderRadius: 2 }}>
                            <Typography variant="h6" color="success.main">Success!</Typography>
                            <Typography>Share this Access Code with the candidate:</Typography>
                            <Typography variant="h3" sx={{ my: 2, fontWeight: 'bold', letterSpacing: 5 }}>{newAccessCode}</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6}><TextField fullWidth label="First Name" onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Last Name" onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></Grid>
                            <Grid item xs={12}><TextField fullWidth label="Personal Email" type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Department" onChange={(e) => setFormData({...formData, department: e.target.value})} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Designation" onChange={(e) => setFormData({...formData, designation: e.target.value})} /></Grid>
                            <Grid item xs={6}>
                                <TextField select fullWidth label="Reports To" value={formData.reportsTo} onChange={(e) => setFormData({...formData, reportsTo: e.target.value})}>
                                    {employees.map(e => <MenuItem key={e._id} value={e._id}>{e.firstName} {e.lastName}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={6}><TextField fullWidth type="number" label="Offer Salary" onChange={(e) => setFormData({...formData, offerSalary: e.target.value})} /></Grid>
                            <Grid item xs={12}><TextField fullWidth type="date" label="Joining Date" InputLabelProps={{shrink: true}} onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} /></Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseInitiate}>Close</Button>
                    {!newAccessCode && <Button variant="contained" onClick={handleInitiate}>Create & Generate Code</Button>}
                </DialogActions>
            </Dialog>

            {/* --- REVIEW & APPROVE DIALOG --- */}
            <Dialog open={openReview} onClose={() => setOpenReview(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Onboarding: {selectedCandidate?.firstName} {selectedCandidate?.lastName}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedCandidate && (
                        <Grid container spacing={3}>
                            
                            {/* WORK EMAIL ASSIGNMENT */}
                            {selectedCandidate.status !== 'Completed' && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd', border: '1px solid #90caf9', mb: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <EmailIcon /> IT Provisioning: Assign Work Email
                                        </Typography>
                                        <TextField 
                                            fullWidth 
                                            label="Company Login Email" 
                                            value={workEmail}
                                            onChange={(e) => setWorkEmail(e.target.value)}
                                            helperText="This will be the employee's login credential."
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">@company.com</InputAdornment>, 
                                            }}
                                        />
                                    </Paper>
                                </Grid>
                            )}

                            {/* LEFT COLUMN: CANDIDATE INFO */}
                            <Grid item xs={12} md={7}>
                                <Typography variant="h6" color="primary" gutterBottom>1. Candidate Submission</Typography>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}><Typography variant="caption">Mobile</Typography><Typography>{selectedCandidate.mobile || '-'}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="caption">Address</Typography><Typography>{selectedCandidate.address || '-'}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="caption">Bank Name</Typography><Typography>{selectedCandidate.bankDetails?.bankName || '-'}</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="caption">Account No</Typography><Typography>{selectedCandidate.bankDetails?.accountNumber || '-'}</Typography></Grid>
                                </Grid>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>Documents</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {renderDocLink(selectedCandidate.documents?.passport, "Passport")}
                                    {renderDocLink(selectedCandidate.documents?.resume, "Resume")}
                                </Box>
                            </Grid>

                            {/* RIGHT COLUMN: HR CHECKLIST */}
                            <Grid item xs={12} md={5} sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2 }}>
                                <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AssignmentTurnedInIcon /> 2. HR Checklist
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <FormControlLabel control={<Checkbox checked={selectedCandidate.checklist?.contractSigned} onChange={() => handleChecklistToggle('contractSigned', selectedCandidate.checklist?.contractSigned)} />} label="HR Contract Signed" />
                                    <FormControlLabel control={<Checkbox checked={selectedCandidate.checklist?.itSetup} onChange={() => handleChecklistToggle('itSetup', selectedCandidate.checklist?.itSetup)} />} label="IT Setup" />
                                    <FormControlLabel control={<Checkbox checked={selectedCandidate.checklist?.accessCard} onChange={() => handleChecklistToggle('accessCard', selectedCandidate.checklist?.accessCard)} />} label="Access Card Issued" />
                                    <FormControlLabel control={<Checkbox checked={selectedCandidate.checklist?.orientationScheduled} onChange={() => handleChecklistToggle('orientationScheduled', selectedCandidate.checklist?.orientationScheduled)} />} label="Orientation Scheduled" />
                                    <FormControlLabel control={<Checkbox checked={selectedCandidate.checklist?.welcomeKit} onChange={() => handleChecklistToggle('welcomeKit', selectedCandidate.checklist?.welcomeKit)} />} label="Welcome Kit Prepared" />
                                </Box>
                                
                                <Box sx={{ mt: 2 }}>
                                    <LinearProgress variant="determinate" value={calculateProgress(selectedCandidate)} sx={{ height: 10, borderRadius: 5 }} />
                                    <Typography align="right" variant="caption">{Math.round(calculateProgress(selectedCandidate))}% Ready</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReview(false)}>Close</Button>
                    
                    {/* REQUEST CHANGES (REJECTION) */}
                    {selectedCandidate?.status === 'Reviewing' && (
                        <Button variant="outlined" color="warning" onClick={handleRequestChanges}>
                            Request Changes
                        </Button>
                    )}

                    {/* APPROVE & HIRE */}
                    {selectedCandidate?.status !== 'Completed' && (
                        <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={handleApprove}>
                            Finalize & Hire
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}