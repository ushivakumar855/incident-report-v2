-- Create Database
DROP DATABASE IF EXISTS incident_db1;
CREATE DATABASE incident_db1;
USE incident_db1;

-- ============================================
-- TABLE CREATION (DDL Commands)
-- ============================================

-- 1. USERS TABLE (Entity 1)
CREATE TABLE users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Pseudonym VARCHAR(50) DEFAULT 'Anonymous',
    CampusDept VARCHAR(100),
    OptionalContact VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE,
    INDEX idx_pseudonym (Pseudonym),
    INDEX idx_campus (CampusDept)
) ENGINE=InnoDB;

-- 2. CATEGORIES TABLE (Entity 2)
CREATE TABLE categories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Role VARCHAR(100) NOT NULL,
    ContactInfo VARCHAR(100),
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (Name)
) ENGINE=InnoDB;

-- 3. RESPONDERS TABLE (Entity 3)
CREATE TABLE responders (
    ResponderID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Role VARCHAR(100) NOT NULL,
    ContactInfo VARCHAR(100),
    Department VARCHAR(100),
    IsAvailable BOOLEAN DEFAULT TRUE,
    TotalResolved INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_responder_name (Name),
    INDEX idx_responder_role (Role)
) ENGINE=InnoDB;

-- 4. REPORTS TABLE (Entity 4 - Central Entity)
CREATE TABLE reports (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryID INT NOT NULL,
    UserID INT NULL,  -- NULL for anonymous reports
    Description TEXT NOT NULL,
    Status ENUM('Pending', 'In Progress', 'Under Review', 'Resolved', 'Closed') DEFAULT 'Pending',
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ResolvedAt DATETIME NULL,
    ResponderID INT NULL,
    FOREIGN KEY (CategoryID) REFERENCES categories(CategoryID) ON DELETE RESTRICT,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE SET NULL,
    FOREIGN KEY (ResponderID) REFERENCES responders(ResponderID) ON DELETE SET NULL,
    INDEX idx_status (Status),
    INDEX idx_timestamp (Timestamp),
    INDEX idx_category (CategoryID)
) ENGINE=InnoDB;

-- 5. ACTIONSTAKEN TABLE (Entity 5 - Weak Entity)
CREATE TABLE actionstaken (
    ActionID INT AUTO_INCREMENT PRIMARY KEY,
    ReportID INT NOT NULL,
    ResponderID INT NOT NULL,
    ActionDescription TEXT NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ActionType ENUM('Investigation', 'Resolution', 'Follow-up', 'Closed') DEFAULT 'Investigation',
    FOREIGN KEY (ReportID) REFERENCES reports(ReportID) ON DELETE CASCADE,
    FOREIGN KEY (ResponderID) REFERENCES responders(ResponderID) ON DELETE RESTRICT,
    INDEX idx_report_action (ReportID),
    INDEX idx_timestamp (Timestamp)
) ENGINE=InnoDB;

-- 6. AUDIT LOG TABLE (Additional Entity for Tracking)
CREATE TABLE audit_log (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    TableName VARCHAR(50),
    Operation ENUM('INSERT', 'UPDATE', 'DELETE'),
    RecordID INT,
    ChangedBy VARCHAR(100),
    ChangeDescription TEXT,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_operation (TableName, Operation)
) ENGINE=InnoDB;

-- ============================================
-- CREATE USERS WITH DIFFERENT PRIVILEGES
-- ============================================

-- Admin User (Full Privileges)
DROP USER IF EXISTS 'admin_user'@'localhost';
CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'Admin@123';
GRANT ALL PRIVILEGES ON incident_db1.* TO 'admin_user'@'localhost';

-- Responder User (Limited Privileges)
DROP USER IF EXISTS 'responder_user'@'localhost';
CREATE USER 'responder_user'@'localhost' IDENTIFIED BY 'Responder@123';
GRANT SELECT, INSERT, UPDATE ON incident_db1.reports TO 'responder_user'@'localhost';
GRANT SELECT, INSERT ON incident_db1.actionstaken TO 'responder_user'@'localhost';
GRANT SELECT ON incident_db1.categories TO 'responder_user'@'localhost';
GRANT SELECT ON incident_db1.users TO 'responder_user'@'localhost';

-- Read-Only User (View Only)
DROP USER IF EXISTS 'viewer_user'@'localhost';
CREATE USER 'viewer_user'@'localhost' IDENTIFIED BY 'Viewer@123';
GRANT SELECT ON incident_db1.* TO 'viewer_user'@'localhost';

FLUSH PRIVILEGES;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure 1: Submit New Report
DELIMITER //
CREATE PROCEDURE sp_SubmitReport(
    IN p_CategoryID INT,
    IN p_UserID INT,
    IN p_Description TEXT,
    IN p_Location VARCHAR(200),
    IN p_Priority VARCHAR(20)
)
BEGIN
    DECLARE v_ReportID INT;
    
    INSERT INTO reports (CategoryID, UserID, Description, Location, Priority, Status, Timestamp)
    VALUES (p_CategoryID, p_UserID, p_Description, p_Location, p_Priority, 'Pending', NOW());
    
    SET v_ReportID = LAST_INSERT_ID();
    
    -- Log to audit table
    INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
    VALUES ('reports', 'INSERT', v_ReportID, CONCAT('New report submitted: ', p_Description));
    
    SELECT v_ReportID AS NewReportID, 'Report submitted successfully' AS Message;
END //

-- Procedure 2: Assign Responder to Report
CREATE PROCEDURE sp_AssignResponder(
    IN p_ReportID INT,
    IN p_ResponderID INT
)
BEGIN
    UPDATE reports 
    SET ResponderID = p_ResponderID, 
        Status = 'In Progress'
    WHERE ReportID = p_ReportID;
    
    INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
    VALUES ('reports', 'UPDATE', p_ReportID, CONCAT('Responder assigned: ', p_ResponderID));
    
    SELECT 'Responder assigned successfully' AS Message;
END //

-- Procedure 3: Add Action to Report
CREATE PROCEDURE sp_AddAction(
    IN p_ReportID INT,
    IN p_ResponderID INT,
    IN p_ActionDescription TEXT,
    IN p_ActionType VARCHAR(20)
)
BEGIN
    INSERT INTO actionstaken (ReportID, ResponderID, ActionDescription, ActionType, Timestamp)
    VALUES (p_ReportID, p_ResponderID, p_ActionDescription, p_ActionType, NOW());
    
    SELECT 'Action logged successfully' AS Message;
END //

-- Procedure 4: Get Report Statistics
CREATE PROCEDURE sp_GetReportStatistics()
BEGIN
    SELECT 
        COUNT(*) AS TotalReports,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS PendingReports,
        SUM(CASE WHEN Status = 'In Progress' THEN 1 ELSE 0 END) AS InProgressReports,
        SUM(CASE WHEN Status = 'Resolved' THEN 1 ELSE 0 END) AS ResolvedReports,
        SUM(CASE WHEN Priority = 'Critical' THEN 1 ELSE 0 END) AS CriticalReports,
        AVG(TIMESTAMPDIFF(HOUR, Timestamp, COALESCE(ResolvedAt, NOW()))) AS AvgResolutionTimeHours
    FROM reports;
END //

-- Procedure 5: Resolve Report
CREATE PROCEDURE sp_ResolveReport(
    IN p_ReportID INT,
    IN p_ResponderID INT,
    IN p_ResolutionNotes TEXT
)
BEGIN
    UPDATE reports 
    SET Status = 'Resolved', 
        ResolvedAt = NOW()
    WHERE ReportID = p_ReportID;
    
    INSERT INTO actionstaken (ReportID, ResponderID, ActionDescription, ActionType)
    VALUES (p_ReportID, p_ResponderID, p_ResolutionNotes, 'Closed');
    
    UPDATE responders 
    SET TotalResolved = TotalResolved + 1 
    WHERE ResponderID = p_ResponderID;
    
    SELECT 'Report resolved successfully' AS Message;
END //

DELIMITER ;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function 1: Calculate Response Time
DELIMITER //
CREATE FUNCTION fn_GetResponseTime(p_ReportID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_Hours INT;
    
    SELECT TIMESTAMPDIFF(HOUR, r.Timestamp, COALESCE(r.ResolvedAt, NOW()))
    INTO v_Hours
    FROM reports r
    WHERE r.ReportID = p_ReportID;
    
    RETURN COALESCE(v_Hours, 0);
END //

-- Function 2: Get Responder Performance Score
CREATE FUNCTION fn_GetResponderScore(p_ResponderID INT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_Score DECIMAL(5,2);
    DECLARE v_TotalReports INT;
    DECLARE v_ResolvedReports INT;
    
    SELECT COUNT(*) INTO v_TotalReports
    FROM reports WHERE ResponderID = p_ResponderID;
    
    SELECT COUNT(*) INTO v_ResolvedReports
    FROM reports WHERE ResponderID = p_ResponderID AND Status = 'Resolved';
    
    IF v_TotalReports = 0 THEN
        RETURN 0.00;
    END IF;
    
    SET v_Score = (v_ResolvedReports / v_TotalReports) * 100;
    
    RETURN v_Score;
END //

-- Function 3: Get Category Report Count
CREATE FUNCTION fn_GetCategoryCount(p_CategoryID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_Count INT;
    
    SELECT COUNT(*) INTO v_Count
    FROM reports
    WHERE CategoryID = p_CategoryID;
    
    RETURN v_Count;
END //

DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger 1: Before Insert on Reports (Auto-assign responder for critical reports)
DELIMITER //
CREATE TRIGGER trg_BeforeInsertReport
BEFORE INSERT ON reports
FOR EACH ROW
BEGIN
    -- Validate category exists
    IF NOT EXISTS (SELECT 1 FROM categories WHERE CategoryID = NEW.CategoryID) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid CategoryID';
    END IF;
    
    -- Set timestamp if not provided
    IF NEW.Timestamp IS NULL THEN
        SET NEW.Timestamp = NOW();
    END IF;
END //

-- Trigger 2: After Insert on Reports (Log creation)
CREATE TRIGGER trg_AfterInsertReport
AFTER INSERT ON reports
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
    VALUES ('reports', 'INSERT', NEW.ReportID, 
            CONCAT('Report created - Priority: ', NEW.Priority, ', Status: ', NEW.Status));
END //

-- Trigger 3: After Update on Reports (Log status changes)
CREATE TRIGGER trg_AfterUpdateReport
AFTER UPDATE ON reports
FOR EACH ROW
BEGIN
    IF OLD.Status != NEW.Status THEN
        INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
        VALUES ('reports', 'UPDATE', NEW.ReportID, 
                CONCAT('Status changed from ', OLD.Status, ' to ', NEW.Status));
    END IF;
    
    IF NEW.Status = 'Resolved' AND OLD.Status != 'Resolved' THEN
        UPDATE responders 
        SET TotalResolved = TotalResolved + 1 
        WHERE ResponderID = NEW.ResponderID;
    END IF;
END //

-- Trigger 4: Before Delete on Reports (Prevent deletion of active reports)
CREATE TRIGGER trg_BeforeDeleteReport
BEFORE DELETE ON reports
FOR EACH ROW
BEGIN
    IF OLD.Status IN ('In Progress', 'Under Review') THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete active reports. Please resolve first.';
    END IF;
END //

-- Trigger 5: After Insert on ActionsTaken (Update report activity)
CREATE TRIGGER trg_AfterInsertAction
AFTER INSERT ON actionstaken
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (TableName, Operation, RecordID, ChangeDescription)
    VALUES ('actionstaken', 'INSERT', NEW.ActionID, 
            CONCAT('Action added to Report #', NEW.ReportID));
END //

DELIMITER ;

-- ============================================
-- DATA INSERTION
-- ============================================

-- Insert Categories
INSERT INTO categories (Name, Role, ContactInfo, Description) VALUES
('Harassment', 'Dean of Students', 'dean@bmsit.edu', 'Cases of harassment, bullying, or inappropriate behavior'),
('Facilities', 'Facilities Manager', 'facilities@bmsit.edu', 'Infrastructure and maintenance issues'),
('Academic', 'Academic Coordinator', 'academic@bmsit.edu', 'Academic grievances and disputes'),
('Safety', 'Safety Officer', 'safety@bmsit.edu', 'Safety hazards and emergency situations'),
('Discrimination', 'Equity Officer', 'equity@bmsit.edu', 'Cases of discrimination or bias'),
('IT Support', 'IT Head', 'it@bmsit.edu', 'Technical and IT related issues');

-- Insert Responders
INSERT INTO responders (Name, Role, ContactInfo, Department, IsAvailable) VALUES
('Alice Johnson', 'Security Officer', 'alice@bmsit.edu', 'Security', TRUE),
('Bob Smith', 'Counselor', 'bob@bmsit.edu', 'Student Welfare', TRUE),
('Carol Williams', 'Academic Advisor', 'carol@bmsit.edu', 'Academics', TRUE),
('David Lee', 'Facilities Head', 'david@bmsit.edu', 'Maintenance', TRUE),
('Emma Davis', 'Safety Coordinator', 'emma@bmsit.edu', 'Safety', TRUE),
('Frank Miller', 'IT Support Lead', 'frank@bmsit.edu', 'IT Department', TRUE);

-- Insert Users
INSERT INTO users (Pseudonym, CampusDept, OptionalContact) VALUES
('Anonymous', NULL, NULL),
('JohnDoe', 'Computer Science', 'john@student.bmsit.edu'),
('JaneSmith', 'Electronics', 'jane@student.bmsit.edu'),
('AlexBrown', 'Mechanical', 'alex@student.bmsit.edu'),
('SarahWilson', 'Civil Engineering', 'sarah@student.bmsit.edu');

-- Insert Reports using Procedure
CALL sp_SubmitReport(1, 2, 'Student being harassed in library area', 'Library - 2nd Floor', 'High');
CALL sp_SubmitReport(2, 3, 'Water leakage in restroom causing slippery floor', 'Building A - Floor 3', 'Medium');
CALL sp_SubmitReport(3, 1, 'Grade dispute for DBMS course', 'CS Department', 'Low');
CALL sp_SubmitReport(4, 4, 'Fire alarm not working properly', 'Hostel Block B', 'Critical');
CALL sp_SubmitReport(5, 1, 'Bias in evaluation process', 'ECE Department', 'High');
CALL sp_SubmitReport(2, 5, 'Broken chairs in classroom', 'Building C - Room 305', 'Low');
CALL sp_SubmitReport(6, 2, 'WiFi not working in lab', 'Computer Lab 2', 'Medium');
CALL sp_SubmitReport(1, 1, 'Inappropriate behavior by senior student', 'Canteen Area', 'Critical');

-- Assign Responders
CALL sp_AssignResponder(1, 2);
CALL sp_AssignResponder(2, 4);
CALL sp_AssignResponder(3, 3);
CALL sp_AssignResponder(4, 5);
CALL sp_AssignResponder(5, 2);
CALL sp_AssignResponder(7, 6);

-- Add Actions
CALL sp_AddAction(1, 2, 'Initial investigation started. Witnesses being interviewed.', 'Investigation');
CALL sp_AddAction(2, 4, 'Plumber assigned to fix the leakage. Expected completion in 2 hours.', 'Resolution');
CALL sp_AddAction(3, 3, 'Meeting scheduled with faculty and student to discuss grade concerns.', 'Investigation');
CALL sp_AddAction(4, 5, 'Fire alarm inspection team dispatched immediately.', 'Investigation');
CALL sp_AddAction(1, 2, 'Counseling session arranged for affected student.', 'Follow-up');
CALL sp_AddAction(2, 4, 'Leakage fixed and area cleaned. Issue resolved.', 'Closed');

-- Resolve Some Reports
CALL sp_ResolveReport(2, 4, 'Water leakage fixed successfully. Area is now safe.');
CALL sp_ResolveReport(3, 3, 'Grade reviewed and corrected. Student satisfied with outcome.');

-- ============================================
-- COMPLEX QUERIES
-- ============================================

-- NESTED QUERY 1: Reports with above-average response time
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
ORDER BY ResponseTimeHours DESC;

-- NESTED QUERY 2: Responders handling critical reports
SELECT 
    resp.Name,
    resp.Role,
    (SELECT COUNT(*) FROM reports WHERE ResponderID = resp.ResponderID AND Priority = 'Critical') AS CriticalReports
FROM responders resp
WHERE resp.ResponderID IN (
    SELECT DISTINCT ResponderID 
    FROM reports 
    WHERE Priority = 'Critical' AND ResponderID IS NOT NULL
);

-- NESTED QUERY 3: Categories with most pending reports
SELECT 
    c.Name AS Category,
    c.Role AS ResponsibleRole,
    (SELECT COUNT(*) FROM reports r WHERE r.CategoryID = c.CategoryID AND r.Status = 'Pending') AS PendingCount
FROM categories c
WHERE (SELECT COUNT(*) FROM reports r WHERE r.CategoryID = c.CategoryID AND r.Status = 'Pending') > 0
ORDER BY PendingCount DESC;

-- JOIN QUERY 1: Comprehensive Report View
SELECT 
    r.ReportID,
    r.Description,
    r.Location,
    r.Priority,
    r.Status,
    c.Name AS Category,
    COALESCE(u.Pseudonym, 'Anonymous') AS ReportedBy,
    u.CampusDept,
    resp.Name AS AssignedTo,
    resp.Role AS ResponderRole,
    r.Timestamp AS ReportedAt,
    r.ResolvedAt
FROM reports r
INNER JOIN categories c ON r.CategoryID = c.CategoryID
LEFT JOIN users u ON r.UserID = u.UserID
LEFT JOIN responders resp ON r.ResponderID = resp.ResponderID
ORDER BY r.Timestamp DESC;

-- JOIN QUERY 2: Responder Performance Report
SELECT 
    resp.Name,
    resp.Role,
    COUNT(r.ReportID) AS TotalAssigned,
    SUM(CASE WHEN r.Status = 'Resolved' THEN 1 ELSE 0 END) AS ResolvedCount,
    SUM(CASE WHEN r.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingCount,
    AVG(TIMESTAMPDIFF(HOUR, r.Timestamp, r.ResolvedAt)) AS AvgResolutionHours,
    fn_GetResponderScore(resp.ResponderID) AS PerformanceScore
FROM responders resp
LEFT JOIN reports r ON resp.ResponderID = r.ResponderID
GROUP BY resp.ResponderID, resp.Name, resp.Role
ORDER BY PerformanceScore DESC;

-- JOIN QUERY 3: Report Action Timeline
SELECT 
    r.ReportID,
    r.Description AS ReportDescription,
    a.ActionDescription,
    a.ActionType,
    resp.Name AS ActionBy,
    a.Timestamp AS ActionTime
FROM reports r
INNER JOIN actionstaken a ON r.ReportID = a.ReportID
INNER JOIN responders resp ON a.ResponderID = resp.ResponderID
ORDER BY r.ReportID, a.Timestamp;

-- AGGREGATE QUERY 1: Category-wise Statistics
SELECT 
    c.Name AS Category,
    COUNT(r.ReportID) AS TotalReports,
    SUM(CASE WHEN r.Priority = 'Critical' THEN 1 ELSE 0 END) AS CriticalCount,
    SUM(CASE WHEN r.Status = 'Resolved' THEN 1 ELSE 0 END) AS ResolvedCount,
    AVG(TIMESTAMPDIFF(HOUR, r.Timestamp, COALESCE(r.ResolvedAt, NOW()))) AS AvgResponseHours,
    MAX(r.Timestamp) AS LatestReport
FROM categories c
LEFT JOIN reports r ON c.CategoryID = r.CategoryID
GROUP BY c.CategoryID, c.Name
HAVING COUNT(r.ReportID) > 0
ORDER BY TotalReports DESC;

-- AGGREGATE QUERY 2: Daily Report Summary
SELECT 
    DATE(Timestamp) AS ReportDate,
    COUNT(*) AS TotalReports,
    SUM(CASE WHEN Priority = 'Critical' THEN 1 ELSE 0 END) AS Critical,
    SUM(CASE WHEN Priority = 'High' THEN 1 ELSE 0 END) AS High,
    SUM(CASE WHEN Priority = 'Medium' THEN 1 ELSE 0 END) AS Medium,
    SUM(CASE WHEN Priority = 'Low' THEN 1 ELSE 0 END) AS Low
FROM reports
GROUP BY DATE(Timestamp)
ORDER BY ReportDate DESC;

-- AGGREGATE QUERY 3: Monthly Trend Analysis
SELECT 
    DATE_FORMAT(Timestamp, '%Y-%m') AS Month,
    COUNT(*) AS TotalReports,
    AVG(TIMESTAMPDIFF(HOUR, Timestamp, COALESCE(ResolvedAt, NOW()))) AS AvgResolutionTime,
    SUM(CASE WHEN Status = 'Resolved' THEN 1 ELSE 0 END) AS ResolvedCount,
    (SUM(CASE WHEN Status = 'Resolved' THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS ResolutionRate
FROM reports
GROUP BY DATE_FORMAT(Timestamp, '%Y-%m')
ORDER BY Month DESC;

-- ============================================
-- VIEWS FOR EASY ACCESS
-- ============================================

-- View 1: Active Reports Dashboard
CREATE VIEW vw_ActiveReports AS
SELECT 
    r.ReportID,
    r.Description,
    r.Location,
    r.Priority,
    r.Status,
    c.Name AS Category,
    COALESCE(u.Pseudonym, 'Anonymous') AS ReportedBy,
    resp.Name AS AssignedTo,
    r.Timestamp,
    TIMESTAMPDIFF(HOUR, r.Timestamp, NOW()) AS HoursSinceReport
FROM reports r
INNER JOIN categories c ON r.CategoryID = c.CategoryID
LEFT JOIN users u ON r.UserID = u.UserID
LEFT JOIN responders resp ON r.ResponderID = resp.ResponderID
WHERE r.Status IN ('Pending', 'In Progress', 'Under Review');

-- View 2: Responder Workload
CREATE VIEW vw_ResponderWorkload AS
SELECT 
    r.ResponderID,
    r.Name,
    r.Role,
    COUNT(rep.ReportID) AS ActiveReports,
    r.TotalResolved,
    fn_GetResponderScore(r.ResponderID) AS PerformanceScore
FROM responders r
LEFT JOIN reports rep ON r.ResponderID = rep.ResponderID 
    AND rep.Status IN ('Pending', 'In Progress', 'Under Review')
GROUP BY r.ResponderID, r.Name, r.Role, r.TotalResolved;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_report_status_priority ON reports(Status, Priority);
CREATE INDEX idx_report_timestamp_status ON reports(Timestamp, Status);
CREATE INDEX idx_action_report_timestamp ON actionstaken(ReportID, Timestamp);
