import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box, Button, Container, TextField, Typography, Paper, Link, 
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Grid,
  InputAdornment, IconButton, Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// 1. ADD 'onOnboardClick' TO PROPS
export default function Login({ setToken, setRole, onOnboardClick }) { 
  // --- STATE ---
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [openForgot, setOpenForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password; 

    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { 
        email: cleanEmail, 
        password: cleanPassword 
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('name', res.data.user.name);

      if (setToken) setToken(res.data.token);
      if (setRole) setRole(res.data.user.role);

      // Reload to ensure all states (like Sidebar) update correctly
      window.location.reload();

    } catch (err) {
      console.error("Login Failed:", err.response);
      const serverMsg = err.response?.data?.msg || 'Connection Error';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
      try {
          const res = await axios.post('http://localhost:5001/api/requests/create', { email: forgotEmail });
          setForgotMsg(res.data.msg); 
          setIsSuccess(true);
      } catch (err) {
          setForgotMsg(err.response?.data?.msg || "Error submitting request");
          setIsSuccess(false);
      }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', borderRadius: 3 }}>
        
        <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: '50%', mb: 2 }}>
            <LockOutlinedIcon sx={{ color: 'white', fontSize: 30 }} />
        </Box>
        
        <Typography component="h1" variant="h5" fontWeight="bold">
          Sign in to HRMS
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal" required fullWidth
            label="Email Address" name="email" autoFocus
            value={formData.email} onChange={handleChange}
            helperText="Ensure no spaces at the end"
          />
          
          <TextField
            margin="normal" required fullWidth
            name="password" label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password} onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
          >
            {loading ? 'Checking...' : 'Sign In'}
          </Button>

          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component="button" variant="body2" onClick={() => setOpenForgot(true)}>
                Forgot password?
              </Link>
            </Grid>
          </Grid>

          {/* --- 2. NEW HIRE SECTION (ADDED) --- */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                    New Employee?
                </Typography>
                <Link 
                    component="button" 
                    variant="body2" 
                    sx={{ fontWeight: 'bold', mt: 0.5 }} 
                    onClick={(e) => {
                        e.preventDefault(); 
                        if (onOnboardClick) onOnboardClick(); // Trigger App.js toggle
                    }}
                    type="button"
                >
                    Click here to Onboard
                </Link>
            </Box>

        </Box>
      </Paper>

      {/* --- FORGOT PASSWORD MODAL --- */}
      <Dialog open={openForgot} onClose={() => setOpenForgot(false)}>
          <DialogTitle>Reset Password Request</DialogTitle>
          <DialogContent sx={{ minWidth: 300 }}>
              {!isSuccess ? (
                  <>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Please enter your email. A request will be sent to the System Administrator.
                    </Typography>
                    {forgotMsg && <Alert severity="error" sx={{ mb: 2 }}>{forgotMsg}</Alert>}
                    <TextField autoFocus margin="dense" label="Email Address" fullWidth variant="outlined" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                  </>
              ) : (
                  <Alert severity="success">
                      {forgotMsg} <br/>
                      <strong>Please contact your Manager/HR to complete the process.</strong>
                  </Alert>
              )}
          </DialogContent>
          <DialogActions>
              <Button onClick={() => { setOpenForgot(false); setIsSuccess(false); setForgotMsg(''); }}>Close</Button>
              {!isSuccess && <Button onClick={handleForgotSubmit} variant="contained">Submit Request</Button>}
          </DialogActions>
      </Dialog>
    </Container>
  );
}