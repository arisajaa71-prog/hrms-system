import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx'; // Import XLSX
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, TextField, Button, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Divider, Alert, CircularProgress,
  Card, CardContent, Chip, Tabs, Tab, Tooltip, IconButton, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, CardActionArea, CardHeader
} from '@mui/material';

// --- ICONS ---
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalculateIcon from '@mui/icons-material/Calculate';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TableViewIcon from '@mui/icons-material/TableView'; 
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BoltIcon from '@mui/icons-material/Bolt'; 
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import FileDownloadIcon from '@mui/icons-material/FileDownload'; 

// --- STYLES ---
const menuPropsSelectEmployee = { PaperProps: { style: { width: 'auto', minWidth: 350 } } };

export default function Payroll({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); 
  const [payrolls, setPayrolls] = useState([]); 
  const [employees, setEmployees] = useState([]);
  
  const [analytics, setAnalytics] = useState({
      totalCost: 0, totalBasic: 0, totalAllowances: 0, totalHeadcount: 0, 
      wpsIssues: 0, totalGratuityLiability: 0, deptBreakdown: []
  });

  const [selectedEmp, setSelectedEmp] = useState(null); 
  const [formData, setFormData] = useState({
    employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    otNormal: 0, otNight: 0, otHoliday: 0, bonus: 0, arrears: 0,
    latenessHours: 0, unpaidLeaveDays: 0, loanDeduction: 0,
  });

  const [bulkDept, setBulkDept] = useState('All');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [compData, setCompData] = useState({}); 
  const [searchSalary, setSearchSalary] = useState(''); 
  const [autoGross, setAutoGross] = useState(''); 
  
  const [openGratuity, setOpenGratuity] = useState(false);
  const [gratuityList, setGratuityList] = useState([]);

  const [openPreview, setOpenPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [msg, setMsg] = useState({ type: '', content: '' });
  const [preview, setPreview] = useState(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (role === 'Owner' || role === 'Senior Admin' || role === 'Admin') fetchData();
    else setLoading(false);
  }, [role]);

  useEffect(() => { fetchPayrollList(); }, [formData.month, formData.year]);
  useEffect(() => { if (employees.length > 0) generateAnalytics(); }, [employees]); 

  // --- STICKY NAV ---
  useEffect(() => {
    if (!loading && employees.length > 0 && location.state?.onboardId) {
        const targetEmp = employees.find(e => e._id === location.state.onboardId);
        if (targetEmp) {
            setTabValue(2); 
            handleEditClick(targetEmp); 
        }
    }
  }, [loading, employees, location.state]);

  // --- API CALLS ---
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const empRes = await axios.get('https://hrms-backend-8254.onrender.com/api/employees', { headers: { Authorization: token } });
      setEmployees(empRes.data.filter(emp => emp.role !== 'Owner'));
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const fetchPayrollList = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`https://hrms-backend-8254.onrender.com/api/payroll/list?month=${formData.month}&year=${formData.year}`, { headers: { Authorization: token } });
          setPayrolls(res.data);
      } catch (err) { console.error(err); }
  };

  // --- EXCEL EXPORT ENGINE ---
  const handleExportExcel = () => {
    if (payrolls.length === 0) return alert("No data to export.");

    const data = payrolls.map(p => ({
        "Employee ID": p.employee?.employeeId || '-',
        "Name": `${p.employee?.firstName} ${p.employee?.lastName}`,
        "Designation": p.employee?.designation,
        "Department": p.employee?.department,
        "Days Worked": p.daysWorked || 30, 
        "Basic Salary": p.basic,
        "Housing": p.housing,
        "Transport": p.transport,
        "Other Allowances": p.otherAllowances,
        "Gross Fixed": (p.basic + p.housing + p.transport + p.otherAllowances),
        "Overtime": (p.totals?.overtime || 0),
        "Bonus": (p.totals?.bonus || 0),
        "Arrears": (p.totals?.arrears || 0), 
        "Total Deductions": (p.totals?.deductions || 0),
        "Net Salary": p.netSalary,
        "Bank Name": p.employee?.bankDetails?.bankName || '',
        "IBAN": p.employee?.bankDetails?.iban || '',
        "WPS ID": p.employee?.bankDetails?.wpsId || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, `Payroll_${formData.month}_${formData.year}.xlsx`);
  };

  // --- PDF ENGINE ---
  const generatePDF = (payroll) => {
      const doc = new jsPDF();
      const emp = payroll.employee || {};
      const monthName = new Date(0, (payroll.month || 1) - 1).toLocaleString('en', {month:'long'});
      
      const safeVal = (val) => (val === undefined || val === null || isNaN(val)) ? 0 : val;
      const formatCurr = (val) => safeVal(val).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

      // Data
      const basic = safeVal(payroll.basic);
      const housing = safeVal(payroll.housing);
      const transport = safeVal(payroll.transport);
      const other = safeVal(payroll.otherAllowances);
      const grossFixed = basic + housing + transport + other;

      const otNormalHrs = safeVal(payroll.inputData?.overtimeNormalHours);
      const otNightHrs = safeVal(payroll.inputData?.overtimeNightHours);
      const otHolidayHrs = safeVal(payroll.inputData?.overtimeHolidayHours);
      
      const baseHourlyRate = basic / 240; 
      const normalRateMoney = baseHourlyRate * 1.25;
      const nightRateMoney = baseHourlyRate * 1.50;
      const holidayRateMoney = baseHourlyRate * 1.50;

      const otNormalAmt = otNormalHrs * normalRateMoney;
      const otNightAmt = otNightHrs * nightRateMoney;
      const otHolidayAmt = otHolidayHrs * holidayRateMoney;
      const totalOTAmt = otNormalAmt + otNightAmt + otHolidayAmt;

      const unpaidDays = safeVal(payroll.inputData?.unpaidLeaveDays);
      const dailyRate = grossFixed / 30; 
      const unpaidAmt = unpaidDays * dailyRate;
      const loanAmt = safeVal(payroll.inputData?.loanDeductionAmount);
      
      const totalDeducted = safeVal(payroll.totals?.deductions ?? payroll.deductions);
      const otherDeductions = totalDeducted - (unpaidAmt + loanAmt);
      const netSalary = safeVal(payroll.netSalary);
      const arrears = safeVal(payroll.totals?.arrears || payroll.arrears); 

      // Design
      doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
      doc.text("PAYSLIP", 105, 20, null, null, "center");
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("CONFIDENTIAL", 105, 28, null, null, "center");
      doc.setFontSize(12); doc.text(`Period: ${monthName} ${payroll.year}`, 105, 38, null, null, "center");

      doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setDrawColor(200, 200, 200);
      doc.line(14, 50, 196, 50); 
      doc.setFont("helvetica", "bold"); doc.text("EMPLOYEE DETAILS", 14, 58); doc.setFont("helvetica", "normal");
      
      doc.text(`Name:`, 14, 66); doc.text(`${emp.firstName} ${emp.lastName}`, 50, 66);
      doc.text(`ID:`, 14, 72); doc.text(`${emp.employeeId || '-'}`, 50, 72);
      doc.text(`Designation:`, 14, 78); doc.text(`${emp.designation || '-'}`, 50, 78);
      
      doc.text(`Bank:`, 110, 66); doc.text(`${emp.bankDetails?.bankName || '-'}`, 145, 66);
      doc.text(`IBAN:`, 110, 72); doc.text(`${emp.bankDetails?.iban || '-'}`, 145, 72);
      doc.text(`WPS ID:`, 110, 78); doc.text(`${emp.bankDetails?.wpsId || '-'}`, 145, 78);
      doc.line(14, 82, 196, 82); 

      // Earnings
      autoTable(doc, {
          startY: 90, head: [['FIXED EARNINGS', 'AMOUNT (AED)']],
          body: [
              ['Basic Salary', formatCurr(basic)], ['Housing Allowance', formatCurr(housing)],
              ['Transport Allowance', formatCurr(transport)], ['Other Allowances', formatCurr(other)],
              [{content: 'Total Fixed Gross', styles: {fontStyle: 'bold'}}, {content: formatCurr(grossFixed), styles: {fontStyle: 'bold'}}]
          ],
          theme: 'striped', headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
          columnStyles: { 1: { halign: 'right' } }
      });

      // Variable
      if (totalOTAmt > 0 || safeVal(payroll.bonus) > 0 || arrears > 0) {
          autoTable(doc, {
              startY: doc.lastAutoTable.finalY + 10,
              head: [['ADDITIONS / OVERTIME', 'HOURS', 'RATE (AED)', 'AMOUNT (AED)']],
              body: [
                  ...(otNormalHrs > 0 ? [['Normal OT (1.25x)', otNormalHrs, formatCurr(normalRateMoney), formatCurr(otNormalAmt)]] : []),
                  ...(otNightHrs > 0 ? [['Night OT (1.50x)', otNightHrs, formatCurr(nightRateMoney), formatCurr(otNightAmt)]] : []),
                  ...(otHolidayHrs > 0 ? [['Holiday OT (1.50x)', otHolidayHrs, formatCurr(holidayRateMoney), formatCurr(otHolidayAmt)]] : []),
                  ...(safeVal(payroll.bonus) > 0 ? [['Bonus/Comm.', '-', '-', formatCurr(payroll.bonus)]] : []),
                  ...(arrears > 0 ? [['Arrears / Retro Pay', '-', '-', formatCurr(arrears)]] : []),
                  [{content: 'Total Variable Pay', colSpan: 3, styles: {fontStyle: 'bold'}}, {content: formatCurr(totalOTAmt + safeVal(payroll.bonus) + arrears), styles: {fontStyle: 'bold', halign: 'right'}}]
              ],
              theme: 'grid', headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
              columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
          });
      }

      // Deductions
      if (totalDeducted > 0) {
          autoTable(doc, {
              startY: doc.lastAutoTable.finalY + 10,
              head: [['DEDUCTIONS', 'DETAILS', 'AMOUNT (AED)']],
              body: [
                  ...(unpaidDays > 0 ? [['Unpaid Leave', `${unpaidDays} Days`, formatCurr(unpaidAmt)]] : []),
                  ...(loanAmt > 0 ? [['Loan Repayment', '-', formatCurr(loanAmt)]] : []),
                  ...(otherDeductions > 0.01 ? [['Other / Lateness', '-', formatCurr(otherDeductions)]] : []),
                  [{content: 'Total Deductions', colSpan: 2, styles: {fontStyle: 'bold'}}, {content: `(${formatCurr(totalDeducted)})`, styles: {fontStyle: 'bold', textColor: [200, 0, 0], halign: 'right'}}]
              ],
              theme: 'grid', headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
              columnStyles: { 2: { halign: 'right' } }
          });
      }

      // Footer
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFillColor(30, 41, 59); doc.rect(120, finalY, 76, 12, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("NET PAYABLE", 125, finalY + 8);
      doc.text(`AED ${formatCurr(netSalary)}`, 190, finalY + 8, null, null, "right");

      doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      doc.text("System Generated Payslip.", 105, 280, null, null, "center");
      doc.save(`Payslip_${emp.firstName}_${monthName}_${payroll.year}.pdf`);
  };

  // --- ACTIONS ---
  const handleApprove = async (id) => {
      try {
          const token = localStorage.getItem('token');
          await axios.put(`https://hrms-backend-8254.onrender.com/api/payroll/approve/${id}`, {}, { headers: { Authorization: token } });
          fetchPayrollList(); setOpenPreview(false);
      } catch(err) { alert('Error approving'); }
  };

  const handleBulkApprove = async () => {
      if(!window.confirm("Approve ALL draft payrolls for this month?")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.put(`https://hrms-backend-8254.onrender.com/api/payroll/approve-all`, { month: formData.month, year: formData.year }, { headers: { Authorization: token } });
          fetchPayrollList(); alert("All Approved!");
      } catch(err) { alert('Error approving'); }
  };

  const handleEmail = (payroll) => alert(`Simulation: Emailing PDF to ${payroll.employee.firstName}...`);
  
  const handleBulkEmail = () => {
      const approvedCount = payrolls.filter(p => p.status === 'Approved').length;
      if(approvedCount === 0) return alert("No approved payslips to email.");
      alert(`Simulation: Queuing emails for ${approvedCount} employees...`);
  };

  const handleDeletePayroll = async (id) => {
      if(!window.confirm("Are you sure you want to delete this payroll record?")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`https://hrms-backend-8254.onrender.com/api/payroll/${id}`, { headers: { Authorization: token } });
          fetchPayrollList();
      } catch(err) { alert("Error deleting record"); }
  };

  const handlePreviewClick = (payroll) => { setPreviewData(payroll); setOpenPreview(true); };

  const handleEditPayrollRecord = (payroll) => {
      setFormData(prev => ({
          ...prev, employeeId: payroll.employee._id,
          otNormal: payroll.inputData?.overtimeNormalHours || 0,
          otNight: payroll.inputData?.overtimeNightHours || 0,
          otHoliday: payroll.inputData?.overtimeHolidayHours || 0,
          bonus: payroll.totals?.bonus || payroll.bonus || 0,
          arrears: payroll.totals?.arrears || payroll.inputData?.arrearsAmount || 0, 
          unpaidLeaveDays: payroll.inputData?.unpaidLeaveDays || 0,
          loanDeduction: payroll.inputData?.loanDeductionAmount || 0,
      }));
      const emp = employees.find(e => e._id === payroll.employee._id);
      if (emp) setSelectedEmp(emp);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- CALCULATIONS ---
  const calculateGratuity = (emp) => {
      if (!emp.joiningDate) return { eligible: false, amount: 0, tenure: 0 };
      const start = new Date(emp.joiningDate);
      const diffTime = Math.abs(new Date() - start);
      const yearsOfService = diffTime / (1000 * 60 * 60 * 24 * 365.25); 
      
      if (yearsOfService < 1) return { eligible: false, amount: 0, tenure: yearsOfService };
      
      const basic = emp.salaryDetails?.basic || 0;
      const dailyBasic = basic / 30;
      let gratuityAmount = 0;

      if (yearsOfService <= 5) gratuityAmount = 21 * dailyBasic * yearsOfService;
      else gratuityAmount = (21 * dailyBasic * 5) + (30 * dailyBasic * (yearsOfService - 5));

      const maxGratuity = (basic + (emp.salaryDetails?.housing || 0) + (emp.salaryDetails?.transport || 0)) * 24; 
      return { eligible: true, amount: Math.min(gratuityAmount, maxGratuity), tenure: yearsOfService };
  };

  const generateAnalytics = () => {
    let totalGross = 0; let totalBasic = 0; let totalAllowances = 0; let totalLiability = 0; let wpsCount = 0;
    const deptMap = {}; const gList = [];

    employees.forEach(emp => {
      const basic = emp.salaryDetails?.basic || 0;
      const gross = basic + (emp.salaryDetails?.housing || 0) + (emp.salaryDetails?.transport || 0) + (emp.salaryDetails?.other || 0);
      totalGross += gross; totalBasic += basic; totalAllowances += (gross - basic);

      if (!emp.bankDetails?.iban || !emp.bankDetails?.wpsId) wpsCount++;
      const gCalc = calculateGratuity(emp);
      if (gCalc.amount > 0) totalLiability += gCalc.amount;
      gList.push({ ...emp, gratuity: gCalc });

      const dept = emp.department || 'Unassigned';
      if (!deptMap[dept]) deptMap[dept] = { name: dept, count: 0, cost: 0 };
      deptMap[dept].count++; deptMap[dept].cost += gross;
    });

    setGratuityList(gList.sort((a,b) => b.gratuity.amount - a.gratuity.amount));
    setAnalytics({ 
        totalCost: totalGross, totalBasic: totalBasic, totalAllowances: totalAllowances, 
        totalHeadcount: employees.length, wpsIssues: wpsCount, totalGratuityLiability: totalLiability, 
        deptBreakdown: Object.values(deptMap) 
    });
  };

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e._id === empId);
    setSelectedEmp(emp); setFormData({ ...formData, employeeId: empId });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value === '' ? '' : Number(value) });
  };

  // --- EDIT COMPENSATION ---
  const handleEditClick = (emp) => {
      setEditEmp(emp);
      const currentBasic = emp.salaryDetails?.basic || 0;
      setCompData({
          salaryDetails: { basic: currentBasic, housing: emp.salaryDetails?.housing||0, transport: emp.salaryDetails?.transport||0, other: emp.salaryDetails?.other||0 },
          bankDetails: { ...emp.bankDetails } || { bankName: '', iban: '', accountNumber: '', wpsId: '' }
      });
      const gross = currentBasic + (emp.salaryDetails?.housing||0) + (emp.salaryDetails?.transport||0) + (emp.salaryDetails?.other||0);
      setAutoGross(gross); setOpenEdit(true);
  };
  
  const handleCloseEdit = () => {
      setOpenEdit(false); setEditEmp(null);
      if (location.state?.onboardId) { navigate(location.pathname, { replace: true, state: {} }); }
  };

  const handleAutoGrossChange = (e) => {
      const val = e.target.value;
      const gross = val === '' ? '' : Number(val);
      setAutoGross(gross);
      if (gross > 0) {
          const basic = Math.round(gross * 0.60);
          const housing = Math.round(gross * 0.30);
          const transport = Math.round(gross * 0.10);
          setCompData(prev => ({ ...prev, salaryDetails: { basic, housing, transport, other: 0 } }));
      } else {
          setCompData(prev => ({ ...prev, salaryDetails: { basic: 0, housing: 0, transport: 0, other: 0 } }));
      }
  };

  const handleComponentChange = (field, value) => {
      const numVal = value === '' ? 0 : Number(value);
      const newDetails = { ...compData.salaryDetails, [field]: numVal };
      setCompData({ ...compData, salaryDetails: newDetails });
      const newGross = (newDetails.basic || 0) + (newDetails.housing || 0) + (newDetails.transport || 0) + (newDetails.other || 0);
      setAutoGross(newGross);
  };

  const handleSaveCompensation = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = { salaryDetails: compData.salaryDetails, bankDetails: compData.bankDetails, salary: autoGross };
        await axios.put(`https://hrms-backend-8254.onrender.com/api/employees/${editEmp._id}/compensation`, data, { headers: { Authorization: token } });
        alert("Compensation Updated!"); handleCloseEdit(); fetchData(); 
      } catch (err) { alert("Error updating compensation"); }
  };

  useEffect(() => { if (selectedEmp) calculatePreview(); }, [formData, selectedEmp]);

  const calculatePreview = () => {
    if (!selectedEmp) return;
    const basic = selectedEmp.salaryDetails?.basic || 0;
    const fixedGross = basic + (selectedEmp.salaryDetails?.housing || 0) + (selectedEmp.salaryDetails?.transport || 0) + (selectedEmp.salaryDetails?.telecom || 0) + (selectedEmp.salaryDetails?.other || 0);
    const hourlyRate = basic / 240; 
    
    const otNormalPay = (formData.otNormal || 0) * hourlyRate * 1.25;
    const otNightPay = (formData.otNight || 0) * hourlyRate * 1.50;
    const otHolidayPay = (formData.otHoliday || 0) * hourlyRate * 1.50;
    const totalOtAmount = otNormalPay + otNightPay + otHolidayPay;
    
    const latenessAmount = (formData.latenessHours || 0) * hourlyRate;
    const dailyGross = fixedGross / 30;
    const unpaidLeaveAmount = (formData.unpaidLeaveDays || 0) * dailyGross;
    const totalDeductions = latenessAmount + unpaidLeaveAmount + (formData.loanDeduction || 0);
    const netSalary = (fixedGross + totalOtAmount + (formData.bonus || 0) + (formData.arrears || 0)) - totalDeductions;
    
    setPreview({ 
        basic, fixedGross, hourlyRate, otNormalPay, otNightPay, otHolidayPay, totalOtAmount, 
        latenessAmount, unpaidLeaveAmount, totalDeductions, netSalary, 
        totalEarnings: fixedGross + totalOtAmount + (formData.bonus || 0) + (formData.arrears || 0) 
    });
  };

  const handleSubmit = async () => {
    setMsg({ type: '', content: '' });
    if (!formData.employeeId) return setMsg({ type: 'error', content: 'Please select an employee' });
    try {
      const token = localStorage.getItem('token');
      const payload = {
        employeeId: formData.employeeId, month: formData.month, year: formData.year,
        overtimeHours: { normal: formData.otNormal, night: formData.otNight, holiday: formData.otHoliday },
        bonus: formData.bonus,
        arrears: formData.arrears, 
        deductions: { unpaidLeaveDays: formData.unpaidLeaveDays, loan: formData.loanDeduction, other: 0 }
      };
      await axios.post('https://hrms-backend-8254.onrender.com/api/payroll/generate', payload, { headers: { Authorization: token } });
      setMsg({ type: 'success', content: '✅ Payslip Updated!' });
      fetchPayrollList(); setFormData(prev => ({ ...prev, otNormal: 0, otNight: 0, otHoliday: 0, bonus: 0, arrears: 0, latenessHours: 0, unpaidLeaveDays: 0, loanDeduction: 0 }));
    } catch (err) { setMsg({ type: 'error', content: err.response?.data?.msg || 'Error generating payroll' }); }
  };

  const handleBulkRun = async () => {
      if(!window.confirm(`Run Bulk Payroll for ${bulkDept}?`)) return;
      setBulkLoading(true);
      try {
        const token = localStorage.getItem('token');
        const payload = { 
            department: bulkDept, 
            month: Number(formData.month), 
            year: Number(formData.year)    
        };
        const res = await axios.post('https://hrms-backend-8254.onrender.com/api/payroll/bulk-generate', payload, { headers: { Authorization: token } });
        setMsg({ type: 'success', content: res.data.msg }); 
        setTimeout(() => fetchPayrollList(), 500); 
      } catch(err) { setMsg({ type: 'error', content: "Error running bulk payroll" }); } finally { setBulkLoading(false); }
  };

  const formatMoney = (amount) => {
      if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
      return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getWpsStatus = (emp) => {
      const isMissing = !emp.bankDetails?.iban || !emp.bankDetails?.wpsId;
      return isMissing 
        ? { label: 'Missing Info', color: 'error', icon: <WarningAmberIcon fontSize='small'/> } 
        : { label: 'Ready', color: 'success', icon: <CheckCircleIcon fontSize='small'/> };
  };

  const filteredEmployees = employees.filter(e => 
      e.firstName.toLowerCase().includes(searchSalary.toLowerCase()) || 
      e.lastName.toLowerCase().includes(searchSalary.toLowerCase())
  );
  const availableDepartments = [...new Set(employees.map(e => e.department))];

  if (loading) return <Box sx={{p:4, textAlign:'center'}}><CircularProgress /></Box>;

  return (
    <Box>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoneyIcon color="primary" fontSize="large" />
            <Typography variant="h4" fontWeight="bold">Payroll Management</Typography>
        </Box>
        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
                <Tab icon={<AnalyticsIcon />} iconPosition="start" label="Overview" />
                <Tab icon={<TableViewIcon />} iconPosition="start" label="Salary Master" />
                <Tab icon={<SettingsSuggestIcon />} iconPosition="start" label="Set Salary" />
                <Tab icon={<PlayCircleOutlineIcon />} iconPosition="start" label="Run Payroll" />
            </Tabs>
        </Paper>
      </Box>

      {/* ================= TAB 0: OVERVIEW ================= */}
      {tabValue === 0 && (
          <Box>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={3}>
                      <Paper elevation={2} sx={{ p: 2, bgcolor: '#e3f2fd', borderLeft: '5px solid #1976d2' }}>
                          <Typography variant="caption" color="textSecondary" fontWeight="bold">MONTHLY COMMITMENT</Typography>
                          <Typography variant="h5" fontWeight="bold" color="#1565c0">AED {formatMoney(analytics.totalCost)}</Typography>
                          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>Fixed Gross Payroll</Typography>
                      </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                      <Paper elevation={2} sx={{ p: 2, bgcolor: '#f3e5f5', borderLeft: '5px solid #9c27b0' }}>
                          <Typography variant="caption" color="textSecondary" fontWeight="bold">NET CASH REQUIRED</Typography>
                          <Typography variant="h5" fontWeight="bold" color="#7b1fa2">AED {formatMoney(analytics.totalCost)}</Typography>
                          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>Estimated Transfer</Typography>
                      </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                      <CardActionArea onClick={() => setOpenGratuity(true)}>
                        <Paper elevation={2} sx={{ p: 2, bgcolor: '#fff3e0', borderLeft: '5px solid #ed6c02', cursor: 'pointer', transition: '0.3s', '&:hover': { bgcolor: '#ffe0b2' } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="caption" color="textSecondary" fontWeight="bold">ACCRUED GRATUITY</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="#e65100">AED {formatMoney(analytics.totalGratuityLiability)}</Typography>
                                </Box>
                                <AnalyticsIcon color="warning" />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                                <VisibilityIcon fontSize="inherit" color="action" />
                                <Typography variant="caption" sx={{ textDecoration: 'underline' }}>View Liability Audit</Typography>
                            </Box>
                        </Paper>
                      </CardActionArea>
                  </Grid>
                  <Grid item xs={12} md={3}>
                      <Paper elevation={2} sx={{ p: 2, bgcolor: analytics.wpsIssues > 0 ? '#ffebee' : '#e8f5e9', borderLeft: `5px solid ${analytics.wpsIssues > 0 ? '#d32f2f' : '#2e7d32'}` }}>
                          <Typography variant="caption" color="textSecondary" fontWeight="bold">WPS READINESS</Typography>
                          <Typography variant="h5" fontWeight="bold" color={analytics.wpsIssues > 0 ? "error" : "success"}>
                              {analytics.wpsIssues > 0 ? `${analytics.wpsIssues} Missing` : '100% Ready'}
                          </Typography>
                          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>Missing IBAN/ID</Typography>
                      </Paper>
                  </Grid>
              </Grid>

              <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">Department Cost Center</Typography>
                      <TableContainer component={Paper} elevation={3}>
                          <Table>
                              <TableHead sx={{ bgcolor: '#eeeeee' }}>
                                  <TableRow>
                                      <TableCell>Department</TableCell>
                                      <TableCell align="center">Headcount</TableCell>
                                      <TableCell align="right">Fixed Cost</TableCell>
                                      <TableCell>Allocation</TableCell>
                                  </TableRow>
                              </TableHead>
                              <TableBody>
                                  {analytics.deptBreakdown.map((dept) => (
                                      <TableRow key={dept.name}>
                                          <TableCell><strong>{dept.name}</strong></TableCell>
                                          <TableCell align="center"><Chip icon={<GroupsIcon />} label={dept.count} size="small" /></TableCell>
                                          <TableCell align="right">AED {formatMoney(dept.cost)}</TableCell>
                                          <TableCell sx={{ width: '35%' }}>
                                              <LinearProgress variant="determinate" value={(dept.cost / analytics.totalCost) * 100} sx={{ height: 8, borderRadius: 5 }} />
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                      </TableContainer>
                  </Grid>
                  <Grid item xs={12} md={5}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">Structure Analysis</Typography>
                      <Paper elevation={3} sx={{ p: 3 }}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>Fixed vs. Allowances Ratio</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h4" color="primary" fontWeight="bold">{analytics.totalCost > 0 ? Math.round((analytics.totalBasic / analytics.totalCost) * 100) : 0}%</Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>Basic Salary Exposure</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={analytics.totalCost > 0 ? (analytics.totalBasic / analytics.totalCost) * 100 : 0} sx={{ height: 12, borderRadius: 5, mb: 2, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#ed6c02' } }} />
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Total Basic</Typography>
                              <Typography variant="body2" fontWeight="bold">AED {formatMoney(analytics.totalBasic)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Total Allowances</Typography>
                              <Typography variant="body2" fontWeight="bold">AED {formatMoney(analytics.totalAllowances)}</Typography>
                          </Box>
                      </Paper>
                  </Grid>
              </Grid>
          </Box>
      )}

      {/* ================= TAB 1: SALARY MASTER ================= */}
      {tabValue === 1 && (
           <Box>
              <Alert severity="info" sx={{ mb: 3 }}>This is a read-only audit. Use the <strong>Set Salary</strong> tab to edit.</Alert>
              <TableContainer component={Paper} elevation={3}>
                  <Table size="small">
                      <TableHead sx={{ bgcolor: '#e3f2fd' }}>
                          <TableRow>
                              <TableCell>Employee</TableCell>
                              <TableCell>Designation</TableCell>
                              <TableCell align="right">Basic</TableCell>
                              <TableCell align="right">Allowances</TableCell>
                              <TableCell align="right">Gross</TableCell>
                              <TableCell align="center">WPS</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {employees.map(emp => (
                                  <TableRow key={emp._id} hover>
                                      <TableCell>{emp.firstName} {emp.lastName}</TableCell>
                                      <TableCell>{emp.designation}</TableCell>
                                      <TableCell align="right">{formatMoney(emp.salaryDetails?.basic || 0)}</TableCell>
                                      <TableCell align="right">{formatMoney((emp.salaryDetails?.housing||0) + (emp.salaryDetails?.transport||0) + (emp.salaryDetails?.other||0))}</TableCell>
                                      <TableCell align="right"><strong>{formatMoney((emp.salaryDetails?.basic||0) + (emp.salaryDetails?.housing||0) + (emp.salaryDetails?.transport||0) + (emp.salaryDetails?.other||0))}</strong></TableCell>
                                      <TableCell align="center">{getWpsStatus(emp).icon}</TableCell>
                                  </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </TableContainer>
          </Box>
      )}

      {/* ================= TAB 2: SET SALARY ================= */}
      {tabValue === 2 && (
           <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Manage Compensation</Typography>
                  <TextField 
                      placeholder="Search..." size="small" value={searchSalary} 
                      onChange={(e) => setSearchSalary(e.target.value)} 
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} 
                  />
              </Box>
              <TableContainer component={Paper} elevation={3}>
                  <Table sx={{ minWidth: 650 }}>
                      <TableHead sx={{ bgcolor: '#eeeeee' }}>
                          <TableRow>
                              <TableCell>Employee</TableCell>
                              <TableCell>Department</TableCell>
                              <TableCell align="right">Basic Salary</TableCell>
                              <TableCell align="right">Allowances</TableCell>
                              <TableCell align="right">Total Gross</TableCell>
                              <TableCell align="center">Action</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {filteredEmployees.map(emp => (
                                  <TableRow key={emp._id} hover>
                                      <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                              <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>{emp.firstName[0]}{emp.lastName[0]}</Box>
                                              <Box>
                                                  <Typography variant="subtitle2" fontWeight="bold">{emp.firstName} {emp.lastName}</Typography>
                                                  <Typography variant="caption" color="textSecondary">{emp.designation}</Typography>
                                              </Box>
                                          </Box>
                                      </TableCell>
                                      <TableCell>{emp.department}</TableCell>
                                      <TableCell align="right">{formatMoney(emp.salaryDetails?.basic||0)}</TableCell>
                                      <TableCell align="right">{formatMoney((emp.salaryDetails?.housing||0)+(emp.salaryDetails?.transport||0)+(emp.salaryDetails?.other||0))}</TableCell>
                                      <TableCell align="right">
                                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                                              AED {formatMoney((emp.salaryDetails?.basic||0)+(emp.salaryDetails?.housing||0)+(emp.salaryDetails?.transport||0)+(emp.salaryDetails?.other||0))}
                                          </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                          <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => handleEditClick(emp)}>Edit</Button>
                                      </TableCell>
                                  </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </TableContainer>
              
              <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                  <DialogTitle sx={{ pb: 1 }}>Update Compensation
                      {editEmp && (<Typography variant="subtitle2" color="primary" sx={{ mt: 0.5, fontWeight: 'bold' }}>Employee: {editEmp.firstName} {editEmp.lastName} ({editEmp.designation})</Typography>)}
                  </DialogTitle>
                  <DialogContent dividers>
                    {editEmp && (
                        <>
                        <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <AutoFixHighIcon color="primary" fontSize="small" />
                                <Typography variant="subtitle2" color="primary" fontWeight="bold">Smart Salary Split</Typography>
                            </Box>
                            <TextField label="Total Gross Salary (Monthly)" fullWidth type="number" value={autoGross === 0 ? '' : autoGross} onChange={handleAutoGrossChange} sx={{ bgcolor: 'white' }} />
                        </Paper>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}><TextField label="Basic Salary (60%)" fullWidth type="number" value={compData.salaryDetails?.basic===0?'':compData.salaryDetails?.basic} onChange={(e) => handleComponentChange('basic', e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField label="Housing (30%)" fullWidth type="number" value={compData.salaryDetails?.housing===0?'':compData.salaryDetails?.housing} onChange={(e) => handleComponentChange('housing', e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField label="Transport (10%)" fullWidth type="number" value={compData.salaryDetails?.transport===0?'':compData.salaryDetails?.transport} onChange={(e) => handleComponentChange('transport', e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField label="Other/Telecom" fullWidth type="number" value={compData.salaryDetails?.other===0?'':compData.salaryDetails?.other} onChange={(e) => handleComponentChange('other', e.target.value)} /></Grid>
                        </Grid>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" color="primary" gutterBottom>Bank Details (WPS)</Typography>
                        <Grid container spacing={2}>
                             <Grid item xs={12}><TextField label="Bank Name" fullWidth value={compData.bankDetails?.bankName || ''} onChange={(e) => setCompData({...compData, bankDetails: {...compData.bankDetails, bankName: e.target.value}})} /></Grid>
                             <Grid item xs={12}><TextField label="IBAN Number" fullWidth value={compData.bankDetails?.iban || ''} onChange={(e) => setCompData({...compData, bankDetails: {...compData.bankDetails, iban: e.target.value}})} /></Grid>
                             <Grid item xs={6}><TextField label="Account Number" fullWidth value={compData.bankDetails?.accountNumber || ''} onChange={(e) => setCompData({...compData, bankDetails: {...compData.bankDetails, accountNumber: e.target.value}})} /></Grid>
                             <Grid item xs={6}><TextField label="WPS ID" fullWidth value={compData.bankDetails?.wpsId || ''} onChange={(e) => setCompData({...compData, bankDetails: {...compData.bankDetails, wpsId: e.target.value}})} /></Grid>
                        </Grid>
                        </>
                    )}
                  </DialogContent>
                  <DialogActions>
                      <Button onClick={handleCloseEdit}>Cancel</Button>
                      <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveCompensation}>Save Changes</Button>
                  </DialogActions>
              </Dialog>
           </Box>
      )}

      {/* ================= TAB 3: RUN PAYROLL ================= */}
      {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
                <Card elevation={2} sx={{ bgcolor: '#f0f4c3', border: '1px solid #c0ca33' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BoltIcon color="warning" /> Bulk Processing</Typography>
                            <Typography variant="body2" color="textSecondary">Generate <strong>Standard Payroll</strong> (No OT/Deductions).</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField select label="Filter Dept" size="small" sx={{ width: 200, bgcolor: 'white' }} value={bulkDept} onChange={(e) => setBulkDept(e.target.value)}>
                                <MenuItem value="All">All Departments</MenuItem>
                                {availableDepartments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </TextField>
                            <Button variant="contained" color="warning" size="large" onClick={handleBulkRun} disabled={bulkLoading}>
                                {bulkLoading ? 'Processing...' : 'Run Bulk'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
              <Card elevation={3} sx={{ mb: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6"> <CalculateIcon /> Individual Adjustment</Typography>
                      <Box>
                          <TextField select label="Month" size="small" value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} sx={{ mr: 2, width: 120 }}>
                              {[...Array(12)].map((_, i) => <MenuItem key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', {month:'short'})}</MenuItem>)}
                          </TextField>
                          <TextField type="number" label="Year" size="small" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} sx={{ width: 100 }} />
                      </Box>
                  </Box>
                  {msg.content && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.content}</Alert>}
                  <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField select fullWidth label="Select Employee" value={formData.employeeId} onChange={handleEmployeeSelect} size="small" SelectProps={menuPropsSelectEmployee}>
                                {employees.map(emp => <MenuItem key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={3}><TextField type="number" label="Normal OT" name="otNormal" value={formData.otNormal} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} fullWidth/></Grid>
                        <Grid item xs={3}><TextField type="number" label="Night OT" name="otNight" value={formData.otNight} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} fullWidth/></Grid>
                        <Grid item xs={3}><TextField type="number" label="Holiday OT" name="otHoliday" value={formData.otHoliday} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} fullWidth/></Grid>
                        <Grid item xs={3}><TextField type="number" label="Bonus" name="bonus" value={formData.bonus} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} fullWidth/></Grid>
                        <Grid item xs={3}><TextField type="number" label="Arrears" name="arrears" value={formData.arrears} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} fullWidth/></Grid> {/* Added Arrears Input */}
                        <Grid item xs={4}><TextField type="number" label="Unpaid Days" name="unpaidLeaveDays" value={formData.unpaidLeaveDays} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} fullWidth/></Grid>
                        <Grid item xs={4}><TextField type="number" label="Loan Deduct" name="loanDeduction" value={formData.loanDeduction} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} fullWidth/></Grid>
                        <Grid item xs={12}><Button variant="contained" fullWidth size="large" onClick={handleSubmit} disabled={!selectedEmp}>Update Payslip</Button></Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Payroll Register ({new Date(0, formData.month - 1).toLocaleString('en', {month:'long'})} {formData.year})</Typography>
                    <Box>
                        <Button variant="outlined" color="success" startIcon={<DoneAllIcon />} onClick={handleBulkApprove} sx={{ mr: 2 }}>Approve All</Button>
                        <Button variant="contained" color="secondary" startIcon={<FileDownloadIcon />} onClick={handleExportExcel} sx={{ mr: 2 }}>Export Excel</Button> {/* Added Export Button */}
                        <Button variant="contained" color="primary" startIcon={<EmailIcon />} onClick={handleBulkEmail}>Email All</Button>
                    </Box>
                </Box>
                <TableContainer component={Paper} elevation={3}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#eeeeee' }}>
                            <TableRow>
                                <TableCell>Employee</TableCell>
                                <TableCell align="right">Fixed</TableCell>
                                <TableCell align="right">OT/Bonus</TableCell>
                                <TableCell align="right">Deductions</TableCell>
                                <TableCell align="right">Net Salary</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payrolls.length === 0 ? (
                                <TableRow><TableCell colSpan={7} align="center">No payrolls generated for this period. Run bulk processing first.</TableCell></TableRow>
                            ) : (
                                payrolls.map(pay => (
                                    <TableRow key={pay._id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="bold">{pay.employee?.firstName} {pay.employee?.lastName}</Typography>
                                            <Typography variant="caption" color="textSecondary">{pay.employee?.designation}</Typography>
                                        </TableCell>
                                        <TableCell align="right">{formatMoney(pay.basic + pay.housing + pay.transport + pay.otherAllowances)}</TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main' }}>+{formatMoney((pay.totals?.overtime ?? pay.overtime ?? 0) + (pay.totals?.bonus ?? pay.bonus ?? 0) + (pay.totals?.arrears ?? pay.arrears ?? 0))}</TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main' }}>-{formatMoney(pay.totals?.deductions ?? pay.deductions ?? 0)}</TableCell>
                                        <TableCell align="right"><strong>AED {formatMoney(pay.netSalary)}</strong></TableCell>
                                        <TableCell align="center">
                                            <Chip label={pay.status} size="small" color={pay.status === 'Approved' ? 'success' : 'default'} variant={pay.status === 'Approved' ? 'filled' : 'outlined'} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Send Payslip Email"><IconButton size="small" color="secondary" onClick={() => handleEmail(pay)}><EmailIcon /></IconButton></Tooltip>
                                            <Tooltip title="Preview & Approve"><IconButton size="small" color="info" onClick={() => handlePreviewClick(pay)}><VisibilityIcon /></IconButton></Tooltip>
                                            <Tooltip title="Download PDF"><IconButton size="small" onClick={() => generatePDF(pay)}><DownloadIcon /></IconButton></Tooltip>
                                            <Tooltip title="Edit Adjustment"><IconButton size="small" color="warning" onClick={() => handleEditPayrollRecord(pay)}><EditIcon /></IconButton></Tooltip>
                                            <Tooltip title="Delete Record"><IconButton size="small" color="error" onClick={() => handleDeletePayroll(pay._id)}><DeleteIcon /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
          </Grid>
      )}

      {/* GRATUITY DIALOG */}
      <Dialog open={openGratuity} onClose={() => setOpenGratuity(false)} maxWidth="md" fullWidth><DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Box><Typography variant="h6" fontWeight="bold">Gratuity Liability Audit</Typography><Typography variant="caption" color="textSecondary">As of {new Date().toLocaleDateString()} (Projected Resignation)</Typography></Box><Chip label={`Total Liability: AED ${formatMoney(analytics.totalGratuityLiability)}`} color="warning" sx={{ fontWeight: 'bold' }} /></DialogTitle><DialogContent dividers><TableContainer><Table size="small"><TableHead sx={{ bgcolor: '#fff3e0' }}><TableRow><TableCell><strong>Employee</strong></TableCell><TableCell><strong>Joining Date</strong></TableCell><TableCell><strong>Tenure</strong></TableCell><TableCell align="right"><strong>Basic Salary</strong></TableCell><TableCell align="center"><strong>Status</strong></TableCell><TableCell align="right"><strong>Accrued Amount</strong></TableCell></TableRow></TableHead><TableBody>{gratuityList.map((emp) => (<TableRow key={emp._id}><TableCell>{emp.firstName} {emp.lastName}</TableCell><TableCell>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</TableCell><TableCell>{emp.gratuity.tenure.toFixed(1)} Years</TableCell><TableCell align="right">{formatMoney(emp.salaryDetails?.basic || 0)}</TableCell><TableCell align="center">{emp.gratuity.eligible ? <Chip label="Eligible" color="success" size="small" /> : <Chip label="< 1 Year" size="small" variant="outlined" />}</TableCell><TableCell align="right" sx={{ fontWeight: 'bold', color: emp.gratuity.eligible ? 'text.primary' : 'text.disabled' }}>{formatMoney(emp.gratuity.amount)}</TableCell></TableRow>))}</TableBody></Table></TableContainer></DialogContent><DialogActions><Button onClick={() => setOpenGratuity(false)}>Close</Button></DialogActions></Dialog>

      {/* UPDATED PREVIEW MODAL (T-SHAPE LAYOUT with GRID) */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
              <Box>
                  <Typography variant="h6" fontWeight="bold">Payslip Preview: {previewData?.employee?.firstName} {previewData?.employee?.lastName}</Typography>
                  <Typography variant="caption" color="textSecondary">Period: {new Date(0, (previewData?.month || 1) - 1).toLocaleString('en', {month:'long'})} {previewData?.year}</Typography>
              </Box>
              <Chip label={previewData?.status} color={previewData?.status === 'Approved' ? 'success' : 'default'} />
          </DialogTitle>
          <DialogContent sx={{ bgcolor: '#f4f6f8', p: 3 }}>
              {previewData && (
                  <Box>
                        {/* Calculation Logic (Hidden) */}
                        {(() => {
                           const safeVal = (v) => v || 0;
                           const basic = safeVal(previewData.basic);
                           const hourly = basic / 240;
                           const normRate = hourly * 1.25; const nightRate = hourly * 1.50; const holRate = hourly * 1.50;
                           const otNormal = safeVal(previewData.inputData?.overtimeNormalHours);
                           const otNight = safeVal(previewData.inputData?.overtimeNightHours);
                           const otHoliday = safeVal(previewData.inputData?.overtimeHolidayHours);
                           const bonus = safeVal(previewData.totals?.bonus || previewData.bonus);
                           const arrears = safeVal(previewData.totals?.arrears || previewData.inputData?.arrearsAmount); 
                           const otNormalAmt = otNormal * normRate;
                           const otNightAmt = otNight * nightRate;
                           const otHolidayAmt = otHoliday * holRate;
                           const gross = basic + safeVal(previewData.housing) + safeVal(previewData.transport) + safeVal(previewData.otherAllowances);
                           const daily = gross / 30;
                           const unpaidDays = safeVal(previewData.inputData?.unpaidLeaveDays);
                           const unpaidAmt = unpaidDays * daily;
                           const loan = safeVal(previewData.inputData?.loanDeductionAmount);
                           const totalDed = safeVal(previewData.totals?.deductions || previewData.deductions);
                           const otherDed = totalDed - unpaidAmt - loan;
                           
                           return (
                               <Box>
                               <Grid container spacing={2}>
                                   {/* 1. TOP SECTION: FIXED EARNINGS (FULL WIDTH) */}
                                   <Grid item xs={12}>
                                        <Paper elevation={0} sx={{ border: '1px solid #bbdefb', overflow: 'hidden' }}>
                                            <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderBottom: '1px solid #bbdefb' }}>
                                                <Typography variant="subtitle1" fontWeight="bold" color="#1565c0">FIXED EARNINGS</Typography>
                                            </Box>
                                            <Table size="small">
                                                <TableBody>
                                                    <TableRow><TableCell>Basic Salary</TableCell><TableCell align="right">{formatMoney(basic)}</TableCell></TableRow>
                                                    <TableRow><TableCell>Housing Allowance</TableCell><TableCell align="right">{formatMoney(previewData.housing)}</TableCell></TableRow>
                                                    <TableRow><TableCell>Transport Allowance</TableCell><TableCell align="right">{formatMoney(previewData.transport)}</TableCell></TableRow>
                                                    <TableRow><TableCell>Other Allowances</TableCell><TableCell align="right">{formatMoney(previewData.otherAllowances)}</TableCell></TableRow>
                                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                                        <TableCell><strong>Total Fixed</strong></TableCell>
                                                        <TableCell align="right"><strong>{formatMoney(gross)}</strong></TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                   </Grid>

                                   {/* 2. MIDDLE SECTION: SPLIT 50/50 (ADDITIONS | DEDUCTIONS) */}
                                   {/* LEFT: ADDITIONS */}
                                   <Grid item xs={12} md={6}>
                                        <Paper elevation={0} sx={{ border: '1px solid #c8e6c9', height: '100%', overflow: 'hidden' }}>
                                            <Box sx={{ bgcolor: '#e8f5e9', p: 1.5, borderBottom: '1px solid #c8e6c9' }}>
                                                <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32">ADDITIONS / OVERTIME DETAILS</Typography>
                                            </Box>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: '#f1f8e9' }}>
                                                    <TableRow>
                                                        <TableCell>Type</TableCell><TableCell align="center">Hours</TableCell><TableCell align="right">Rate</TableCell><TableCell align="right">Amount</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow><TableCell>Normal Overtime (1.25x)</TableCell><TableCell align="center">{otNormal || '-'}</TableCell><TableCell align="right">{formatMoney(normRate)}</TableCell><TableCell align="right">{formatMoney(otNormalAmt)}</TableCell></TableRow>
                                                    <TableRow><TableCell>Night Overtime (1.50x)</TableCell><TableCell align="center">{otNight || '-'}</TableCell><TableCell align="right">{formatMoney(nightRate)}</TableCell><TableCell align="right">{formatMoney(otNightAmt)}</TableCell></TableRow>
                                                    <TableRow><TableCell>Holiday Overtime (1.50x)</TableCell><TableCell align="center">{otHoliday || '-'}</TableCell><TableCell align="right">{formatMoney(holRate)}</TableCell><TableCell align="right">{formatMoney(otHolidayAmt)}</TableCell></TableRow>
                                                    <TableRow><TableCell colSpan={3}>Bonus / Commission</TableCell><TableCell align="right">{formatMoney(bonus)}</TableCell></TableRow>
                                                    <TableRow><TableCell colSpan={3}>Arrears / Retro Pay</TableCell><TableCell align="right">{formatMoney(arrears)}</TableCell></TableRow>
                                                    <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                                                        <TableCell colSpan={3}><strong>Total Additions</strong></TableCell>
                                                        <TableCell align="right" sx={{ color: '#2e7d32' }}><strong>{formatMoney(otNormalAmt + otNightAmt + otHolidayAmt + bonus + arrears)}</strong></TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                   </Grid>

                                   {/* RIGHT: DEDUCTIONS */}
                                   <Grid item xs={12} md={6}>
                                        <Paper elevation={0} sx={{ border: '1px solid #ffcdd2', height: '100%', overflow: 'hidden' }}>
                                            <Box sx={{ bgcolor: '#ffebee', p: 1.5, borderBottom: '1px solid #ffcdd2' }}>
                                                <Typography variant="subtitle1" fontWeight="bold" color="#c62828">DEDUCTIONS</Typography>
                                            </Box>
                                            <Table size="small">
                                                <TableBody>
                                                    <TableRow><TableCell>Unpaid Leave ({unpaidDays})</TableCell><TableCell align="right">{formatMoney(unpaidAmt)}</TableCell></TableRow>
                                                    <TableRow><TableCell>Loan Repayment</TableCell><TableCell align="right">{formatMoney(loan)}</TableCell></TableRow>
                                                    <TableRow><TableCell>Other / Lateness</TableCell><TableCell align="right">{formatMoney(otherDed)}</TableCell></TableRow>
                                                    <TableRow sx={{ bgcolor: '#ffebee' }}>
                                                        <TableCell><strong>Total Deductions</strong></TableCell>
                                                        <TableCell align="right" sx={{ color: '#c62828' }}><strong>({formatMoney(totalDed)})</strong></TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Paper>
                                   </Grid>
                                   
                                   {/* 3. BOTTOM SECTION: NET PAY (FULL WIDTH) */}
                                   <Grid item xs={12}>
                                       <Paper elevation={3} sx={{ bgcolor: '#388e3c', color: 'white', p: 2, textAlign: 'center', borderRadius: 1 }}>
                                            <Typography variant="h4" fontWeight="bold">NET PAYABLE: AED {formatMoney(previewData.netSalary)}</Typography>
                                       </Paper>
                                   </Grid>
                               </Grid>

                               {/* 4. AUDIT FOOTER */}
                               <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                                   <Grid container spacing={2}>
                                       <Grid item xs={6}>
                                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                               <HistoryEduIcon fontSize="small" color="action" />
                                               <Typography variant="caption" fontWeight="bold" color="textSecondary">GENERATED BY</Typography>
                                           </Box>
                                           <Typography variant="body2">
                                               {previewData.generatedBy?.firstName || 'System'} {previewData.generatedBy?.lastName || ''}
                                           </Typography>
                                           <Typography variant="caption" color="textSecondary">
                                               {new Date(previewData.createdAt || Date.now()).toLocaleString()}
                                           </Typography>
                                       </Grid>
                                       <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                           <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" sx={{ mb: 0.5 }}>APPROVED BY</Typography>
                                           <Typography variant="body2" sx={{ color: previewData.approvedBy ? 'success.main' : 'text.secondary' }}>
                                               {previewData.approvedBy ? `${previewData.approvedBy.firstName} ${previewData.approvedBy.lastName}` : 'Pending Approval'}
                                           </Typography>
                                            {previewData.approvedAt && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {new Date(previewData.approvedAt).toLocaleString()}
                                                </Typography>
                                            )}
                                       </Grid>
                                   </Grid>
                               </Box>
                               </Box>
                           );
                        })()}
                  </Box>
              )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #eee' }}>
              <Button onClick={() => setOpenPreview(false)} sx={{ mr: 'auto' }}>Close</Button>
              <Button startIcon={<DownloadIcon />} variant="outlined" onClick={() => generatePDF(previewData)}>Download PDF</Button>
              {previewData?.status === 'Draft' && (
                  <Button startIcon={<CheckCircleIcon />} variant="contained" color="success" onClick={() => handleApprove(previewData._id)}>Approve</Button>
              )}
          </DialogActions>
      </Dialog>
    </Box>
  );
}