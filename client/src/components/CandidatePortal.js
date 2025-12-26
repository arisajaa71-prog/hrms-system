import React, { useState } from 'react';
import axios from 'axios';
import {
    Container, Paper, Typography, TextField, Button, Box,
    Grid, Alert, Divider, MenuItem, InputLabel
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function CandidatePortal({ onBack }) {
    // Stage 1: Enter Code, Stage 2: Fill Form, Stage 3: Success
    const [stage, setStage] = useState(1);
    const [accessCode, setAccessCode] = useState('');
    const [candidateData, setCandidateData] = useState(null);
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        mobile: '', dob: '', gender: 'Male', address: '',
        emergencyName: '', emergencyRelation: '', emergencyPhone: '',
        bankName: '', accountNumber: '', iban: '', swiftCode: ''
    });

    // File State
    const [files, setFiles] = useState({
        passport: null, nationalId: null, resume: null, contract: null
    });

    // --- STEP 1: VERIFY CODE ---
    const handleVerify = async () => {
        try {
            setError('');
            const res = await axios.post('http://localhost:5001/api/onboarding/verify', { accessCode });
            setCandidateData(res.data);
            setStage(2);
        } catch (err) {
            setError(err.response?.data?.msg || "Invalid Access Code");
        }
    };

    // --- STEP 2: SUBMIT DATA ---
    const handleSubmit = async () => {
        try {
            const data = new FormData();
            
            // Append Text Data
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            
            // Append Files
            if (files.passport) data.append('passport', files.passport);
            if (files.nationalId) data.append('nationalId', files.nationalId);
            if (files.resume) data.append('resume', files.resume);
            if (files.contract) data.append('contract', files.contract);

            await axios.put(`http://localhost:5001/api/onboarding/candidate-submit/${candidateData._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStage(3);
        } catch (err) {
            alert("Error submitting data. Please try again.");
        }
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    // --- RENDER STAGE 1: LOGIN ---
    if (stage === 1) {
        return (
            <Container maxWidth="sm" sx={{ mt: 10 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>👋 Welcome, New Hire!</Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>Please enter the Access Code provided by HR.</Typography>
                    
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    <TextField 
                        fullWidth label="Access Code" variant="outlined" 
                        value={accessCode} onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        sx={{ mb: 3, input: { textAlign: 'center', letterSpacing: 5, fontSize: '1.5rem', textTransform: 'uppercase' } }}
                    />
                    
                    <Button variant="contained" size="large" fullWidth onClick={handleVerify}>Start Onboarding</Button>
                    <Button color="inherit" sx={{ mt: 2 }} onClick={onBack}>Back to Employee Login</Button>
                </Paper>
            </Container>
        );
    }

    // --- RENDER STAGE 3: SUCCESS ---
    if (stage === 3) {
        return (
            <Container maxWidth="sm" sx={{ mt: 10 }}>
                <Paper elevation={3} sx={{ p: 5, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                    <Typography variant="h4" sx={{ mb: 2 }}>🎉 All Done!</Typography>
                    <Typography variant="body1">Thank you, <b>{candidateData.firstName}</b>.</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Your information has been submitted securely. <br/>
                        HR will review your details and contact you shortly.
                    </Typography>
                    <Button variant="outlined" sx={{ mt: 4 }} onClick={onBack}>Return to Home</Button>
                </Paper>
            </Container>
        );
    }

    // --- RENDER STAGE 2: FORM ---
    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
                    Welcome, {candidateData.firstName}!
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                    Please complete your profile so we can get you ready for your first day on <b>{new Date(candidateData.joiningDate).toLocaleDateString()}</b>.
                </Typography>
                
                <Divider sx={{ my: 3 }}><Typography color="textSecondary">PERSONAL DETAILS</Typography></Divider>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Mobile Number" value={formData.mobile} onChange={(e)=>setFormData({...formData, mobile: e.target.value})} /></Grid>
                    <Grid item xs={6} md={3}><TextField fullWidth type="date" label="Date of Birth" InputLabelProps={{shrink: true}} value={formData.dob} onChange={(e)=>setFormData({...formData, dob: e.target.value})} /></Grid>
                    <Grid item xs={6} md={3}>
                        <TextField select fullWidth label="Gender" value={formData.gender} onChange={(e)=>setFormData({...formData, gender: e.target.value})}>
                            <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12}><TextField fullWidth label="Home Address" value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} /></Grid>
                </Grid>

                <Divider sx={{ my: 3 }}><Typography color="textSecondary">EMERGENCY CONTACT</Typography></Divider>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}><TextField fullWidth label="Contact Name" value={formData.emergencyName} onChange={(e)=>setFormData({...formData, emergencyName: e.target.value})} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth label="Relation" value={formData.emergencyRelation} onChange={(e)=>setFormData({...formData, emergencyRelation: e.target.value})} /></Grid>
                    <Grid item xs={12} md={4}><TextField fullWidth label="Phone" value={formData.emergencyPhone} onChange={(e)=>setFormData({...formData, emergencyPhone: e.target.value})} /></Grid>
                </Grid>

                <Divider sx={{ my: 3 }}><Typography color="textSecondary">BANK INFORMATION (For Payroll)</Typography></Divider>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Bank Name" value={formData.bankName} onChange={(e)=>setFormData({...formData, bankName: e.target.value})} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Account Number" value={formData.accountNumber} onChange={(e)=>setFormData({...formData, accountNumber: e.target.value})} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="IBAN" value={formData.iban} onChange={(e)=>setFormData({...formData, iban: e.target.value})} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="SWIFT Code" value={formData.swiftCode} onChange={(e)=>setFormData({...formData, swiftCode: e.target.value})} /></Grid>
                </Grid>

                <Divider sx={{ my: 3 }}><Typography color="textSecondary">DOCUMENT UPLOADS</Typography></Divider>
                <Grid container spacing={2}>
                    <Grid item xs={6}><Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>Upload Passport <input type="file" hidden name="passport" onChange={handleFileChange}/></Button>{files.passport && <Typography variant="caption">{files.passport.name}</Typography>}</Grid>
                    <Grid item xs={6}><Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>Upload National ID <input type="file" hidden name="nationalId" onChange={handleFileChange}/></Button>{files.nationalId && <Typography variant="caption">{files.nationalId.name}</Typography>}</Grid>
                    <Grid item xs={6}><Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>Upload Resume <input type="file" hidden name="resume" onChange={handleFileChange}/></Button>{files.resume && <Typography variant="caption">{files.resume.name}</Typography>}</Grid>
                    <Grid item xs={6}><Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>Signed Contract <input type="file" hidden name="contract" onChange={handleFileChange}/></Button>{files.contract && <Typography variant="caption">{files.contract.name}</Typography>}</Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => setStage(1)}>Cancel</Button>
                    <Button variant="contained" size="large" onClick={handleSubmit}>Submit My Information</Button>
                </Box>
            </Paper>
        </Container>
    );
}