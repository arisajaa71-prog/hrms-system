import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, Typography, Box, CircularProgress, Alert, tableCellClasses, IconButton, Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description'; // <--- Icon for Document

// --- STYLING ---
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  '&:last-child td, &:last-child th': { border: 0 },
}));

export default function LeaveHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 1. Get My ID to filter
      const myId = JSON.parse(atob(token.split('.')[1])).user.id;

      const res = await axios.get('https://hrms-backend-8254.onrender.com/api/leaves', { 
        headers: { Authorization: token } 
      });
      
      // 2. Filter: Only show MY leaves
      const myLeaves = res.data.filter(record => {
          const recordEmpId = record.employee?._id || record.employee;
          return recordEmpId === myId;
      });

      setHistory(myLeaves);
      setLoading(false);
    } catch (err) { 
      setError("Failed to fetch leave history."); 
      setLoading(false); 
    }
  };

  // --- HELPER 1: CALCULATE DURATION ---
  const calculateDuration = (start, end) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      // Difference in time
      const diffTime = Math.abs(endDate - startDate);
      // Difference in days (+1 to include the start day)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  // --- HELPER 2: OPEN DOCUMENT ---
  const handleViewDoc = (path) => {
      if (!path) return;
      // Convert "uploads\file.jpg" (Windows) to "uploads/file.jpg" (Web)
      const cleanPath = path.replace(/\\/g, "/"); 
      window.open(`https://hrms-backend-8254.onrender.com/${cleanPath}`, '_blank');
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved': return <Chip label="Approved" color="success" size="small" icon={<CheckCircleIcon />} sx={{ fontWeight: 'bold' }} />;
      case 'Rejected': return <Chip label="Rejected" color="error" size="small" icon={<CancelIcon />} sx={{ fontWeight: 'bold' }} />;
      default: return <Chip label="Pending" color="warning" size="small" icon={<HourglassEmptyIcon />} variant="outlined" sx={{ fontWeight: 'bold', border: '2px solid' }} />;
    }
  };

  if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1565c0' }}>
        <EventIcon /> My Leave History
      </Typography>

      {history.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9', border: '1px dashed #ccc' }}>
           <Typography color="textSecondary">You haven't applied for any leave yet.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }} aria-label="leave history table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Leave Type</StyledTableCell>
                <StyledTableCell>Duration</StyledTableCell> {/* NEW COLUMN */}
                <StyledTableCell>Dates</StyledTableCell>
                <StyledTableCell>Reason</StyledTableCell>
                <StyledTableCell align="center">Doc</StyledTableCell> {/* NEW COLUMN */}
                <StyledTableCell align="center">Status</StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {history.map((record) => (
                <StyledTableRow key={record._id}>
                  <StyledTableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {record.leaveType}
                  </StyledTableCell>
                  
                  {/* DURATION DISPLAY */}
                  <StyledTableCell sx={{ fontWeight: 'bold', color: '#555' }}>
                      {calculateDuration(record.startDate, record.endDate)}
                  </StyledTableCell>

                  <StyledTableCell>
                      {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                  </StyledTableCell>
                  
                  <StyledTableCell sx={{ fontStyle: 'italic', color: '#555', maxWidth: 150 }}>
                    {record.reason}
                  </StyledTableCell>
                  
                  {/* DOCUMENT BUTTON */}
                  <StyledTableCell align="center">
                      {record.attachment ? (
                          <Tooltip title="View Certificate">
                              <IconButton color="primary" onClick={() => handleViewDoc(record.attachment)}>
                                  <DescriptionIcon />
                              </IconButton>
                          </Tooltip>
                      ) : (
                          <Typography variant="caption" color="textSecondary">-</Typography>
                      )}
                  </StyledTableCell>

                  <StyledTableCell align="center">
                    {getStatusChip(record.status)}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}