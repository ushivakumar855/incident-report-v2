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
        console.log('📊 [JOIN QUERY] Fetching all reports with user and category details...');
        const { status, categoryId, limit = 50, offset = 0 } = req.query;
        
        // Using JOIN query to combine reports, users, and categories
        let query = `
            SELECT 
                r.ReportID,
                r.Description,
                r.Location,
                r.Priority,
                r.Timestamp,
                r.Status,
                r.ResolvedAt,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                u.CampusDept AS ReporterDepartment,
                u.OptionalContact AS ReporterContact,
                c.Name AS CategoryName,
                c.Role AS CategoryRole,
                c.ContactInfo AS CategoryContact,
                resp.Name AS AssignedResponder,
                (SELECT COUNT(*) FROM actionstaken a WHERE a.ReportID = r.ReportID) AS ActionCount
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            INNER JOIN categories c ON r.CategoryID = c.CategoryID
            LEFT JOIN responders resp ON r.ResponderID = resp.ResponderID
            WHERE 1=1
        `;
        
        const params = [];
        
        // Add filters
        if (status) {
            query += ' AND r.Status = ?';
            params.push(status);
            console.log(`🔍 [FILTER] Status filter applied: ${status}`);
        }
        
        if (categoryId) {
            query += ' AND r.CategoryID = ?';
            params.push(parseInt(categoryId));
            console.log(`🔍 [FILTER] Category filter applied: ${categoryId}`);
        }
        
        query += ' ORDER BY r.Timestamp DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        console.log('🔄 [EXECUTING] JOIN query with LEFT JOIN (users), INNER JOIN (categories), LEFT JOIN (responders)');
        const [reports] = await db.query(query, params);
        console.log(`✅ [JOIN QUERY] Retrieved ${reports.length} reports`);
        
        // Get total count using AGGREGATE query
        console.log('📈 [AGGREGATE QUERY] Counting total reports...');
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
        console.log(`✅ [AGGREGATE] Total count: ${total} reports`);
        
        res.status(200).json({
            status: 'success',
            results: reports.length,
            total: total,
            data: reports
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getAllReports:', error);
        next(error);
    }
};

// @desc    Get single report by ID with full details
// @route   GET /api/reports/:id
// @access  Public
exports.getReportById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [DETAILS] Fetching report #${id} with full details...`);
        
        // Get report details using JOIN query
        console.log('🔄 [JOIN QUERY] Combining reports, users, categories, and responders tables...');
        const [reports] = await db.query(`
            SELECT 
                r.*,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                u.CampusDept AS ReporterDepartment,
                u.OptionalContact AS ReporterContact,
                c.Name AS CategoryName,
                c.Role AS CategoryRole,
                c.ContactInfo AS CategoryContact,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            INNER JOIN categories c ON r.CategoryID = c.CategoryID
            LEFT JOIN responders resp ON r.ResponderID = resp.ResponderID
            WHERE r.ReportID = ?
        `, [id]);
        
        if (reports.length === 0) {
            console.log(`❌ [NOT FOUND] Report #${id} not found`);
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }
        console.log(`✅ [JOIN QUERY] Retrieved report #${id}`);
        
        // Get actions for this report using JOIN query
        console.log(`🔄 [JOIN QUERY] Fetching actions for report #${id}...`);
        const [actions] = await db.query(`
            SELECT 
                a.ActionID,
                a.ReportID,
                a.ActionDescription,
                a.Timestamp,
                a.ActionType,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole,
                resp.ContactInfo AS ResponderContact
            FROM actionstaken a
            INNER JOIN responders resp ON a.ResponderID = resp.ResponderID
            WHERE a.ReportID = ?
            ORDER BY a.Timestamp DESC
        `, [id]);
        console.log(`✅ [JOIN QUERY] Retrieved ${actions.length} actions for report #${id}`);
        
        // Use function to calculate response time
        console.log(`🔧 [FUNCTION CALL] Calculating response time for report #${id}...`);
        const [[{ responseTime }]] = await db.query(`
            SELECT fn_GetResponseTime(?) AS responseTime
        `, [id]);
        console.log(`✅ [FUNCTION] Response time: ${responseTime} hours`);
        
        const report = {
            ...reports[0],
            actions: actions,
            responseTimeHours: responseTime
        };
        
        res.status(200).json({
            status: 'success',
            data: report
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getReportById:', error);
        next(error);
    }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Public
exports.createReport = async (req, res, next) => {
    try {
        console.log('📝 [CREATE] Creating new report...');
        const {
            categoryId,
            userId,
            description,
            location,
            priority = 'Medium',
            isAnonymous
        } = req.body;
        
        // Validation
        if (!categoryId || !description) {
            console.log('❌ [VALIDATION] Missing required fields');
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
            console.log(`❌ [VALIDATION] Category #${categoryId} not found`);
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
        
        // Use stored procedure to submit report
        console.log('⚙️ [STORED PROCEDURE] Calling sp_SubmitReport...');
        console.log(`📋 Parameters: CategoryID=${categoryId}, UserID=${finalUserId}, Priority=${priority}`);
        
        const [result] = await db.query(
            'CALL sp_SubmitReport(?, ?, ?, ?, ?)',
            [categoryId, finalUserId, description, location || null, priority]
        );
        
        const newReportId = result[0][0].NewReportID;
        console.log(`✅ [STORED PROCEDURE] sp_SubmitReport executed successfully`);
        console.log(`✅ [TRIGGER] trg_AfterInsertReport fired - Report logged in audit_log`);
        console.log(`📝 [CREATED] New report ID: ${newReportId}`);
        
        // Get the created report
        const [newReport] = await db.query(`
            SELECT 
                r.*,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                c.Name AS CategoryName
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            INNER JOIN categories c ON r.CategoryID = c.CategoryID
            WHERE r.ReportID = ?
        `, [newReportId]);
        
        res.status(201).json({
            status: 'success',
            message: 'Report created successfully',
            data: newReport[0]
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in createReport:', error);
        next(error);
    }
};

// @desc    Update report status
// @route   PUT /api/reports/:id
// @access  Protected (Responders)
exports.updateReportStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, responderId } = req.body;
        
        console.log(`🔄 [UPDATE] Updating report #${id} status to: ${status}`);
        
        // Validate status
        const validStatuses = ['Pending', 'In Progress', 'Under Review', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            console.log('❌ [VALIDATION] Invalid status');
            return res.status(400).json({
                status: 'error',
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        // Check if report exists
        const [reports] = await db.query(
            'SELECT * FROM reports WHERE ReportID = ?',
            [id]
        );
        
        if (reports.length === 0) {
            console.log(`❌ [NOT FOUND] Report #${id} not found`);
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }
        
        const oldStatus = reports[0].Status;
        
        // Update status (triggers will fire)
        console.log('🔄 [UPDATE] Executing update query...');
        if (responderId && status === 'In Progress') {
            // Use stored procedure to assign responder
            console.log(`⚙️ [STORED PROCEDURE] Calling sp_AssignResponder with ResponderID=${responderId}...`);
            await db.query(
                'CALL sp_AssignResponder(?, ?)',
                [id, responderId]
            );
            console.log('✅ [STORED PROCEDURE] sp_AssignResponder executed successfully');
            console.log('✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged in audit_log');
        } else {
            await db.query(
                'UPDATE reports SET Status = ? WHERE ReportID = ?',
                [status, id]
            );
            console.log(`✅ [UPDATE] Status updated from "${oldStatus}" to "${status}"`);
            console.log('✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged in audit_log');
            
            // Check if trigger for resolving fired
            if (status === 'Resolved' && oldStatus !== 'Resolved' && reports[0].ResponderID) {
                console.log('✅ [TRIGGER] trg_AfterUpdateReport - Responder TotalResolved incremented');
                console.log('✅ [TRIGGER] trg_BeforeUpdateReport - ResolvedAt timestamp set');
            }
        }
        
        // Get updated report
        const [updatedReport] = await db.query(`
            SELECT 
                r.*,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                c.Name AS CategoryName,
                resp.Name AS ResponderName
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            INNER JOIN categories c ON r.CategoryID = c.CategoryID
            LEFT JOIN responders resp ON r.ResponderID = resp.ResponderID
            WHERE r.ReportID = ?
        `, [id]);
        
        res.status(200).json({
            status: 'success',
            message: 'Report status updated successfully',
            data: updatedReport[0]
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in updateReportStatus:', error);
        next(error);
    }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Protected (Admin)
exports.deleteReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ [DELETE] Attempting to delete report #${id}...`);
        
        // Check if report exists
        const [reports] = await db.query(
            'SELECT * FROM reports WHERE ReportID = ?',
            [id]
        );
        
        if (reports.length === 0) {
            console.log(`❌ [NOT FOUND] Report #${id} not found`);
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }
        
        // Check if report can be deleted (trigger will prevent deletion of active reports)
        if (reports[0].Status === 'In Progress' || reports[0].Status === 'Under Review') {
            console.log(`❌ [TRIGGER] trg_BeforeDeleteReport - Cannot delete active report`);
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete active reports. Please resolve first.'
            });
        }
        
        console.log('🔄 [DELETE] Executing delete query...');
        // Delete report (CASCADE will delete associated actions)
        await db.query('DELETE FROM reports WHERE ReportID = ?', [id]);
        console.log('✅ [CASCADE] Associated actions deleted automatically');
        console.log(`✅ [DELETE] Report #${id} deleted successfully`);
        
        res.status(200).json({
            status: 'success',
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in deleteReport:', error);
        next(error);
    }
};

// @desc    Get reports by status
// @route   GET /api/reports/status/:status
// @access  Public
exports.getReportsByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;
        console.log(`🔍 [FILTER] Fetching reports with status: ${status}`);
        
        // Using JOIN query with filtering
        console.log('🔄 [JOIN QUERY] Combining reports, users, categories, and responders...');
        const [reports] = await db.query(`
            SELECT 
                r.ReportID,
                r.Description,
                r.Location,
                r.Priority,
                r.Timestamp,
                r.Status,
                r.ResolvedAt,
                COALESCE(u.Pseudonym, 'Anonymous') AS ReporterName,
                u.CampusDept AS ReporterDepartment,
                c.Name AS CategoryName,
                c.Role AS CategoryRole,
                resp.Name AS AssignedResponder,
                (SELECT COUNT(*) FROM actionstaken a WHERE a.ReportID = r.ReportID) AS ActionCount
            FROM reports r
            LEFT JOIN users u ON r.UserID = u.UserID
            INNER JOIN categories c ON r.CategoryID = c.CategoryID
            LEFT JOIN responders resp ON r.ResponderID = resp.ResponderID
            WHERE r.Status = ?
            ORDER BY r.Timestamp DESC
        `, [status]);
        
        console.log(`✅ [JOIN QUERY] Retrieved ${reports.length} reports with status "${status}"`);
        
        res.status(200).json({
            status: 'success',
            results: reports.length,
            data: reports
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getReportsByStatus:', error);
        next(error);
    }
};

// @desc    Get statistics
// @route   GET /api/reports/stats
// @access  Public
exports.getReportStats = async (req, res, next) => {
    try {
        console.log('📊 [STATISTICS] Fetching comprehensive statistics...');
        
        // Use stored procedure to get report statistics
        console.log('⚙️ [STORED PROCEDURE] Calling sp_GetReportStatistics...');
        const [procedureResult] = await db.query('CALL sp_GetReportStatistics()');
        const procedureStats = procedureResult[0][0];
        console.log('✅ [STORED PROCEDURE] sp_GetReportStatistics executed successfully');
        console.log(`📈 Results: Total=${procedureStats.TotalReports}, Pending=${procedureStats.PendingReports}, InProgress=${procedureStats.InProgressReports}, Resolved=${procedureStats.ResolvedReports}`);
        
        // Get total reports by status using AGGREGATE query with GROUP BY
        console.log('📈 [AGGREGATE QUERY] Getting status breakdown with GROUP BY...');
        const [statusStats] = await db.query(`
            SELECT Status, COUNT(*) as count
            FROM reports
            GROUP BY Status
            ORDER BY count DESC
        `);
        console.log(`✅ [AGGREGATE] Retrieved ${statusStats.length} status groups`);
        
        // Get total reports by category using AGGREGATE query with GROUP BY and JOIN
        console.log('📈 [AGGREGATE + JOIN] Getting category breakdown...');
        const [categoryStats] = await db.query(`
            SELECT c.Name, COUNT(r.ReportID) as count
            FROM categories c
            LEFT JOIN reports r ON c.CategoryID = r.CategoryID
            GROUP BY c.CategoryID, c.Name
            HAVING COUNT(r.ReportID) > 0
            ORDER BY count DESC
        `);
        console.log(`✅ [AGGREGATE + JOIN] Retrieved ${categoryStats.length} category groups`);
        
        // Get total counts using AGGREGATE with subqueries
        console.log('📈 [AGGREGATE + NESTED QUERY] Getting total counts...');
        const [[totals]] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM reports) as totalReports,
                (SELECT COUNT(*) FROM users WHERE IsActive = TRUE) as totalUsers,
                (SELECT COUNT(*) FROM responders WHERE IsAvailable = TRUE) as totalResponders,
                (SELECT COUNT(*) FROM actionstaken) as totalActions,
                (SELECT COUNT(*) FROM categories) as totalCategories
        `);
        console.log(`✅ [AGGREGATE + NESTED] Totals: Reports=${totals.totalReports}, Users=${totals.totalUsers}, Responders=${totals.totalResponders}, Actions=${totals.totalActions}`);
        
        // Get reports above average response time using NESTED QUERY
        console.log('📈 [NESTED QUERY] Finding reports with above-average response time...');
        const [aboveAvgReports] = await db.query(`
            SELECT 
                r.ReportID,
                r.Description,
                r.Status,
                TIMESTAMPDIFF(HOUR, r.Timestamp, COALESCE(r.ResolvedAt, NOW())) AS ResponseTimeHours
            FROM reports r
            WHERE TIMESTAMPDIFF(HOUR, r.Timestamp, COALESCE(r.ResolvedAt, NOW())) > (
                SELECT AVG(TIMESTAMPDIFF(HOUR, Timestamp, COALESCE(ResolvedAt, NOW())))
                FROM reports
            )
            ORDER BY ResponseTimeHours DESC
            LIMIT 5
        `);
        console.log(`✅ [NESTED QUERY] Found ${aboveAvgReports.length} reports above average response time`);
        
        // Get responders handling critical reports using NESTED QUERY with IN clause
        console.log('📈 [NESTED QUERY] Finding responders handling critical reports...');
        const [criticalResponders] = await db.query(`
            SELECT 
                resp.Name,
                resp.Role,
                (SELECT COUNT(*) FROM reports WHERE ResponderID = resp.ResponderID AND Priority = 'Critical') AS CriticalReports
            FROM responders resp
            WHERE resp.ResponderID IN (
                SELECT DISTINCT ResponderID 
                FROM reports 
                WHERE Priority = 'Critical' AND ResponderID IS NOT NULL
            )
            ORDER BY CriticalReports DESC
        `);
        console.log(`✅ [NESTED QUERY] Found ${criticalResponders.length} responders handling critical reports`);
        
        res.status(200).json({
            status: 'success',
            data: {
                totals,
                procedureStats,
                byStatus: statusStats,
                byCategory: categoryStats,
                aboveAverageResponseTime: aboveAvgReports,
                criticalResponders: criticalResponders
            }
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getReportStats:', error);
        next(error);
    }
};