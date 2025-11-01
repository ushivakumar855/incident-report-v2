

const db = require('../config/db');

// @desc    Get all actions
// @route   GET /api/actions
// @access  Public
exports.getAllActions = async (req, res, next) => {
    try {
        const [actions] = await db.query(`
            SELECT 
                a.*,
                r.ResponderName,
                r.Role AS ResponderRole,
                rep.Description AS ReportDescription,
                rep.Status AS ReportStatus
            FROM actionstaken a
            JOIN responders r ON a.responderid = r.ResponderID
            JOIN reports rep ON a.reportid = rep.ReportID
            ORDER BY a.timestamp DESC
        `);
        
        res.status(200).json({
            status: 'success',
            results: actions.length,
            data: actions
        });
    } catch (error) {
        console.error('Error in getAllActions:', error);
        next(error);
    }
};

// @desc    Get actions for specific report
// @route   GET /api/actions/report/:reportId
// @access  Public
exports.getActionsByReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        
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
        `, [reportId]);
        
        res.status(200).json({
            status: 'success',
            results: actions.length,
            data: actions
        });
    } catch (error) {
        console.error('Error in getActionsByReport:', error);
        next(error);
    }
};

// @desc    Create new action
// @route   POST /api/actions
// @access  Protected (Responders)
exports.createAction = async (req, res, next) => {
    try {
        const {
            reportId,
            responderId,
            actionDescription
        } = req.body;
        
        // Validation
        if (!reportId || !responderId || !actionDescription) {
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
            return res.status(404).json({
                status: 'error',
                message: 'Responder not found'
            });
        }
        
        // Insert action
        const [result] = await db.query(`
            INSERT INTO actionstaken (reportid, responderid, actiondescription, timestamp)
            VALUES (?, ?, ?, NOW())
        `, [reportId, responderId, actionDescription]);
        
        // Update report status to 'In Progress' if it's 'Pending'
        await db.query(`
            UPDATE reports 
            SET Status = CASE 
                WHEN Status = 'Pending' THEN 'In Progress'
                ELSE Status
            END
            WHERE ReportID = ?
        `, [reportId]);
        
        // Get the created action
        const [newAction] = await db.query(`
            SELECT 
                a.*,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole
            FROM actionstaken a
            JOIN responders resp ON a.responderid = resp.ResponderID
            WHERE a.actionid = ?
        `, [result.insertId]);
        
        res.status(201).json({
            status: 'success',
            message: 'Action logged successfully',
            data: newAction[0]
        });
    } catch (error) {
        console.error('Error in createAction:', error);
        next(error);
    }
};

// @desc    Get action by ID
// @route   GET /api/actions/:id
// @access  Public
exports.getActionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const [actions] = await db.query(`
            SELECT 
                a.*,
                resp.Name AS ResponderName,
                resp.Role AS ResponderRole,
                resp.ContactInfo AS ResponderContact,
                rep.Description AS ReportDescription
            FROM actionstaken a
            JOIN responders resp ON a.responderid = resp.ResponderID
            JOIN reports rep ON a.reportid = rep.ReportID
            WHERE a.actionid = ?
        `, [id]);
        
        if (actions.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Action not found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: actions[0]
        });
    } catch (error) {
        console.error('Error in getActionById:', error);
        next(error);
    }
};