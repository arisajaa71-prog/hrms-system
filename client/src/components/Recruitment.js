import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Paper, Typography, Button, Grid, TextField, Chip, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, 
    Divider, IconButton
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Recruitment() {
    // View State: 'list' (Jobs) or 'board' (Kanban)
    const [view, setView] = useState('list'); 
    
    const [jobs, setJobs] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [managers, setManagers] = useState([]);

    // Dialogs
    const [openNewJob, setOpenNewJob] = useState(false);
    const [openAddCandidate, setOpenAddCandidate] = useState(false);
    const [openHireModal, setOpenHireModal] = useState(false);

    // Forms
    const [jobForm, setJobForm] = useState({ title: '', department: '', description: '' });
    const [candidateForm, setCandidateForm] = useState({ firstName: '', lastName: '', email: '', phone: '', resume: null });
    
    // Hire Form (The Bridge Data)
    const [hireData, setHireData] = useState({ offerSalary: '', joiningDate: '', reportsTo: '' });
    const [candidateToHire, setCandidateToHire] = useState(null);

    useEffect(() => {
        fetchJobs();
        fetchManagers();
    }, []);

    const fetchJobs = async () => {
        const res = await axios.get('https://hrms-backend-8254.onrender.com/api/recruitment/jobs', { headers: { Authorization: localStorage.getItem('token') } });
        setJobs(res.data);
    };

    const fetchManagers = async () => {
        const res = await axios.get('https://hrms-backend-8254.onrender.com/api/employees', { headers: { Authorization: localStorage.getItem('token') } });
        setManagers(res.data);
    };

    const fetchApplicants = async (jobId) => {
        const res = await axios.get(`https://hrms-backend-8254.onrender.com/api/recruitment/applicants/${jobId}`, { headers: { Authorization: localStorage.getItem('token') } });
        setApplicants(res.data);
    };

    // --- JOB LOGIC ---
    const handleCreateJob = async () => {
        await axios.post('https://hrms-backend-8254.onrender.com/api/recruitment/jobs', jobForm, { headers: { Authorization: localStorage.getItem('token') } });
        setOpenNewJob(false);
        fetchJobs();
    };

    const openBoard = (job) => {
        setSelectedJob(job);
        fetchApplicants(job._id);
        setView('board');
    };

    // --- CANDIDATE LOGIC ---
    const handleAddCandidate = async () => {
        const formData = new FormData();
        formData.append('jobId', selectedJob._id);
        formData.append('firstName', candidateForm.firstName);
        formData.append('lastName', candidateForm.lastName);
        formData.append('email', candidateForm.email);
        formData.append('phone', candidateForm.phone);
        if (candidateForm.resume) formData.append('resume', candidateForm.resume);

        await axios.post('https://hrms-backend-8254.onrender.com/api/recruitment/applicants', formData, { 
            headers: { Authorization: localStorage.getItem('token'), 'Content-Type': 'multipart/form-data' } 
        });
        setOpenAddCandidate(false);
        fetchApplicants(selectedJob._id);
    };

    const updateStage = async (id, newStage) => {
        await axios.put(`https://hrms-backend-8254.onrender.com/api/recruitment/applicants/stage/${id}`, { stage: newStage }, { headers: { Authorization: localStorage.getItem('token') } });
        fetchApplicants(selectedJob._id);
    };

    // --- THE HIRE BRIDGE ---
    const initiateHire = (candidate) => {
        setCandidateToHire(candidate);
        setOpenHireModal(true);
    };

    const confirmHire = async () => {
        try {
            await axios.post(`https://hrms-backend-8254.onrender.com/api/recruitment/hire/${candidateToHire._id}`, hireData, { 
                headers: { Authorization: localStorage.getItem('token') } 
            });
            alert("Candidate moved to Onboarding Pipeline!");
            setOpenHireModal(false);
            fetchApplicants(selectedJob._id); // Refresh to see them move to 'Hired'
        } catch (err) {
            alert(err.response?.data?.msg || "Error hiring");
        }
    };

    // --- RENDER HELPERS ---
    const renderColumn = (title, stage) => {
        const columnApps = applicants.filter(a => a.stage === stage);
        return (
            <Paper sx={{ width: 280, minHeight: 400, p: 2, bgcolor: '#f5f5f5', mr: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>{title} ({columnApps.length})</Typography>
                {columnApps.map(app => (
                    <Card key={app._id} sx={{ mb: 1 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="subtitle2" fontWeight="bold">{app.firstName} {app.lastName}</Typography>
                            <Typography variant="caption" display="block">{app.email}</Typography>
                            
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                {stage === 'New' && <Button size="small" onClick={() => updateStage(app._id, 'Interview')}>Interview</Button>}
                                {stage === 'Interview' && <Button size="small" onClick={() => updateStage(app._id, 'Offer')}>Offer</Button>}
                                {stage === 'Offer' && (
                                    <Button size="small" variant="contained" color="success" onClick={() => initiateHire(app)}>HIRE</Button>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Paper>
        );
    };

    return (
        <Box>
            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Recruitment</Typography>
                {view === 'list' ? (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenNewJob(true)}>Post Job</Button>
                ) : (
                    <Button onClick={() => setView('list')}>Back to Jobs</Button>
                )}
            </Box>

            {/* VIEW: JOB LIST */}
            {view === 'list' && (
                <Grid container spacing={3}>
                    {jobs.map(job => (
                        <Grid item xs={12} md={4} key={job._id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold">{job.title}</Typography>
                                    <Chip label={job.department} size="small" sx={{ mt: 1 }} />
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                        {job.description || "No description provided."}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ p: 2, pt: 0 }}>
                                    <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => openBoard(job)}>
                                        Manage Pipeline
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* VIEW: KANBAN BOARD */}
            {view === 'board' && selectedJob && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Pipeline: <span style={{color:'#1976d2'}}>{selectedJob.title}</span></Typography>
                        <Button startIcon={<PersonAddIcon />} variant="contained" onClick={() => setOpenAddCandidate(true)}>Add Candidate</Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', overflowX: 'auto', pb: 2 }}>
                        {renderColumn("New Applicants", 'New')}
                        {renderColumn("Screening", 'Screening')}
                        {renderColumn("Interviews", 'Interview')}
                        {renderColumn("Offer Stage", 'Offer')}
                        {renderColumn("Hired", 'Hired')}
                    </Box>
                </Box>
            )}

            {/* MODAL: NEW JOB */}
            <Dialog open={openNewJob} onClose={() => setOpenNewJob(false)}>
                <DialogTitle>Post New Job</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="Job Title" sx={{ mt: 2 }} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
                    <TextField fullWidth label="Department" sx={{ mt: 2 }} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} />
                    <TextField fullWidth multiline rows={3} label="Description" sx={{ mt: 2 }} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewJob(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateJob}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: ADD CANDIDATE */}
            <Dialog open={openAddCandidate} onClose={() => setOpenAddCandidate(false)}>
                <DialogTitle>Add Candidate</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="First Name" sx={{ mt: 2 }} onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })} />
                    <TextField fullWidth label="Last Name" sx={{ mt: 2 }} onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })} />
                    <TextField fullWidth label="Email" sx={{ mt: 2 }} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} />
                    <TextField fullWidth label="Phone" sx={{ mt: 2 }} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} />
                    <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
                        Upload Resume
                        <input type="file" hidden onChange={(e) => setCandidateForm({ ...candidateForm, resume: e.target.files[0] })} />
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddCandidate(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddCandidate}>Add</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: HIRE (THE BRIDGE) */}
            <Dialog open={openHireModal} onClose={() => setOpenHireModal(false)}>
                <DialogTitle>Hire & Onboard {candidateToHire?.firstName}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        This will create a record in the <b>Onboarding Module</b>.
                    </Typography>
                    <TextField fullWidth type="number" label="Final Offer Salary" sx={{ mt: 1 }} onChange={(e) => setHireData({ ...hireData, offerSalary: e.target.value })} />
                    <TextField fullWidth type="date" label="Joining Date" InputLabelProps={{ shrink: true }} sx={{ mt: 2 }} onChange={(e) => setHireData({ ...hireData, joiningDate: e.target.value })} />
                    <TextField select fullWidth label="Reports To" sx={{ mt: 2 }} value={hireData.reportsTo} onChange={(e) => setHireData({ ...hireData, reportsTo: e.target.value })}>
                        {managers.map(m => <MenuItem key={m._id} value={m._id}>{m.firstName} {m.lastName}</MenuItem>)}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenHireModal(false)}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={confirmHire}>Confirm Hire</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}