#!/bin/bash
# =============================================
# Database Verification Script
# Checks if incident_db1 database has all required components
# =============================================

echo "=========================================="
echo "Incident Reporting System - DB Verification"
echo "=========================================="
echo ""

# Database connection details (update as needed)
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-1234}
DB_NAME=${DB_NAME:-incident_db1}

echo "📊 Checking database: $DB_NAME"
echo ""

# Check if database exists
echo "1. Checking if database exists..."
DB_EXISTS=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep $DB_NAME)
if [ -z "$DB_EXISTS" ]; then
    echo "   ❌ Database '$DB_NAME' does not exist!"
    echo "   Please run the SQL script to create it:"
    echo "   mysql -u $DB_USER -p < database/incident_db1.sql"
    exit 1
else
    echo "   ✅ Database exists"
fi
echo ""

# Check tables
echo "2. Checking tables..."
TABLES=(users categories responders reports actionstaken audit_log)
for table in "${TABLES[@]}"; do
    TABLE_EXISTS=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep $table)
    if [ -z "$TABLE_EXISTS" ]; then
        echo "   ❌ Table '$table' is missing!"
        exit 1
    else
        echo "   ✅ Table '$table' exists"
    fi
done
echo ""

# Check stored procedures
echo "3. Checking stored procedures..."
PROCEDURES=(sp_SubmitReport sp_AssignResponder sp_AddAction sp_GetReportStatistics sp_ResolveReport)
for proc in "${PROCEDURES[@]}"; do
    PROC_EXISTS=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME' AND Name = '$proc';" 2>/dev/null | grep $proc)
    if [ -z "$PROC_EXISTS" ]; then
        echo "   ⚠️  Stored procedure '$proc' is missing!"
    else
        echo "   ✅ Stored procedure '$proc' exists"
    fi
done
echo ""

# Check functions
echo "4. Checking functions..."
FUNCTIONS=(fn_GetResponseTime fn_GetResponderScore fn_GetCategoryCount)
for func in "${FUNCTIONS[@]}"; do
    FUNC_EXISTS=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW FUNCTION STATUS WHERE Db = '$DB_NAME' AND Name = '$func';" 2>/dev/null | grep $func)
    if [ -z "$FUNC_EXISTS" ]; then
        echo "   ⚠️  Function '$func' is missing!"
    else
        echo "   ✅ Function '$func' exists"
    fi
done
echo ""

# Check triggers
echo "5. Checking triggers..."
TRIGGERS=(trg_BeforeInsertReport trg_AfterInsertReport trg_BeforeUpdateReport trg_AfterUpdateReport trg_BeforeDeleteReport trg_AfterInsertAction)
for trigger in "${TRIGGERS[@]}"; do
    TRIGGER_EXISTS=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TRIGGERS WHERE \`Trigger\` = '$trigger';" 2>/dev/null | grep $trigger)
    if [ -z "$TRIGGER_EXISTS" ]; then
        echo "   ⚠️  Trigger '$trigger' is missing!"
    else
        echo "   ✅ Trigger '$trigger' exists"
    fi
done
echo ""

# Check data
echo "6. Checking sample data..."
REPORT_COUNT=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT COUNT(*) FROM reports;" 2>/dev/null | tail -1)
CATEGORY_COUNT=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT COUNT(*) FROM categories;" 2>/dev/null | tail -1)
RESPONDER_COUNT=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT COUNT(*) FROM responders;" 2>/dev/null | tail -1)

echo "   📊 Reports: $REPORT_COUNT"
echo "   📊 Categories: $CATEGORY_COUNT"
echo "   📊 Responders: $RESPONDER_COUNT"
echo ""

echo "=========================================="
echo "✅ Database verification complete!"
echo "=========================================="
echo ""
echo "🚀 You can now start the application:"
echo "   Backend:  cd backend && npm start"
echo "   Frontend: npm start"
echo ""
