import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Paper, Typography, TextField, MenuItem, Button, Box, Rating, Grid, Alert,
  Card, CardContent, Chip, Divider
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import StarIcon from '@mui/icons-material/Star';

export default function Performance({ role }) {
  const [employees, setEmployees] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  
  // FORM DATA
  const [formData, setFormData] = useState({
    employeeId: '',
    rating: 5,
    feedback: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAdminOrSenior = role === 'Admin' || role === 'Senior Admin';

  useEffect(() => {
    if (isAdminOrSenior) {
      fetchEmployees();
    } else {
      fetchMyReviews();
    }
  }, [role]);

  // --- API CALLS ---
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://hrms-backend-8254.onrender.com/api/employees', { 
        headers: { Authorization: token } 
      });
      setEmployees(res.data);
    } catch (err) { console.error("Error fetching employees", err); }
  };

  const fetchMyReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://hrms-backend-8254.onrender.com/api/performance/my-reviews', { 
        headers: { Authorization: token } 
      });
      setMyReviews(res.data);
    } catch (err) { console.error("Error fetching reviews", err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');

    // 1. GET TOKEN
    const token = localStorage.getItem('token');
    if(!token) {
        setError("You are not logged in.");
        return;
    }

    try {
      // 2. SEND REQUEST WITH TOKEN
      await axios.post('https://hrms-backend-8254.onrender.com/api/performance', formData, {
        headers: { Authorization: token } // <--- CRITICAL FIX
      });

      setMessage('Review Submitted Successfully!');
      setFormData({ employeeId: '', rating: 5, feedback: '' });
      
    } catch (err) {
      console.error(err);
      setError('Failed to submit review. Please try again.');
    }
  };

  // --- ADMIN VIEW ---
  if (isAdminOrSenior) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RateReviewIcon color="primary" /> Performance Management
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
             Issue Performance Review
          </Typography>
          
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* SELECT EMPLOYEE */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Select Employee"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  required
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.department})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* RATING */}
              <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography component="legend" sx={{ mr: 2 }}>Rating:</Typography>
                <Rating
                  name="rating"
                  value={Number(formData.rating)}
                  onChange={(event, newValue) => {
                    setFormData({...formData, rating: newValue});
                  }}
                  size="large"
                />
              </Grid>

              {/* FEEDBACK */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Manager Feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" type="submit" size="large">
                  Submit Review
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    );
  }

  // --- EMPLOYEE VIEW ---
  return (
    <Box>
       <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="warning" /> My Performance Reviews
       </Typography>
       <Divider sx={{ mb: 3 }} />

       {myReviews.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9', border: '1px dashed #ccc' }}>
            <Typography color="textSecondary">No reviews available yet.</Typography>
          </Paper>
       ) : (
         <Grid container spacing={2}>
           {myReviews.map((review) => (
             <Grid item xs={12} key={review._id}>
               <Card elevation={3} sx={{ borderRadius: 2 }}>
                 <CardContent>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Rating value={review.rating} readOnly />
                      <Chip label={new Date(review.reviewDate).toLocaleDateString()} size="small" variant="outlined" />
                   </Box>
                   <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#555', mt: 2 }}>
                     "{review.feedback}"
                   </Typography>
                 </CardContent>
               </Card>
             </Grid>
           ))}
         </Grid>
       )}
    </Box>
  );
}