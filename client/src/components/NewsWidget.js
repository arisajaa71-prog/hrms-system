import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Paper, Typography, Box, Divider, List, ListItem, ListItemText, 
  Button, TextField, IconButton, Collapse 
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function NewsWidget() {
  const [news, setNews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  
  const role = localStorage.getItem('role');
  const isAdmin = role === 'Admin' || role === 'Senior Admin';

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/announcements', { headers: { Authorization: token } });
        setNews(res.data);
    } catch (err) { console.error(err); }
  };

  const handlePost = async () => {
      try {
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5001/api/announcements', newPost, { headers: { Authorization: token } });
          setNewPost({ title: '', content: '' });
          setShowForm(false);
          fetchNews();
      } catch (err) { alert("Error posting news"); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this announcement?")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5001/api/announcements/${id}`, { headers: { Authorization: token } });
          fetchNews();
      } catch (err) { alert("Error deleting"); }
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden', height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: '#1565c0' }}>
                <CampaignIcon /> Announcements
            </Typography>
            {isAdmin && (
                <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => setShowForm(!showForm)}>
                    Post
                </Button>
            )}
        </Box>
        <Divider />

        {/* ADMIN POST FORM */}
        <Collapse in={showForm}>
            <Box sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
                <TextField fullWidth size="small" label="Title" sx={{ mb: 1 }} value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} />
                <TextField fullWidth multiline rows={2} size="small" label="Message" sx={{ mb: 1 }} value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} />
                <Button fullWidth variant="contained" onClick={handlePost}>Publish</Button>
            </Box>
        </Collapse>

        {/* NEWS LIST */}
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {news.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="textSecondary">No news yet.</Typography></Box>
            ) : (
                news.map((item) => (
                    <React.Fragment key={item._id}>
                        <ListItem alignItems="flex-start" secondaryAction={
                            isAdmin && <IconButton edge="end" size="small" onClick={() => handleDelete(item._id)}><DeleteIcon fontSize="small" color="disabled"/></IconButton>
                        }>
                            <ListItemText 
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.title}</Typography>}
                                secondary={
                                    <>
                                        <Typography variant="body2" color="textPrimary" sx={{ display: 'block', my: 0.5 }}>{item.content}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Posted by {item.postedBy} • {new Date(item.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </>
                                }
                            />
                        </ListItem>
                        <Divider component="li" />
                    </React.Fragment>
                ))
            )}
        </List>
    </Paper>
  );
}