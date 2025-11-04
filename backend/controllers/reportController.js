// =============================================
// Report Controller
// Handles all report-related operations
// Database: myapp
// =============================================

const db = require('../config/db');

// @desc    Get all reports with details
// @route   GET /api/reports
// @access  Public
exports.getAllReports = async (req, res, next) => {
    try {
        const { status, categoryId, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                r.ReportID,
                r.Description,
                r.Timestamp,
                r.Status,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                u.CampusDept AS ReporterDepartment,
                u.OptionalContact AS ReporterContact,
                c.Name AS CategoryName,
                c.Role AS CategoryRole,
                c.ContactInfo AS CategoryContact,
                (SELECT COUNT(*) FROM actionstaken a WHERE a.reportid = r.ReportID) AS ActionCount
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            JOIN categories c ON r.CategoryID = c.CategoryID
            WHERE 1=1
        `;
        
        const params = [];
        
        // Add filters
        if (status) {
            query += ' AND r.Status = ?';
            params.push(status);
        }
        
        if (categoryId) {
            query += ' AND r.CategoryID = ?';
            params.push(parseInt(categoryId));
        }
        
        query += ' ORDER BY r.Timestamp DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [reports] = await db.query(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) AS total FROM reports WHERE 1=1';
        const countParams = [];
        
        if (status) {
            countQuery += ' AND Status = ?';
            countParams.push(status);
        }
        
        if (categoryId) {
            countQuery += ' AND CategoryID = ?';
            countParams.push(parseInt(categoryId));
        }
        
        const [[{ total }]] = await db.query(countQuery, countParams);
        
        res.status(200).json({
            status: 'success',
            results: reports.length,
            total: total,
            data: reports
        });
    } catch (error) {
        console.error('Error in getAllReports:', error);
        next(error);
    }
};

// @desc    Get single report by ID with full details
// @route   GET /api/reports/:id
// @access  Public
exports.getReportById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Get report details
        const [reports] = await db.query(`
            SELECT 
                r.*,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                u.CampusDept AS ReporterDepartment,
                u.OptionalContact AS ReporterContact,
                c.Name AS CategoryName,
                c.Role AS CategoryRole,
                c.ContactInfo AS CategoryContact
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            JOIN categories c ON r.CategoryID = c.CategoryID
            WHERE r.ReportID = ?
        `, [id]);
        
        if (reports.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }
        
        // Get actions for this report
        const [actions] = await db.query(`
            SELECT 
                a.*,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole,
                resp.ContactInfo AS ResponderContact
            FROM actionstaken a
            JOIN responders resp ON a.responderid = resp.ResponderID
            WHERE a.reportid = ?
            ORDER BY a.timestamp DESC
        `, [id]);
        
        const report = {
            ...reports[0],
            actions: actions
        };
        
        res.status(200).json({
            status: 'success',
            data: report
        });
    } catch (error) {
        console.error('Error in getReportById:', error);
        next(error);
    }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Public
exports.createReport = async (req, res, next) => {
    try {
        const {
            categoryId,
            userId,
            description,
            isAnonymous
        } = req.body;
        
        // Validation
        if (!categoryId || !description) {
            return res.status(400).json({
                status: 'error',
                message: 'CategoryID and Description are required'
            });
        }
        
        // Check if category exists
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE CategoryID = ?',
            [categoryId]
        );
        
        if (categories.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }
        
        // If not anonymous, check if user exists or create one
        let finalUserId = null;
        
        if (!isAnonymous && userId) {
            const [users] = await db.query(
                'SELECT * FROM users WHERE UserID = ?',
                [userId]
            );
            
            if (users.length > 0) {
                finalUserId = userId;
            }
        }
        
        // Insert report
        const [result] = await db.query(`
            INSERT INTO reports (CategoryID, UserID, Description, Timestamp, Status)
            VALUES (?, ?, ?, NOW(), 'Pending')
        `, [categoryId, finalUserId, description]);
        
        // Get the created report
        const [newReport] = await db.query(`
            SELECT 
                r.*,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                c.Name AS CategoryName
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            JOIN categories c ON r.CategoryID = c.CategoryID
            WHERE r.ReportID = ?
        `, [result.insertId]);
        
        res.status(201).json({
            status: 'success',
            message: 'Report created successfully',
            data: newReport[0]
        });
    } catch (error) {
        console.error('Error in createReport:', error);
        next(error);
    }
};

// @desc    Update report status
// @route   PUT /api/reports/:id
// @access  Protected (Responders)
exports.updateReportStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        // Check if report exists and get current status
        const [reports] = await db.query(
            'SELECT * FROM reports WHERE ReportID = ?',
            [id]
        );
        
        if (reports.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }
        
        const oldStatus = reports[0].Status;
        const responderId = reports[0].ResponderID;
        
        // Update status and set ResolvedAt timestamp if resolving
        let updateQuery = 'UPDATE reports SET Status = ?';
        const updateParams = [status];
        
        if (status === 'Resolved' && oldStatus !== 'Resolved') {
            updateQuery += ', ResolvedAt = NOW()';
        }
        
        updateQuery += ' WHERE ReportID = ?';
        updateParams.push(id);
        
        await db.query(updateQuery, updateParams);
        
        // If transitioning to Resolved status, increment TotalResolved for the responder
        if (status === 'Resolved' && oldStatus !== 'Resolved' && responderId) {
            await db.query(
                'UPDATE responders SET TotalResolved = TotalResolved + 1 WHERE ResponderID = ?',
                [responderId]
            );
        }
        
        // Get updated report
        const [updatedReport] = await db.query(`
            SELECT 
                r.*,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                c.Name AS CategoryName
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            JOIN categories c ON r.CategoryID = c.CategoryID
            WHERE r.ReportID = ?
        `, [id]);
        
        res.status(200).json({
            status: 'success',
            message: 'Report status updated successfully',
            data: updatedReport[0]
        });
    } catch (error) {
        console.error('Error in updateReportStatus:', error);
        next(error);
    }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Protected (Admin)
exports.deleteReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Check if report exists
        const [reports] = await db.query(
            'SELECT * FROM reports WHERE ReportID = ?',
            [id]
        );
        
        if (reports.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }
        
        // Delete associated actions first
        await db.query('DELETE FROM actionstaken WHERE reportid = ?', [id]);
        
        // Delete report
        await db.query('DELETE FROM reports WHERE ReportID = ?', [id]);
        
        res.status(200).json({
            status: 'success',
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteReport:', error);
        next(error);
    }
};

// @desc    Get reports by status
// @route   GET /api/reports/status/:status
// @access  Public
exports.getReportsByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;
        
        const [reports] = await db.query(`
            SELECT 
                r.*,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                c.Name AS CategoryName,
                (SELECT COUNT(*) FROM actionstaken a WHERE a.reportid = r.ReportID) AS ActionCount
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            JOIN categories c ON r.CategoryID = c.CategoryID
            WHERE r.Status = ?
            ORDER BY r.Timestamp DESC
        `, [status]);
        
        res.status(200).json({
            status: 'success',
            results: reports.length,
            data: reports
        });
    } catch (error) {
        console.error('Error in getReportsByStatus:', error);
        next(error);
    }
};

// @desc    Get statistics
// @route   GET /api/reports/stats
// @access  Public
exports.getReportStats = async (req, res, next) => {
    try {
        // Get total reports by status
        const [statusStats] = await db.query(`
            SELECT Status, COUNT(*) as count
            FROM reports
            GROUP BY Status
        `);
        
        // Get total reports by category
        const [categoryStats] = await db.query(`
            SELECT c.Name, COUNT(r.ReportID) as count
            FROM categories c
            LEFT JOIN reports r ON c.CategoryID = r.CategoryID
            GROUP BY c.CategoryID
        `);
        
        // Get total counts
        const [[totals]] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM reports) as totalReports,
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM responders) as totalResponders,
                (SELECT COUNT(*) FROM actionstaken) as totalActions
        `);
        
        res.status(200).json({
            status: 'success',
            data: {
                totals,
                byStatus: statusStats,
                byCategory: categoryStats
            }
        });
    } catch (error) {
        console.error('Error in getReportStats:', error);
        next(error);
    }
};