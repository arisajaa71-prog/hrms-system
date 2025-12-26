import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, TextField, MenuItem, Button, Typography, Alert, Paper, Chip, Stack 
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // <--- NEW ICON

export default function LeaveForm() {
  const [formData, setFormData] = useState({
    leaveType: 'Sick', 
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [file, setFile] = useState(null); // <--- NEW STATE FOR FILE
  const [msg, setMsg] = useState({ type: '', content: '' });
  const [balance, setBalance] = useState(null); 

  // 1. Fetch Balance on Component Mount
  useEffect(() => {
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const myId = JSON.parse(atob(token.split('.')[1])).user.id;
        const res = await axios.get('http://localhost:5001/api/employees', { headers: { Authorization: token } });
        
        const me = res.data.find(e => e._id === myId);
        if(me) setBalance(me.leaveBalance);
    } catch (err) { 
        console.error("Error fetching balance", err); 
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- NEW HANDLER FOR FILE SELECTION ---
  const handleFileChange = (e) => {
      setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', content: '' });
    
    try {
      const token = localStorage.getItem('token');
      
      // --- CRITICAL CHANGE: USE FORMDATA INSTEAD OF JSON ---
      const data = new FormData();
      data.append('leaveType', formData.leaveType);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('reason', formData.reason);
      
      // Only append file if one is selected
      if (file) {
          data.append('attachment', file); 
      }

      // 2. Submit the Request (with Multipart Header)
      await axios.post('http://localhost:5001/api/leaves', data, {
        headers: { 
            Authorization: token,
            'Content-Type': 'multipart/form-data' // <--- REQUIRED FOR FILES
        }
      });

      setMsg({ type: 'success', content: 'Leave Request Submitted Successfully' });
      
      fetchUserBalance();
      setFormData({ ...formData, reason: '', startDate: '', endDate: '' });
      setFile(null); // Reset file input

      setTimeout(() => {
          window.location.reload(); 
      }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Error submitting request.';
      setMsg({ type: 'error', content: errorMsg });
    }
  };

  const getCurrentBalance = () => {
      if (!balance) return null;
      if (formData.leaveType === 'Annual') return balance.annual;
      if (formData.leaveType === 'Lieu Day') return balance.lieu;
      if (formData.leaveType === 'Comp Off') return balance.compOff;
      if (formData.leaveType === 'Sick') return '∞'; 
      return null; 
  };

  const currentBal = getCurrentBalance();

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
         <AccountBalanceWalletIcon color="primary"/> Apply for Leave
      </Typography>

      {/* --- BALANCE DISPLAY HEADER --- */}
      {balance && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                  YOUR AVAILABLE BALANCE
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                  <Chip label={`Annual: ${balance.annual}`} size="small" color={formData.leaveType === 'Annual' ? "primary" : "default"} />
                  <Chip label={`Lieu: ${balance.lieu}`} size="small" color={formData.leaveType === 'Lieu Day' ? "warning" : "default"} />
                  <Chip label={`Comp Off: ${balance.compOff}`} size="small" color={formData.leaveType === 'Comp Off' ? "success" : "default"} />
              </Stack>
          </Box>
      )}

      {msg.content && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.content}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          select label="Leave Type" name="leaveType" value={formData.leaveType} onChange={handleChange} fullWidth margin="normal"
          helperText={currentBal !== null && currentBal !== '∞' ? `Available: ${currentBal} days` : ''}
        >
          <MenuItem value="Annual">Annual Leave</MenuItem>
          <MenuItem value="Sick">Sick Leave</MenuItem>
          <MenuItem value="Lieu Day">Lieu Day</MenuItem>
          <MenuItem value="Comp Off">Comp Off</MenuItem>
          <MenuItem value="Unpaid">Unpaid Leave</MenuItem>
        </TextField>

        {/* --- NEW FILE UPLOAD SECTION (Only shows for Sick Leave) --- */}
        {formData.leaveType === 'Sick' && (
             <Box sx={{ mt: 2, mb: 1, p: 2, border: '1px dashed #ccc', borderRadius: 2, bgcolor: '#fafafa', textAlign: 'center' }}>
                 <Typography variant="body2" color="textSecondary" gutterBottom>
                     Medical Certificate (Required)
                 </Typography>
                 <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    size="small"
                 >
                    Upload Document
                    <input type="file" hidden onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                 </Button>
                 {file && (
                     <Typography variant="caption" display="block" sx={{ mt: 1, color: 'green', fontWeight: 'bold' }}>
                         Selected: {file.name}
                     </Typography>
                 )}
             </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Start Date" type="date" name="startDate" value={formData.startDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
          <TextField label="End Date" type="date" name="endDate" value={formData.endDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
        </Box>

        <TextField label="Reason for leave..." name="reason" value={formData.reason} onChange={handleChange} fullWidth multiline rows={3} margin="normal" required />

        <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            size="large" 
            sx={{ mt: 2 }}
            disabled={
                currentBal === 0 && 
                formData.leaveType !== 'Unpaid' && 
                formData.leaveType !== 'Sick'
            }
        >
          Submit Request
        </Button>
      </form>
    </Paper>
  );
}