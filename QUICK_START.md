# Quick Start Guide

## Database Setup

The database schema is already included in `database/incident_db1.sql`. This file contains:
- Complete database schema for `incident_db1`
- All stored procedures, functions, and triggers
- Sample data for testing

### Setup Steps:

1. **Import the database:**
   ```bash
   mysql -u root -p < database/incident_db1.sql
   ```
   Enter your MySQL password when prompted.

2. **Verify the setup:**
   ```bash
   ./verify-database.sh
   ```
   This will check if all tables, procedures, functions, and triggers are created correctly.

3. **Update backend configuration:**
   Edit `backend/.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=incident_db1
   DB_PORT=3306
   ```

## Running the Application

### Backend (API Server)

```bash
cd backend
npm install
npm start
```

The API will be available at: `http://localhost:5000`

### Frontend (React App)

In a new terminal:
```bash
npm install
npm start
```

The application will open at: `http://localhost:3000`

## Testing the Real-time Features

### Test Scenario 1: User Creates Report

1. Open User Dashboard
2. Click "Submit New Report"
3. Fill in the form and submit
4. **Observe Console Logs** (Backend):
   ```
   ⚙️ [STORED PROCEDURE] Calling sp_SubmitReport...
   ✅ [STORED PROCEDURE] sp_SubmitReport executed successfully
   ✅ [TRIGGER] trg_AfterInsertReport fired - Report logged in audit_log
   ```
5. Refresh User Dashboard - see the new report
6. Open Responder Dashboard - **the same report appears immediately**

### Test Scenario 2: Responder Takes Action

1. Open Responder Dashboard
2. Click on a pending report
3. Add an action with description
4. **Observe Console Logs** (Backend):
   ```
   ⚙️ [STORED PROCEDURE] Calling sp_AddAction...
   ✅ [STORED PROCEDURE] sp_AddAction executed successfully
   ✅ [TRIGGER] trg_AfterInsertAction fired - Action logged in audit_log
   🔄 [UPDATE] Updating report status to "In Progress"...
   ✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged
   ```
5. Refresh User Dashboard - **see the action and status update in real-time**
6. Both dashboards show the same data

### Test Scenario 3: Statistics Synchronization

1. Open both User and Responder dashboards side by side
2. Click "View Statistics" on both
3. **Observe**: Both show identical statistics
4. Submit a new report or update status
5. Click "Refresh Data" on both dashboards
6. **Verify**: Statistics update simultaneously on both dashboards

### Test Scenario 4: Report Resolution

1. Open a report in Responder Dashboard
2. Click "Mark as Resolved"
3. **Observe Console Logs**:
   ```
   🔄 [UPDATE] Updating report #1 status to: Resolved
   ✅ [TRIGGER] trg_BeforeUpdateReport - ResolvedAt timestamp set
   ✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged
   ✅ [TRIGGER] trg_AfterUpdateReport - Responder TotalResolved incremented
   ```
4. Check User Dashboard - report now shows "Resolved" status
5. Check Statistics - resolution rate updated

## Database Operations You'll See in Console

### JOIN Queries
```
🔄 [JOIN QUERY] Combining reports, users, categories, and responders tables...
✅ [JOIN QUERY] Retrieved 8 reports
```

### Aggregate Queries
```
📈 [AGGREGATE QUERY] Getting status breakdown with GROUP BY...
✅ [AGGREGATE] Retrieved 3 status groups
```

### Nested Queries
```
📈 [NESTED QUERY] Finding reports with above-average response time...
✅ [NESTED QUERY] Found 3 reports above average response time
```

### Stored Procedures
```
⚙️ [STORED PROCEDURE] Calling sp_SubmitReport...
⚙️ [STORED PROCEDURE] Calling sp_AddAction...
⚙️ [STORED PROCEDURE] Calling sp_GetReportStatistics...
```

### Functions
```
🔧 [FUNCTION CALL] Calculating response time for report #1...
✅ [FUNCTION] Response time: 24 hours
🔧 [FUNCTION CALL] fn_GetResponderScore() = 85.5%
```

### Triggers
```
✅ [TRIGGER] trg_AfterInsertReport fired - Report logged in audit_log
✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged
✅ [TRIGGER] trg_BeforeDeleteReport - Cannot delete active report
```

## Troubleshooting

### Database Connection Failed
```bash
# Check MySQL is running
systemctl status mysql

# Try connecting manually
mysql -u root -p incident_db1
```

### Port Already in Use
```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Tables Not Found
```bash
# Re-import the database
mysql -u root -p < database/incident_db1.sql
```

## API Testing with curl

### Get All Reports
```bash
curl http://localhost:5000/api/reports
```

### Get Statistics
```bash
curl http://localhost:5000/api/reports/stats
```

### Create Report
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "userId": 2,
    "description": "Test incident",
    "location": "Building A",
    "priority": "High"
  }'
```

### Add Action
```bash
curl -X POST http://localhost:5000/api/actions \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 1,
    "responderId": 2,
    "actionDescription": "Investigation started",
    "actionType": "Investigation"
  }'
```

## Key Features Demonstrated

1. ✅ **Shared Components**: Both dashboards use `StatisticsCards.jsx`
2. ✅ **Real-time Data**: Same API endpoints for both user types
3. ✅ **Stored Procedures**: Automated workflows (sp_SubmitReport, sp_AddAction, etc.)
4. ✅ **Triggers**: Automatic actions (audit logging, metric updates)
5. ✅ **Functions**: Reusable calculations (response time, performance score)
6. ✅ **JOIN Queries**: Efficient data retrieval from multiple tables
7. ✅ **AGGREGATE Queries**: Statistics with GROUP BY
8. ✅ **NESTED Queries**: Complex filtering and analysis
9. ✅ **Comprehensive Logging**: All operations logged to console

## Documentation

- **Setup Guide**: [README_SETUP.md](./README_SETUP.md)
- **Data Flow**: [FLOW_DOCUMENTATION.md](./FLOW_DOCUMENTATION.md)
- **This Guide**: [QUICK_START.md](./QUICK_START.md)

## Support

For issues or questions, please check:
1. Backend console logs for database operation details
2. Browser console for frontend errors
3. MySQL logs for database-specific issues

---

**Author**: ushivakumar855
**Database**: incident_db1
**Version**: 2.0
