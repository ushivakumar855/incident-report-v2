// =============================================
// Action Controller
// Handles action logging operations
// =============================================

const db = require('../config/db');

// @desc    Get all actions
// @route   GET /api/actions
// @access  Public
exports.getAllActions = async (req, res, next) => {
    try {
        console.log('📋 [ACTIONS] Fetching all actions...');
        console.log('🔄 [JOIN QUERY] Combining actionstaken, responders, and reports tables...');
        const [actions] = await db.query(`
            SELECT 
                a.ActionID,
                a.ReportID,
                a.ActionDescription,
                a.Timestamp,
                a.ActionType,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole,
                rep.Description AS ReportDescription,
                rep.Status AS ReportStatus
            FROM actionstaken a
            INNER JOIN responders resp ON a.ResponderID = resp.ResponderID
            INNER JOIN reports rep ON a.ReportID = rep.ReportID
            ORDER BY a.Timestamp DESC
        `);
        
        console.log(`✅ [JOIN QUERY] Retrieved ${actions.length} actions`);
        
        res.status(200).json({
            status: 'success',
            results: actions.length,
            data: actions
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getAllActions:', error);
        next(error);
    }
};

// @desc    Get actions for specific report
// @route   GET /api/actions/report/:reportId
// @access  Public
exports.getActionsByReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        console.log(`📋 [ACTIONS] Fetching actions for report #${reportId}...`);
        console.log('🔄 [JOIN QUERY] Combining actionstaken and responders tables...');
        
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
        `, [reportId]);
        
        console.log(`✅ [JOIN QUERY] Retrieved ${actions.length} actions for report #${reportId}`);
        
        res.status(200).json({
            status: 'success',
            results: actions.length,
            data: actions
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getActionsByReport:', error);
        next(error);
    }
};

// @desc    Create new action
// @route   POST /api/actions
// @access  Protected (Responders)
exports.createAction = async (req, res, next) => {
    try {
        console.log('📝 [ACTION] Creating new action...');
        const {
            reportId,
            responderId,
            actionDescription,
            actionType = 'Investigation'
        } = req.body;
        
        // Validation
        if (!reportId || !responderId || !actionDescription) {
            console.log('❌ [VALIDATION] Missing required fields');
            return res.status(400).json({
                status: 'error',
                message: 'ReportID, ResponderID, and ActionDescription are required'
            });
        }
        
        // Check if report exists
        const [reports] = await db.query(
            'SELECT * FROM reports WHERE ReportID = ?',
            [reportId]
        );
        
        if (reports.length === 0) {
            console.log(`❌ [VALIDATION] Report #${reportId} not found`);
            return res.status(404).json({
                status: 'error',
                message: 'Report not found'
            });
        }
        
        // Check if responder exists
        const [responders] = await db.query(
            'SELECT * FROM responders WHERE ResponderID = ?',
            [responderId]
        );
        
        if (responders.length === 0) {
            console.log(`❌ [VALIDATION] Responder #${responderId} not found`);
            return res.status(404).json({
                status: 'error',
                message: 'Responder not found'
            });
        }
        
        // Use stored procedure to add action
        console.log('⚙️ [STORED PROCEDURE] Calling sp_AddAction...');
        console.log(`📋 Parameters: ReportID=${reportId}, ResponderID=${responderId}, ActionType=${actionType}`);
        
        await db.query(
            'CALL sp_AddAction(?, ?, ?, ?)',
            [reportId, responderId, actionDescription, actionType]
        );
        
        console.log('✅ [STORED PROCEDURE] sp_AddAction executed successfully');
        console.log('✅ [TRIGGER] trg_AfterInsertAction fired - Action logged in audit_log');
        
        // Update report status to 'In Progress' if it's 'Pending' and assign responder
        if (reports[0].Status === 'Pending') {
            console.log('🔄 [UPDATE] Updating report status to "In Progress" and assigning responder...');
            await db.query(`
                UPDATE reports 
                SET Status = 'In Progress', ResponderID = ?
                WHERE ReportID = ?
            `, [responderId, reportId]);
            console.log('✅ [UPDATE] Report status updated to "In Progress" and responder assigned');
            console.log('✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged');
        } else if (reports[0].ResponderID === null || reports[0].ResponderID === undefined) {
            // If report doesn't have a responder yet, assign the current one
            console.log('🔄 [UPDATE] Assigning responder to report...');
            await db.query(`
                UPDATE reports 
                SET ResponderID = ?
                WHERE ReportID = ?
            `, [responderId, reportId]);
            console.log('✅ [UPDATE] Responder assigned to report');
        }
        
        // Get the created action
        const [newAction] = await db.query(`
            SELECT 
                a.ActionID,
                a.ReportID,
                a.ActionDescription,
                a.Timestamp,
                a.ActionType,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole
            FROM actionstaken a
            INNER JOIN responders resp ON a.ResponderID = resp.ResponderID
            WHERE a.ReportID = ?
            ORDER BY a.Timestamp DESC
            LIMIT 1
        `, [reportId]);
        
        res.status(201).json({
            status: 'success',
            message: 'Action logged successfully',
            data: newAction[0]
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in createAction:', error);
        next(error);
    }
};

// @desc    Get action by ID
// @route   GET /api/actions/:id
// @access  Public
exports.getActionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [ACTION] Fetching action #${id}...`);
        console.log('🔄 [JOIN QUERY] Combining actionstaken, responders, and reports tables...');
        
        const [actions] = await db.query(`
            SELECT 
                a.ActionID,
                a.ReportID,
                a.ActionDescription,
                a.Timestamp,
                a.ActionType,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole,
                resp.ContactInfo AS ResponderContact,
                rep.Description AS ReportDescription
            FROM actionstaken a
            INNER JOIN responders resp ON a.ResponderID = resp.ResponderID
            INNER JOIN reports rep ON a.ReportID = rep.ReportID
            WHERE a.ActionID = ?
        `, [id]);
        
        if (actions.length === 0) {
            console.log(`❌ [NOT FOUND] Action #${id} not found`);
            return res.status(404).json({
                status: 'error',
                message: 'Action not found'
            });
        }
        
        console.log(`✅ [JOIN QUERY] Retrieved action #${id}`);
        
        res.status(200).json({
            status: 'success',
            data: actions[0]
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getActionById:', error);
        next(error);
    }
};