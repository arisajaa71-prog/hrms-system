import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Training = ({ role }) => {
  const [trainings, setTrainings] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '', courseName: '', deadline: '', description: ''
  });

  useEffect(() => { fetchTrainings(); }, []);

  const fetchTrainings = async () => {
    try {
      const res = await axios.get('https://hrms-backend-8254.onrender.com/api/training');
      setTrainings(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://hrms-backend-8254.onrender.com/api/training', formData);
      alert('✅ Training Assigned!');
      setFormData({ employeeId: '', courseName: '', deadline: '', description: '' });
      fetchTrainings();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleComplete = async (id) => {
    try {
      await axios.put(`https://hrms-backend-8254.onrender.com/api/training/${id}`, { status: 'Completed' });
      alert('🎉 Course Completed!');
      fetchTrainings();
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ marginTop: "20px", borderTop: "2px solid #333", paddingTop: "20px" }}>
      <h2>🎓 Learning & Development</h2>

      {/* --- ADMIN & SENIOR ADMIN FORM --- */}
      {(role === 'Admin' || role === 'Senior Admin') && (
        <div style={{ background: "#e8f5e9", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          <h3>➕ Assign Training Course</h3>
          <form onSubmit={handleAssign} style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
                <input name="employeeId" placeholder="Employee ID (e.g. EMP001)" value={formData.employeeId} onChange={handleChange} required style={{ padding: "8px", flex: 1 }} />
                <input name="courseName" placeholder="Course Name" value={formData.courseName} onChange={handleChange} required style={{ padding: "8px", flex: 2 }} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
                <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required style={{ padding: "8px" }} />
                <input name="description" placeholder="Description / Link" value={formData.description} onChange={handleChange} style={{ padding: "8px", flex: 2 }} />
            </div>
            <button type="submit" style={{ padding: "10px", background: "#28a745", color: "white", border: "none", cursor: "pointer" }}>Assign Course</button>
          </form>
        </div>
      )}

      {/* COURSE LIST */}
      <div style={{ display: "grid", gap: "10px" }}>
        {trainings.map((course) => (
          <div key={course._id} style={{ 
            border: "1px solid #ccc", padding: "15px", borderRadius: "6px", background: "#fff",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
                <h4 style={{ margin: 0 }}>
                    {course.courseName} 
                    <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal", marginLeft: "10px" }}>
                        (Assigned to: {course.employeeId})
                    </span>
                </h4>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>{course.description}</p>
                <small style={{ color: "red" }}>Due: {new Date(course.deadline).toLocaleDateString()}</small>
            </div>
            <div>
                {course.status === 'Completed' ? (
                    <span style={{ color: "green", fontWeight: "bold", border: "1px solid green", padding: "5px 10px", borderRadius: "20px" }}>✅ Completed</span>
                ) : (
                    <button onClick={() => handleComplete(course._id)} style={{ background: "#007bff", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer" }}>Mark Complete</button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Training;