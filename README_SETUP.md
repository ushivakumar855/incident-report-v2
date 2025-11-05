# Incident Reporting System v2

A comprehensive incident reporting system with real-time updates, built with React (frontend) and Node.js/Express (backend), using MySQL database with stored procedures, triggers, and functions.

## Features

### User Dashboard
- ✅ Submit new incident reports
- ✅ View all reports with filtering by status
- ✅ Real-time statistics and analytics
- ✅ Track report progress and actions taken
- ✅ Shared components for consistent UI

### Responder Dashboard
- ✅ View all reports with status filtering
- ✅ Add actions to reports
- ✅ Update report status
- ✅ Assign responders to reports
- ✅ View responder performance metrics
- ✅ Real-time statistics and analytics
- ✅ Shared components for consistent UI

### Backend Features
- ✅ RESTful API with Express.js
- ✅ MySQL database with `incident_db1` schema
- ✅ Stored Procedures for automated workflows
- ✅ Database Functions for calculations
- ✅ Triggers for data consistency
- ✅ Comprehensive logging of all database operations
- ✅ JOIN, AGGREGATE, and NESTED queries
- ✅ Real-time data synchronization

## Database Schema

The system uses the `incident_db1` database with the following tables:
- **users** - User information (anonymous or registered)
- **categories** - Incident categories with responsible roles
- **responders** - Staff members who handle incidents
- **reports** - Main incident reports table
- **actionstaken** - Actions taken by responders
- **audit_log** - Complete audit trail of all changes

### Stored Procedures
1. `sp_SubmitReport` - Creates new report with validation
2. `sp_AssignResponder` - Assigns responder and updates status
3. `sp_AddAction` - Logs action taken by responder
4. `sp_GetReportStatistics` - Retrieves comprehensive statistics
5. `sp_ResolveReport` - Marks report as resolved

### Functions
1. `fn_GetResponseTime(ReportID)` - Calculate response time in hours
2. `fn_GetResponderScore(ResponderID)` - Calculate performance score
3. `fn_GetCategoryCount(CategoryID)` - Get report count for category

### Triggers
1. `trg_BeforeInsertReport` - Validate data before insert
2. `trg_AfterInsertReport` - Log report creation
3. `trg_BeforeUpdateReport` - Set ResolvedAt timestamp
4. `trg_AfterUpdateReport` - Log status changes and update metrics
5. `trg_BeforeDeleteReport` - Prevent deletion of active reports
6. `trg_AfterInsertAction` - Log action creation

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MySQL Server (v8.0 or higher)

### Database Setup

1. Create the database and tables by running the SQL script:
```bash
mysql -u root -p < database/incident_db1.sql
```

2. The script will create:
   - Database: `incident_db1`
   - All tables with relationships
   - Stored procedures, functions, and triggers
   - Sample data for testing

3. Update backend environment variables in `backend/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=incident_db1
DB_PORT=3306
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to project root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

4. Build for production:
```bash
npm run build
```

## API Endpoints

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get report by ID
- `GET /api/reports/status/:status` - Get reports by status
- `GET /api/reports/stats` - Get statistics
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report status
- `DELETE /api/reports/:id` - Delete report

### Actions
- `GET /api/actions` - Get all actions
- `GET /api/actions/report/:reportId` - Get actions for report
- `POST /api/actions` - Add new action

### Responders
- `GET /api/responders` - Get all responders
- `GET /api/responders/:id` - Get responder by ID
- `POST /api/responders` - Create new responder

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user

## Console Logging

The system provides comprehensive console logging for debugging:

### Database Operations
```
📊 [JOIN QUERY] Fetching all reports with user and category details...
✅ [JOIN QUERY] Retrieved 8 reports
📈 [AGGREGATE QUERY] Counting total reports...
✅ [AGGREGATE] Total count: 8 reports
```

### Stored Procedures
```
⚙️ [STORED PROCEDURE] Calling sp_SubmitReport...
✅ [STORED PROCEDURE] sp_SubmitReport executed successfully
📝 [CREATED] New report ID: 9
```

### Triggers
```
✅ [TRIGGER] trg_AfterInsertReport fired - Report logged in audit_log
✅ [TRIGGER] trg_AfterUpdateReport fired - Status change logged
✅ [TRIGGER] trg_AfterUpdateReport - Responder TotalResolved incremented
```

### Functions
```
🔧 [FUNCTION CALL] Calculating response time for report #1...
✅ [FUNCTION] Response time: 24 hours
🔧 [FUNCTION CALL] fn_GetResponderScore() = 85.5%
```

## Data Flow

Detailed data flow documentation is available in [FLOW_DOCUMENTATION.md](./FLOW_DOCUMENTATION.md)

### Quick Overview

1. **User Submits Report**:
   - User fills form → Backend API → `sp_SubmitReport` → Triggers fire → Real-time update

2. **Responder Takes Action**:
   - Responder adds action → Backend API → `sp_AddAction` → Status update → Triggers fire → Real-time sync

3. **Status Update**:
   - Status change → Database UPDATE → Triggers fire → Metrics updated → Real-time visibility

4. **Real-time Statistics**:
   - Dashboard refresh → Multiple queries → `sp_GetReportStatistics` → Aggregated data → Both dashboards see same data

## Shared Components

Both User and Responder dashboards use shared components for consistency:

### Frontend Components
- `StatisticsCards.jsx` - Display statistics cards (shared)
- `DetailedStatistics` - Detailed statistics view (shared)
- `ReportCard.jsx` - Report summary card
- `StatusBadge.jsx` - Status indicator
- `LoadingSpinner.jsx` - Loading indicator
- `DashboardHeader.jsx` - Common header

### Backend Endpoints
Both user types use the same API endpoints, ensuring real-time data synchronization.

## Real-time Synchronization

The system ensures both Users and Responders see the same data in real-time through:

1. **Single Source of Truth**: All data comes from `incident_db1` database
2. **Shared Backend**: Same API endpoints serve both dashboards
3. **Automatic Updates**: Database triggers maintain consistency
4. **Shared Components**: Same UI components render same data
5. **Manual Refresh**: "Refresh Data" button fetches latest data
6. **Auto-refresh**: Data loaded on page navigation

## Development

### Project Structure
```
incident-report-v2/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   ├── reportController.js
│   │   ├── actionController.js
│   │   ├── responderController.js
│   │   ├── categoryController.js
│   │   └── userController.js
│   ├── routes/
│   │   ├── reportRoutes.js
│   │   ├── actionRoutes.js
│   │   ├── responderRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── userRoutes.js
│   └── server.js              # Express server
├── src/
│   ├── components/
│   │   ├── DashboardHeader.jsx
│   │   ├── FilterBar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── ReportCard.jsx
│   │   ├── StatusBadge.jsx
│   │   └── StatisticsCards.jsx  # Shared statistics component
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── ReportDetails.jsx    # Shared report details
│   │   ├── ResponderDashboard.jsx
│   │   ├── Statistics.jsx       # Standalone statistics page
│   │   ├── SubmitReport.jsx
│   │   ├── UserDashboard.jsx
│   │   └── ViewReports.jsx
│   ├── services/
│   │   └── api.js               # API service layer
│   ├── utils/
│   │   └── helpers.js           # Helper functions
│   ├── App.js
│   └── index.js
├── database/
│   └── incident_db1.sql         # Database schema and data
├── FLOW_DOCUMENTATION.md        # Detailed data flow
└── README.md                    # This file
```

### Adding New Features

1. **New Database Table**: Add to `database/incident_db1.sql`
2. **New API Endpoint**: Create route and controller in `backend/`
3. **New UI Component**: Add to `src/components/` or `src/pages/`
4. **Shared Component**: Add to `src/components/` and use in both dashboards

## Troubleshooting

### Database Connection Issues
- Check MySQL is running: `systemctl status mysql`
- Verify credentials in `backend/.env`
- Test connection: `mysql -u root -p incident_db1`

### Backend Won't Start
- Check port 5000 is available
- Verify all dependencies installed: `npm install`
- Check database connection in console logs

### Frontend Won't Build
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`
- Verify all imports are correct

### Real-time Updates Not Working
- Check backend is running and accessible
- Verify API endpoints are correct
- Check browser console for errors
- Click "Refresh Data" button to force update

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with descriptive messages
6. Push and create a pull request

## License

This project is licensed for educational purposes.

## Author

**ushivakumar855**
- GitHub: [@ushivakumar855](https://github.com/ushivakumar855)

## Acknowledgments

- Built with React, Node.js, Express, and MySQL
- Uses Bootstrap for UI components
- Implements best practices for database design with stored procedures, triggers, and functions
