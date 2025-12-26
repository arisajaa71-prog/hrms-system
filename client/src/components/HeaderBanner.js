import React from 'react';
import { Paper, Typography, Box, Avatar, Chip } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star'; // New Icon for Owner

export default function HeaderBanner({ user }) {
  if (!user) return null;

  // Format today's date
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // Check if Owner
  const isOwner = user.role === 'Owner';

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 0, 
        mb: 3, 
        borderRadius: 2, 
        overflow: 'hidden', 
        position: 'relative',
        backgroundColor: '#fff' 
      }}
    >
      {/* BACKGROUND HEADER */}
      <Box 
        sx={{ 
          height: 140, 
          // If Owner, use a darker, premium gradient. If staff, use standard blue.
          background: isOwner 
            ? 'linear-gradient(to right, #1a237e, #283593)' 
            : 'linear-gradient(to right, #1976d2, #42a5f5)' 
        }} 
      />

      {/* CONTENT ROW */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', px: 4, pb: 3, mt: -6 }}>
        
        {/* AVATAR */}
        <Avatar 
          src={user.profilePicture ? `http://localhost:5001/${user.profilePicture}` : null} 
          sx={{ 
            width: 120, 
            height: 120, 
            border: '4px solid white', 
            boxShadow: 3,
            fontSize: '3rem',
            bgcolor: isOwner ? '#fbc02d' : '#ff5722' // Gold background for Owner avatar fallback
          }}
        >
          {user.firstName ? user.firstName.charAt(0) : 'U'}
        </Avatar>

        {/* TEXT INFO */}
        <Box sx={{ ml: 3, mb: 1, flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
            {user.firstName} {user.lastName}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body1" color="textSecondary">
              {user.designation} • {user.department}
            </Typography>
            
            {/* ROLE CHIP */}
            <Chip 
              icon={isOwner ? <StarIcon style={{ color: '#5d4037' }} /> : null}
              label={user.role} 
              size="small" 
              variant={isOwner ? "filled" : "outlined"} 
              // Gold color for Owner, Blue for others
              sx={{ 
                height: 24, 
                fontSize: '0.75rem',
                fontWeight: 'bold',
                bgcolor: isOwner ? '#ffca28' : 'transparent',
                color: isOwner ? '#5d4037' : 'primary.main',
                borderColor: isOwner ? 'transparent' : 'primary.main'
              }}
            />
          </Box>
        </Box>

        {/* DATE & STATUS (Right Side) */}
        <Box sx={{ textAlign: 'right', mb: 1, display: { xs: 'none', md: 'block' } }}>
            <Typography variant="caption" display="block" color="textSecondary">Today is</Typography>
            <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                <CalendarTodayIcon fontSize="small" /> {today}
            </Typography>
            <Typography variant="caption" sx={{ color: 'green', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                ● Active Now
            </Typography>
        </Box>
      </Box>
    </Paper>
  );
}