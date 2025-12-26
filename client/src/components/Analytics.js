import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Grid, Paper, Typography, Box, CircularProgress, Button } from '@mui/material'; // Added Button
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Receive onNavigate from App.js
export default function Analytics({ onNavigate }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    departmentData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [empRes, leaveRes] = await Promise.all([
        axios.get('http://localhost:5001/api/employees', { headers: { Authorization: token } }),
        axios.get('http://localhost:5001/api/leaves', { headers: { Authorization: token } })
      ]);

      const employees = empRes.data;
      const leaves = leaveRes.data;
      const pendingCount = leaves.filter(l => l.status === 'Pending').length;

      const deptMap = {};
      employees.forEach(emp => {
        const dept = emp.department || 'Unassigned';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });

      const pieData = Object.keys(deptMap).map(dept => ({ name: dept, value: deptMap[dept] }));

      setStats({ totalEmployees: employees.length, pendingLeaves: pendingCount, departmentData: pieData });
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;

  return (
    <Grid container spacing={3}>
      {/* TOTAL EMPLOYEES */}
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>TOTAL EMPLOYEES</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{stats.totalEmployees}</Typography>
          </Box>
          <PeopleIcon sx={{ fontSize: 60, color: '#1565c0', opacity: 0.1 }} />
        </Paper>
      </Grid>

      {/* PENDING LEAVES (CLICKABLE) */}
      <Grid item xs={12} md={6}>
        <Paper 
            elevation={0} 
            sx={{ 
                p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                border: '1px solid #e0e0e0', borderRadius: 2,
                cursor: 'pointer', // Show hand cursor
                transition: '0.2s',
                '&:hover': { bgcolor: '#fffde7', borderColor: '#ffb74d' }
            }}
            onClick={() => onNavigate('leaves')} // <--- CLICK TO GO TO LEAVE PAGE
        >
          <Box>
            <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>PENDING LEAVES</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: stats.pendingLeaves > 0 ? '#d32f2f' : '#2e7d32' }}>
              {stats.pendingLeaves}
            </Typography>
            {stats.pendingLeaves > 0 && (
                <Typography variant="caption" sx={{ color: '#d32f2f', display: 'flex', alignItems: 'center', mt: 1 }}>
                    Review Now <ArrowForwardIcon fontSize="inherit" sx={{ ml: 0.5 }} />
                </Typography>
            )}
          </Box>
          <PendingActionsIcon sx={{ fontSize: 60, color: stats.pendingLeaves > 0 ? '#d32f2f' : '#2e7d32', opacity: 0.1 }} />
        </Paper>
      </Grid>

      {/* CHART */}
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 3, minHeight: 350, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Department Distribution</Typography>
          <Box sx={{ width: '100%', height: 300 }}>
            {stats.departmentData.length > 0 ? (
                <ResponsiveContainer>
                <PieChart>
                    <Pie data={stats.departmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value">
                    {stats.departmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <Typography color="textSecondary" align="center" sx={{ mt: 10 }}>No data available</Typography>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}