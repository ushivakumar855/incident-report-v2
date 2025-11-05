# Incident Reporting System - Data Flow Documentation

## Overview
This document explains the real-time data flow in the Incident Reporting System, detailing how users and responders interact with the system and see synchronized, real-time updates.

## System Architecture

### Database: `incident_db1`
The system uses a MySQL database with the following key features:
- **Stored Procedures**: Automated workflows for common operations
- **Functions**: Reusable calculations and data retrieval
- **Triggers**: Automatic actions on data changes
- **Views**: Pre-defined queries for common reports

### Backend: Node.js + Express
- RESTful API endpoints
- Real-time database connections
- Comprehensive logging of database operations
- Automatic trigger execution on data changes

### Frontend: React
- Shared components for consistent UI
- Real-time data fetching
- Automatic updates on user actions

---

## Complete Data Flow

### 1. User Submits a Report

**Flow:**
```
User Dashboard → Submit Report Form → Backend API → Database (sp_SubmitReport) → Triggers Fire → Real-time Update
```

**Step-by-Step:**

1. **User Action**: User fills out report form in `/submit` page
   - Selects category
   - Enters description
   - Specifies location and priority

2. **Frontend**: Form data sent via `reportAPI.create()`
   ```javascript
   POST /api/reports
   Body: { categoryId, userId, description, location, priority }
   ```

3. **Backend Processing** (`reportController.createReport`):
   ```
   ⚙️ [STORED PROCEDURE] Calling sp_SubmitReport...
   📋 Parameters: CategoryID, UserID, Priority
   ```
   - Validates input data
   - Calls stored procedure: `sp_SubmitReport(CategoryID, UserID, Description, Location, Priority)`

4. **Database Operations**:
   - **Stored Procedure** executes:
     ```sql
     INSERT INTO reports (CategoryID, UserID, Description, Location, Priority, Status, Timestamp)
     VALUES (?, ?, ?, ?, ?, 'Pending', NOW())
     ```
   - **Trigger** `trg_BeforeInsertReport` fires:
     - Validates CategoryID exists
     - Sets Timestamp if not provided
   
   - **Trigger** `trg_AfterInsertReport` fires:
     ```sql
     INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
     VALUES ('reports', 'INSERT', NEW.ReportID, 'Report created...')
     ```
   - **Audit Log** records the creation

5. **Response**: New report with ID returned to frontend

6. **Real-time Effect**: 
   - Report immediately visible in User Dashboard
   - Report immediately visible in Responder Dashboard (Pending section)
   - Statistics updated for both dashboards

**Console Output:**
```
📝 [CREATE] Creating new report...
⚙️ [STORED PROCEDURE] Calling sp_SubmitReport...
✅ [STORED PROCEDURE] sp_SubmitReport executed successfully
✅ [TRIGGER] trg_AfterInsertReport fired - Report logged in audit_log
📝 [CREATED] New report ID: 9
```

---

### 2. Responder Views and Takes Action

**Flow:**
```
Responder Dashboard → View Report → Add Action → Backend API → Database (sp_AddAction) → Triggers Fire → Status Update → Real-time Sync
```

**Step-by-Step:**

1. **Responder Action**: Clicks "View" on a report in Responder Dashboard

2. **Frontend**: Navigates to `/reports/{id}` (ReportDetails page)
   - Fetches full report details via `reportAPI.getById(id)`
   - Displays report information, category, and existing actions

3. **Backend Processing** (`reportController.getReportById`):
   ```
   🔍 [DETAILS] Fetching report #1 with full details...
   🔄 [JOIN QUERY] Combining reports, users, categories, and responders tables...
   🔧 [FUNCTION CALL] Calculating response time...
   ```
   - Uses **JOIN query** to combine multiple tables
   - Calls **function** `fn_GetResponseTime(ReportID)` to calculate hours since submission

4. **Responder Adds Action**:
   - Selects responder from dropdown
   - Enters action description
   - Submits action form

5. **Frontend**: Sends action via `actionAPI.create()`
   ```javascript
   POST /api/actions
   Body: { reportId, responderId, actionDescription, actionType }
   ```

6. **Backend Processing** (`actionController.createAction`):
   ```
   ⚙️ [STORED PROCEDURE] Calling sp_AddAction...
   ```
   - Validates report and responder exist
   - Calls stored procedure: `sp_AddAction(ReportID, ResponderID, ActionDescription, ActionType)`

7. **Database Operations**:
   - **Stored Procedure** executes:
     ```sql
     INSERT INTO actionstaken (ReportID, ResponderID, ActionDescription, ActionType, Timestamp)
     VALUES (?, ?, ?, ?, NOW())
     ```
   
   - **Trigger** `trg_AfterInsertAction` fires:
     ```sql
     INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
     VALUES ('actionstaken', 'INSERT', NEW.ActionID, 'Action added to Report #X')
     ```

   - If report status is 'Pending', **automatically updates** to 'In Progress':
     ```sql
     UPDATE reports SET Status = 'In Progress' WHERE ReportID = ?
     ```
   
   - **Trigger** `trg_AfterUpdateReport` fires on status change:
     ```sql
     INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
     VALUES ('reports', 'UPDATE', NEW.ReportID, 'Status changed from Pending to In Progress')
     ```

8. **Real-time Effect**:
   - Action immediately visible in ReportDetails page
   - Report status updated in both User and Responder dashboards
   - Action count incremented for the responder
   - Statistics updated across all dashboards

**Console Output:**
```
📝 [ACTION] Creating new action...
⚙️ [STORED PROCEDURE] Calling sp_AddAction...
✅ [STORED PROCEDURE] sp_AddAction executed successfully
✅ [TRIGGER] trg_AfterInsertAction fired - Action logged in audit_log
🔄 [UPDATE] Updating report status to "In Progress"...
✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged
```

---

### 3. Responder Updates Report Status

**Flow:**
```
Report Details → Status Update Button → Backend API → Database UPDATE → Triggers Fire → Real-time Sync
```

**Step-by-Step:**

1. **Responder Action**: Clicks "Mark as Resolved" or "Mark as In Progress"

2. **Frontend**: Sends status update via `reportAPI.updateStatus(id, status)`
   ```javascript
   PUT /api/reports/:id
   Body: { status: 'Resolved', responderId }
   ```

3. **Backend Processing** (`reportController.updateReportStatus`):
   ```
   🔄 [UPDATE] Updating report #1 status to: Resolved
   ```
   
   - If assigning responder: Calls stored procedure `sp_AssignResponder(ReportID, ResponderID)`
   - Otherwise: Direct UPDATE query

4. **Database Operations**:
   
   **Option A - Assign Responder:**
   - **Stored Procedure** `sp_AssignResponder` executes:
     ```sql
     UPDATE reports 
     SET ResponderID = ?, Status = 'In Progress'
     WHERE ReportID = ?
     ```
   
   **Option B - Mark Resolved:**
   - **Trigger** `trg_BeforeUpdateReport` fires (before UPDATE):
     ```sql
     -- Sets ResolvedAt timestamp when status changes to 'Resolved'
     SET NEW.ResolvedAt = NOW()
     ```
   
   - UPDATE executes:
     ```sql
     UPDATE reports SET Status = 'Resolved' WHERE ReportID = ?
     ```
   
   - **Trigger** `trg_AfterUpdateReport` fires (after UPDATE):
     ```sql
     -- Logs status change
     INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
     VALUES ('reports', 'UPDATE', NEW.ReportID, 'Status changed from X to Resolved')
     
     -- Increments responder's TotalResolved count
     UPDATE responders 
     SET TotalResolved = TotalResolved + 1 
     WHERE ResponderID = NEW.ResponderID
     ```

5. **Real-time Effect**:
   - Report status updated immediately in User Dashboard
   - Report status updated immediately in Responder Dashboard
   - Report moves to different status category (e.g., from "In Progress" to "Resolved")
   - Responder's performance metrics updated
   - Statistics updated (resolution rate, active reports count, etc.)

**Console Output:**
```
🔄 [UPDATE] Updating report #1 status to: Resolved
✅ [UPDATE] Status updated from "In Progress" to "Resolved"
✅ [TRIGGER] trg_BeforeUpdateReport - ResolvedAt timestamp set
✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged in audit_log
✅ [TRIGGER] trg_AfterUpdateReport - Responder TotalResolved incremented
```

---

### 4. Real-time Statistics Update

**Flow:**
```
Dashboard Refresh → Backend API → Database (sp_GetReportStatistics + Aggregate Queries) → Real-time Data
```

**Step-by-Step:**

1. **User/Responder Action**: 
   - Clicks "Refresh Data" button
   - Or navigates to dashboard (auto-refresh on load)

2. **Frontend**: Multiple parallel API calls
   ```javascript
   Promise.all([
     reportAPI.getAll(),
     reportAPI.getStats(),
     responderAPI.getAll()
   ])
   ```

3. **Backend Processing** (`reportController.getReportStats`):
   ```
   📊 [STATISTICS] Fetching comprehensive statistics...
   ⚙️ [STORED PROCEDURE] Calling sp_GetReportStatistics...
   📈 [AGGREGATE QUERY] Getting status breakdown with GROUP BY...
   📈 [AGGREGATE + JOIN] Getting category breakdown...
   📈 [AGGREGATE + NESTED QUERY] Getting total counts...
   📈 [NESTED QUERY] Finding reports with above-average response time...
   ```

4. **Database Operations**:

   **Stored Procedure Call:**
   ```sql
   CALL sp_GetReportStatistics()
   -- Returns: TotalReports, PendingReports, InProgressReports, ResolvedReports, AvgResolutionTimeHours
   ```

   **Aggregate Query - Status Breakdown:**
   ```sql
   SELECT Status, COUNT(*) as count
   FROM reports
   GROUP BY Status
   ORDER BY count DESC
   ```

   **Aggregate + Join Query - Category Breakdown:**
   ```sql
   SELECT c.Name, COUNT(r.ReportID) as count
   FROM categories c
   LEFT JOIN reports r ON c.CategoryID = r.CategoryID
   GROUP BY c.CategoryID, c.Name
   HAVING COUNT(r.ReportID) > 0
   ```

   **Nested Query - Above Average Response Time:**
   ```sql
   SELECT r.ReportID, r.Description, ResponseTimeHours
   FROM reports r
   WHERE TIMESTAMPDIFF(HOUR, r.Timestamp, COALESCE(r.ResolvedAt, NOW())) > (
       SELECT AVG(TIMESTAMPDIFF(HOUR, Timestamp, COALESCE(ResolvedAt, NOW())))
       FROM reports
   )
   ```

   **Nested Query with IN - Critical Responders:**
   ```sql
   SELECT resp.Name, resp.Role, CriticalReports
   FROM responders resp
   WHERE resp.ResponderID IN (
       SELECT DISTINCT ResponderID 
       FROM reports 
       WHERE Priority = 'Critical' AND ResponderID IS NOT NULL
   )
   ```

5. **Real-time Effect**:
   - Statistics cards show current counts
   - Charts and progress bars reflect actual data
   - Both User and Responder dashboards show same statistics
   - All views synchronized with database state

**Console Output:**
```
📊 [STATISTICS] Fetching comprehensive statistics...
⚙️ [STORED PROCEDURE] Calling sp_GetReportStatistics...
✅ [STORED PROCEDURE] sp_GetReportStatistics executed successfully
📈 Results: Total=8, Pending=3, InProgress=2, Resolved=3
📈 [AGGREGATE QUERY] Getting status breakdown with GROUP BY...
✅ [AGGREGATE] Retrieved 3 status groups
📈 [AGGREGATE + JOIN] Getting category breakdown...
✅ [AGGREGATE + JOIN] Retrieved 5 category groups
📈 [NESTED QUERY] Finding reports with above-average response time...
✅ [NESTED QUERY] Found 3 reports above average response time
```

---

## Database Features Usage

### Stored Procedures
1. **sp_SubmitReport** - Creates new report with validation
2. **sp_AssignResponder** - Assigns responder and updates status
3. **sp_AddAction** - Logs action taken by responder
4. **sp_GetReportStatistics** - Retrieves comprehensive statistics
5. **sp_ResolveReport** - Marks report as resolved and updates metrics

### Functions
1. **fn_GetResponseTime(ReportID)** - Calculates hours since report submission
2. **fn_GetResponderScore(ResponderID)** - Calculates responder performance percentage
3. **fn_GetCategoryCount(CategoryID)** - Gets total reports for a category

### Triggers
1. **trg_BeforeInsertReport** - Validates data before insert
2. **trg_AfterInsertReport** - Logs report creation
3. **trg_BeforeUpdateReport** - Sets ResolvedAt timestamp
4. **trg_AfterUpdateReport** - Logs status changes, updates responder metrics
5. **trg_BeforeDeleteReport** - Prevents deletion of active reports
6. **trg_AfterInsertAction** - Logs action creation

### Query Types Used
1. **JOIN Queries** - Combine reports, users, categories, responders
2. **AGGREGATE Queries** - COUNT, SUM, AVG with GROUP BY
3. **NESTED Queries** - Subqueries with IN, comparison operators
4. **LEFT JOIN** - Include all responders even without actions
5. **INNER JOIN** - Only include matching records

---

## Shared Components Architecture

### Frontend Components

**Shared Components (Used by Both Dashboards):**
- `ReportCard.jsx` - Display report summary
- `StatusBadge.jsx` - Show status with color coding
- `LoadingSpinner.jsx` - Loading indicator
- `DashboardHeader.jsx` - Common header
- `FilterBar.jsx` - Filter controls

**Pages:**
- `ReportDetails.jsx` - Detailed report view (shared route `/reports/:id`)
- `Statistics.jsx` - Statistics view (can be embedded or standalone)
- `UserDashboard.jsx` - User-specific dashboard
- `ResponderDashboard.jsx` - Responder-specific dashboard

### Backend Endpoints (Used by Both)

**Reports API:**
- `GET /api/reports` - All reports
- `GET /api/reports/:id` - Single report details
- `GET /api/reports/status/:status` - Filtered by status
- `GET /api/reports/stats` - Statistics
- `POST /api/reports` - Create report
- `PUT /api/reports/:id` - Update status
- `DELETE /api/reports/:id` - Delete report

**Actions API:**
- `GET /api/actions` - All actions
- `GET /api/actions/report/:reportId` - Actions for report
- `POST /api/actions` - Add action

**Responders API:**
- `GET /api/responders` - All responders
- `GET /api/responders/:id` - Single responder

**Categories API:**
- `GET /api/categories` - All categories

---

## Real-time Synchronization

### How It Works:

1. **Single Source of Truth**: Database (`incident_db1`)
2. **Consistent API**: Same endpoints for both user types
3. **Automatic Updates**: Triggers maintain data consistency
4. **Refresh Mechanism**: Manual refresh button + auto-refresh on page load
5. **Shared Components**: Same UI components render same data

### User Experience:

**User Dashboard:**
- Sees all reports in the system
- Can filter by status
- Views statistics for all reports
- Clicks report to see details
- Can see actions taken by responders in real-time

**Responder Dashboard:**
- Sees all reports in the system
- Can filter by status
- Views statistics for all reports
- Clicks report to see details and add actions
- Actions immediately reflected in report details
- Can update report status

**Both See:**
- Same reports
- Same statistics
- Same action history
- Same real-time updates

---

## Summary

The system ensures real-time visibility through:

1. ✅ **Shared Database**: Both user types query same tables
2. ✅ **Shared Backend**: Same API endpoints serve both dashboards
3. ✅ **Shared Components**: ReportDetails, Statistics components reused
4. ✅ **Stored Procedures**: Automated, consistent operations
5. ✅ **Triggers**: Automatic data updates (status, metrics, logs)
6. ✅ **Functions**: Consistent calculations across queries
7. ✅ **Comprehensive Logging**: All database operations logged to console
8. ✅ **JOIN Queries**: Efficient data retrieval combining multiple tables
9. ✅ **AGGREGATE Queries**: Real-time statistics with GROUP BY
10. ✅ **NESTED Queries**: Complex filtering and analysis

**Result**: Users and responders always see the same, up-to-date information in real-time!
