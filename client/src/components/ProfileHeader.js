import React, { useState } from 'react'; // Removed useEffect since we don't need a ticking timer for a Date
import { Paper, Box, Typography, Avatar, Chip } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // Changed Icon to Calendar

function getAvatarSrc(path) {
    return path ? `https://hrms-backend-8254.onrender.com/${path}` : null;
}

export default function ProfileHeader({ user }) {
  // We don't need a timer for the Date, just get it once on render
  const [date] = useState(new Date());

  if (!user) return null;

  return (
    <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
      {/* 1. BLUE BANNER BACKGROUND */}
      <Box sx={{ 
          height: 140, 
          background: 'linear-gradient(90deg, #1565c0 0%, #42a5f5 100%)',
          position: 'relative'
      }} />

      {/* 2. PROFILE CONTENT AREA */}
      {/* FIX 1: Removed marginTop: '-60px' from here so text stays down */}
      <Box sx={{ px: 4, pb: 3, display: 'flex', alignItems: 'flex-end' }}>
        
        {/* PROFILE PICTURE */}
        <Avatar 
            src={getAvatarSrc(user.profilePicture)}
            alt={user.firstName}
            sx={{ 
                width: 120, height: 120, 
                border: '4px solid white', 
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                bgcolor: '#ff5722', 
                fontSize: '3rem',
                // FIX 1: Applied negative margin ONLY to the Avatar
                marginTop: '-60px' 
            }}
        >
            {user.firstName[0]}
        </Avatar>

        {/* TEXT DETAILS */}
        <Box sx={{ ml: 3, mb: 1, flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {user.designation} • {user.department} 
                <Chip label={user.role} size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
            </Typography>
        </Box>

        {/* DATE DISPLAY (Right Side) */}
        <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' }, mb: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
               Today is
            </Typography>
            {/* FIX 2: Switched to Date Format and Calendar Icon */}
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                <CalendarTodayIcon /> 
                {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography variant="caption" sx={{ color: 'green' }}>● Active Now</Typography>
        </Box>
      </Box>
    </Paper>
  );
}