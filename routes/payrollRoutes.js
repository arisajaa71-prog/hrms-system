const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const User = require('../models/User'); // <--- FIXED: Added this import so populate works!

// Helper to safely get User ID
const getUserId = (req) => {
    if (req.user && req.user.id) return req.user.id;
    if (req.user && req.user._id) return req.user._id; 
    return null; 
};

// 1. GENERATE / UPDATE PAYROLL (Individual Adjustment)
router.post('/generate', auth, async (req, res) => {
    try {
        const { employeeId, overtimeHours, bonus, deductions } = req.body;
        const month = parseInt(req.body.month);
        const year = parseInt(req.body.year);
        
        const emp = await Employee.findById(employeeId);
        if(!emp) return res.status(404).json({ msg: 'Employee not found' });

        const basic = emp.salaryDetails?.basic || 0;
        const housing = emp.salaryDetails?.housing || 0;
        const transport = emp.salaryDetails?.transport || 0;
        const other = emp.salaryDetails?.other || 0;
        const fixedGross = basic + housing + transport + other;
        
        const hourlyRate = basic / 240;
        const otAmount = (overtimeHours.normal * hourlyRate * 1.25) + 
                         (overtimeHours.night * hourlyRate * 1.50) + 
                         (overtimeHours.holiday * hourlyRate * 1.50);

        const dailyGross = fixedGross / 30;
        const unpaidAmount = deductions.unpaidLeaveDays * dailyGross;
        const totalDeductions = unpaidAmount + deductions.loan + (deductions.other || 0);

        const netSalary = (fixedGross + otAmount + bonus) - totalDeductions;

        const payrollData = {
            employee: employeeId, month, year,
            basic, housing, transport, otherAllowances: other,
            inputData: {
                overtimeNormalHours: overtimeHours.normal,
                overtimeNightHours: overtimeHours.night,
                overtimeHolidayHours: overtimeHours.holiday,
                unpaidLeaveDays: deductions.unpaidLeaveDays,
                loanDeductionAmount: deductions.loan
            },
            totals: {
                overtime: otAmount, bonus: bonus,
                deductions: totalDeductions, gross: fixedGross
            },
            netSalary,
            status: 'Draft',
            generatedBy: getUserId(req)
        };

        await Payroll.findOneAndUpdate(
            { employee: employeeId, month, year },
            payrollData,
            { upsert: true, new: true }
        );

        res.json({ msg: 'Payslip Updated' });
    } catch (err) { 
        console.error("Generate Error:", err);
        res.status(500).send('Server Error'); 
    }
});

// 2. BULK GENERATE (CLEAN SLATE METHOD)
router.post('/bulk-generate', auth, async (req, res) => {
    try {
        const { department } = req.body;
        const month = parseInt(req.body.month);
        const year = parseInt(req.body.year);

        console.log(`Processing Bulk: Dept=${department}, Month=${month}, Year=${year}`);

        const query = department === 'All' ? {} : { department };
        query.role = { $ne: 'Owner' };
        const employees = await Employee.find(query);
        
        if (employees.length === 0) return res.json({ msg: 'No employees found.' });

        // Clear existing drafts to avoid duplicates/ghosts
        await Payroll.deleteMany({ month, year, status: 'Draft' });
        
        const userId = getUserId(req);

        const newPayrolls = employees.map(emp => {
            const basic = emp.salaryDetails?.basic || 0;
            const housing = emp.salaryDetails?.housing || 0;
            const transport = emp.salaryDetails?.transport || 0;
            const other = emp.salaryDetails?.other || 0;
            const net = basic + housing + transport + other;

            return {
                employee: emp._id,
                month,
                year,
                basic, housing, transport, otherAllowances: other,
                inputData: { overtimeNormalHours: 0, overtimeNightHours: 0, overtimeHolidayHours: 0, unpaidLeaveDays: 0, loanDeductionAmount: 0 },
                totals: { overtime: 0, bonus: 0, deductions: 0, gross: net },
                netSalary: net,
                status: 'Draft',
                generatedBy: userId
            };
        });

        if (newPayrolls.length > 0) {
            await Payroll.insertMany(newPayrolls);
            console.log(`Created ${newPayrolls.length} new records.`);
        }
        
        res.json({ msg: `Processed for ${employees.length} employees` });
    } catch (err) { 
        console.error("Bulk Generate Error:", err);
        res.status(500).send('Server Error'); 
    }
});

// 3. GET LIST
router.get('/list', auth, async (req, res) => {
    try {
        const month = parseInt(req.query.month);
        const year = parseInt(req.query.year);

        console.log(`Fetching List: Month=${month}, Year=${year}`);

        const payrolls = await Payroll.find({ month, year })
            .populate('employee', 'firstName lastName department designation employeeId bankDetails salaryDetails')
            .populate('generatedBy', 'firstName lastName') // Needs User model to be registered!
            .populate('approvedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
            
        console.log(`Found ${payrolls.length} records.`);
        res.json(payrolls);
    } catch (err) { 
        console.error("Get List Error:", err);
        res.status(500).send('Server Error'); 
    }
});

// 4. APPROVE SINGLE
router.put('/approve/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Owner' && req.user.role !== 'Senior Admin') return res.status(403).json({msg: 'Not Authorized'});
        
        await Payroll.findByIdAndUpdate(req.params.id, { 
            status: 'Approved',
            approvedBy: getUserId(req),
            approvedAt: new Date()
        });
        res.json({ msg: 'Approved' });
    } catch(err) { res.status(500).send('Server Error'); }
});

// 5. BULK APPROVE
router.put('/approve-all', auth, async (req, res) => {
    try {
        const month = parseInt(req.body.month);
        const year = parseInt(req.body.year);

        if (req.user.role !== 'Owner' && req.user.role !== 'Senior Admin') return res.status(403).json({msg: 'Not Authorized'});
        
        await Payroll.updateMany({ month, year }, { 
            status: 'Approved',
            approvedBy: getUserId(req),
            approvedAt: new Date()
        });
        res.json({ msg: 'All Approved' });
    } catch(err) { res.status(500).send('Server Error'); }
});

// 6. DELETE PAYROLL
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Owner' && req.user.role !== 'Senior Admin') return res.status(403).json({msg: 'Not Authorized'});
        await Payroll.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Payroll Deleted' });
    } catch(err) { res.status(500).send('Server Error'); }
});

module.exports = router;