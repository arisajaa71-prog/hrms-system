import React, { useState, useEffect } from 'react';
import { Paper, Typography, Button, Box, Alert, CircularProgress, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BeachAccessIcon from '@mui/icons-material/BeachAccess'; 
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'; 
import WeekendIcon from '@mui/icons-material/Weekend'; 
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'; // <--- NEW ICON

export default function AttendanceWidget() {
  const [status, setStatus] = useState('Loading'); 
  const [leaveType, setLeaveType] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [clockInTime, setClockInTime] = useState(null);

  // --- NEW: CHECK OWNER ROLE ---
  const role = localStorage.getItem('role');
  const isOwner = role === 'Owner';

  // 1. Check Status on Load
  useEffect(() => {
    // If Owner, skip fetching status and go straight to Owner Mode
    if (isOwner) {
        setStatus('OwnerMode');
        return;
    }
    fetchStatus();
  }, [isOwner]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/attendance/status', {
        headers: { Authorization: token } 
      });
      const data = await res.json();
      
      if (data.status) {
          setStatus(data.status);
          if (data.leaveType) setLeaveType(data.leaveType);
      }
      if (data.clockInTime) setClockInTime(new Date(data.clockInTime));
      
    } catch (err) {
      console.error(err);
      setStatus('Absent'); 
    }
  };

  // 2. Handle Clock In
  const handleClockIn = () => {
    setLoading(true);
    setError('');
    setMessage('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5001/api/attendance/clock-in', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: token 
            },
            body: JSON.stringify({ latitude, longitude })
          });

          const data = await res.json();

          if (res.ok) {
            setStatus(data.attendance.status);
            setClockInTime(new Date());
            setMessage(data.message);
          } else {
            setError(data.message); 
          }
        } catch (err) {
          setError('Server Error');
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        console.error(geoError);
        setError('Location permission denied. Please allow location access.');
        setLoading(false);
      }
    );
  };

  // 3. Handle Clock Out
  const handleClockOut = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/attendance/clock-out', {
        method: 'PUT',
        headers: { Authorization: token }
      });
      
      if (res.ok) {
        setStatus('Completed');
        setMessage('Have a good evening! Clocked out successfully.');
      }
    } catch (err) {
      setError('Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  // UI Helper: Get Color for Badge
  const getStatusColor = () => {
    if (status === 'Present') return 'success';
    if (status === 'Late') return 'warning';
    if (status === 'On Leave') return 'info';
    if (status === 'Completed') return 'secondary';
    return 'default';
  };

  // --- RENDER LOGIC ---
  
  // 1. LOADING STATE
  if (status === 'Loading') {
      return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={30} />
        </Paper>
      );
  }

  // --- NEW: OWNER VIEW (Exempt from Attendance) ---
  if (status === 'OwnerMode') {
      return (
        <Paper 
            elevation={3} 
            sx={{ 
                p: 3, 
                borderRadius: 3, 
                textAlign: 'center', 
                height: '100%', 
                background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)', // Premium Gradient
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid #bbdefb'
            }}
        >
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#bbdefb', borderRadius: '50%' }}>
                <VerifiedUserIcon sx={{ fontSize: 40, color: '#1565c0' }} />
            </Box>
            <Typography variant="h6" fontWeight="bold" color="primary">
                Owner Status
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Attendance tracking is automated.
            </Typography>
            <Chip 
                label="Always Active" 
                color="success" 
                size="small" 
                variant="filled" 
                sx={{ fontWeight: 'bold', px: 1 }} 
            />
        </Paper>
      );
  }

  // 2. ON LEAVE
  if (status === 'On Leave') {
      const isSick = leaveType.toLowerCase().includes('sick');
      return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center', height: '100%', bgcolor: isSick ? '#fff3e0' : '#e3f2fd' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: isSick ? '#e65100' : '#1565c0' }}>
                {isSick ? 'Get Well Soon!' : 'Enjoy Your Time Off!'}
            </Typography>
            
            <Box sx={{ my: 3 }}>
                {isSick ? <LocalHospitalIcon sx={{ fontSize: 60, color: '#ff9800' }} /> : <BeachAccessIcon sx={{ fontSize: 60, color: '#2196f3' }} />}
            </Box>

            <Chip label={`On ${leaveType}`} color={isSick ? "warning" : "primary"} variant="filled" />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                No clock-in required today.
            </Typography>
        </Paper>
      );
  }

  // 3. WEEKEND CHECK
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6; 
  
  if (status === 'Absent' && isWeekend) {
      return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center', height: '100%', bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="textSecondary">Happy Weekend!</Typography>
            <Box sx={{ my: 3 }}><WeekendIcon sx={{ fontSize: 60, color: '#9e9e9e' }} /></Box>
            <Typography variant="body2" color="textSecondary">Enjoy your days off. See you on Monday!</Typography>
            <Button size="small" sx={{ mt: 2 }} onClick={() => setStatus('ForceWork')}>I'm actually working (Clock In)</Button>
        </Paper>
      );
  }

  // 4. STANDARD CLOCK IN / OUT
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, textAlign: 'center', height: '100%' }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">Attendance</Typography>

      <Box sx={{ mb: 2 }}>
        <Chip 
          label={status.toUpperCase()} 
          color={getStatusColor()} 
          variant={status === 'Absent' ? 'outlined' : 'filled'}
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {clockInTime && status !== 'Absent' && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Clocked In at: {clockInTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Typography>
      )}

      {(status === 'Absent' || status === 'ForceWork') && (
        <Button 
          variant="contained" color="primary" size="large" fullWidth
          startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <LocationOnIcon />}
          onClick={handleClockIn}
          disabled={loading}
          sx={{ borderRadius: 2, py: 1.5 }}
        >
          {loading ? 'Locating...' : 'Clock In'}
        </Button>
      )}

      {(status === 'Present' || status === 'Late') && (
        <Button 
          variant="contained" color="error" size="large" fullWidth
          startIcon={<StopIcon />}
          onClick={handleClockOut}
          disabled={loading}
          sx={{ borderRadius: 2, py: 1.5 }}
        >
          Clock Out
        </Button>
      )}

      {status === 'Completed' && <Alert severity="success" sx={{ mt: 1 }}>You have completed your shift.</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2, fontSize: '0.85rem' }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mt: 2, fontSize: '0.85rem' }}>{message}</Alert>}
    </Paper>
  );
}