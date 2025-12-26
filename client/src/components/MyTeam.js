import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Paper, Typography, Box, Avatar, Chip, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, styled, tableCellClasses, CircularProgress
} from '@mui/material';

// Icons
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

// --- STYLED COMPONENTS ---
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
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover, 
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

function getAvatarProps(emp) {
    if (emp && emp.profilePicture) {
        return { src: `http://localhost:5001/${emp.profilePicture}`, alt: emp.firstName };
    }
    const name = emp ? `${emp.firstName} ${emp.lastName}` : "User";
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    let color = '#';
    for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xff; color += `00${value.toString(16)}`.slice(-2); }
    return { sx: { bgcolor: color }, children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}` };
}

export default function MyTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      // --- THE FIX IS HERE ---
      // Changed from '/my-team' to '/team' to match the backend route exactly
      const res = await axios.get('http://localhost:5001/api/employees/team', {
        headers: { Authorization: token }
      });
      setTeam(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SupervisorAccountIcon color="primary" fontSize="large"/> My Direct Reports
      </Typography>

      {team.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" color="textSecondary">You do not have any direct reports.</Typography>
            <Typography variant="body2" color="textSecondary">
                When employees are assigned to report to you, they will appear here.
            </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <StyledTableCell>Employee</StyledTableCell>
                <StyledTableCell>Designation</StyledTableCell>
                <StyledTableCell>Department</StyledTableCell>
                <StyledTableCell>Contact Info</StyledTableCell>
                <StyledTableCell align="center">Status</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {team.map((emp) => (
                <StyledTableRow key={emp._id}>
                  <StyledTableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar {...getAvatarProps(emp)} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold">{emp.firstName} {emp.lastName}</Typography>
                            <Typography variant="caption" color="textSecondary">{emp.employeeId || 'No ID'}</Typography>
                        </Box>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>{emp.designation}</StyledTableCell>
                  <StyledTableCell>
                      <Chip label={emp.department} size="small" variant="outlined" />
                  </StyledTableCell>
                  <StyledTableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                              <EmailIcon fontSize="inherit" color="action" /> {emp.email}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                              <PhoneIcon fontSize="inherit" color="action" /> {emp.mobile || 'N/A'}
                          </Box>
                      </Box>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small" 
                      />
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