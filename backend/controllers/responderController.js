// =============================================
// Responder Controller
// =============================================

const db = require('../config/db');

// Get all responders
exports.getAllResponders = async (req, res, next) => {
    try {
        console.log('👥 [RESPONDERS] Fetching all responders...');
        console.log('🔄 [JOIN + AGGREGATE] Combining responders with action counts using LEFT JOIN and GROUP BY...');
        
        const [responders] = await db.query(`
            SELECT 
                r.ResponderID,
                r.Name,
                r.Role,
                r.ContactInfo,
                r.Department,
                r.IsAvailable,
                r.TotalResolved,
                COUNT(a.ActionID) AS ActionCount,
                fn_GetResponderScore(r.ResponderID) AS PerformanceScore
            FROM responders r
            LEFT JOIN actionstaken a ON r.ResponderID = a.ResponderID
            GROUP BY r.ResponderID, r.Name, r.Role, r.ContactInfo, r.Department, r.IsAvailable, r.TotalResolved
            ORDER BY r.Name
        `);
        
        console.log(`✅ [JOIN + AGGREGATE] Retrieved ${responders.length} responders with action counts`);
        console.log(`🔧 [FUNCTION CALL] fn_GetResponderScore() calculated for each responder`);
        
        res.status(200).json({
            status: 'success',
            results: responders.length,
            data: responders
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getAllResponders:', error);
        next(error);
    }
};

// Get responder by ID
exports.getResponderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 [RESPONDER] Fetching responder #${id}...`);
        
        const [responders] = await db.query(`
            SELECT 
                r.*,
                fn_GetResponderScore(r.ResponderID) AS PerformanceScore
            FROM responders r
            WHERE r.ResponderID = ?
        `, [id]);
        
        if (responders.length === 0) {
            console.log(`❌ [NOT FOUND] Responder #${id} not found`);
            return res.status(404).json({
                status: 'error',
                message: 'Responder not found'
            });
        }
        
        console.log(`✅ [FOUND] Retrieved responder #${id}`);
        console.log(`🔧 [FUNCTION CALL] fn_GetResponderScore() = ${responders[0].PerformanceScore}%`);
        
        res.status(200).json({
            status: 'success',
            data: responders[0]
        });
    } catch (error) {
        console.error('❌ [ERROR] Error in getResponderById:', error);
        next(error);
    }
};

// Create new responder
exports.createResponder = async (req, res, next) => {
    try {
        console.log('📝 [RESPONDER] Creating new responder...');
        const { name, role, contactInfo, department } = req.body;
        
        if (!name || !role || !contactInfo) {
            console.log('❌ [VALIDATION] Missing required fields');
            return res.status(400).json({
                status: 'error',
                message: 'Name, Role, and ContactInfo are required'
            });
        }
        
        const [result] = await db.query(`
            INSERT INTO responders (Name, Role, ContactInfo, Department, IsAvailable)
            VALUES (?, ?, ?, ?, TRUE)
        `, [name, role, contactInfo, department || null]);
        
        console.log(`✅ [CREATED] New responder ID: ${result.insertId}`);
        
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
        console.error('❌ [ERROR] Error in createResponder:', error);
        next(error);
    }
};