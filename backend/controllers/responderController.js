// =============================================
// Responder Controller
// =============================================

const db = require('../config/db');

// Get all responders
exports.getAllResponders = async (req, res, next) => {
    try {
        const [responders] = await db.query(`
            SELECT 
                r.*,
                COUNT(a.actionid) AS ActionCount,
                r.TotalResolved,
                (SELECT COUNT(*) FROM reports WHERE ResponderID = r.ResponderID AND Status IN ('Pending', 'In Progress', 'Under Review')) AS ActiveReports
            FROM responders r
            LEFT JOIN actionstaken a ON r.ResponderID = a.responderid
            GROUP BY r.ResponderID, r.Name, r.Role, r.ContactInfo, r.Department, r.IsAvailable, r.TotalResolved, r.CreatedAt
            ORDER BY r.Name
        `);
        
        res.status(200).json({
            status: 'success',
            results: responders.length,
            data: responders
        });
    } catch (error) {
        console.error('Error in getAllResponders:', error);
        next(error);
    }
};

// Get responder by ID
exports.getResponderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const [responders] = await db.query(
            'SELECT * FROM responders WHERE ResponderID = ?',
            [id]
        );
        
        if (responders.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Responder not found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: responders[0]
        });
    } catch (error) {
        console.error('Error in getResponderById:', error);
        next(error);
    }
};

// Create new responder
exports.createResponder = async (req, res, next) => {
    try {
        const { name, role, contactInfo } = req.body;
        
        if (!name || !role || !contactInfo) {
            return res.status(400).json({
                status: 'error',
                message: 'Name, Role, and ContactInfo are required'
            });
        }
        
        const [result] = await db.query(`
            INSERT INTO responders (Name, Role, ContactInfo)
            VALUES (?, ?, ?)
        `, [name, role, contactInfo]);
        
        const [newResponder] = await db.query(
            'SELECT * FROM responders WHERE ResponderID = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            status: 'success',
            message: 'Responder created successfully',
            data: newResponder[0]
        });
    } catch (error) {
        console.error('Error in createResponder:', error);
        next(error);
    }
};