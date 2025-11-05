// =============================================
// User Dashboard Page - With Auto-Refresh Stats
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import { formatDate, handleAPIError } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import ReportCard from '../components/ReportCard';
import StatusBadge from '../components/StatusBadge';
import DashboardHeader from '../components/DashboardHeader';
import { StatisticsCards, DetailedStatistics } from '../components/StatisticsCards';
import SubmitReport from './SubmitReport';
import { FaPlus, FaList, FaChartBar, FaFilter } from 'react-icons/fa';

const UserDashboard = () => {
    const [recentReports, setRecentReports] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
    });
    const [loading, setLoading] = useState(true);
    const [showAllReports, setShowAllReports] = useState(false);
    const [showStatistics, setShowStatistics] = useState(false);
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchUserData();
    }, []);

    // ✅ FIXED: Proper calculation of statistics from actual report data
    const fetchUserData = async () => {
        setLoading(true);
        try {
            const reportsRes = await reportAPI.getAll();
            const allReportsData = reportsRes.data.data;
            
            setAllReports(allReportsData);
            setRecentReports(allReportsData.slice(0, 5));
            
            // ✅ Calculate statistics from actual report data
            const calculatedStats = {
                total: allReportsData.length,
                pending: allReportsData.filter(r => r.Status === 'Pending').length,
                inProgress: allReportsData.filter(r => r.Status === 'In Progress').length,
                resolved: allReportsData.filter(r => r.Status === 'Resolved').length,
                closed: allReportsData.filter(r => r.Status === 'Closed').length
            };
            
            setStats(calculatedStats);
            
        } catch (error) {
            console.error('Error:', handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    // ✅ Add refresh function to manually update data
    const refreshData = () => {
        fetchUserData();
    };

    const handleViewAllReports = () => {
        setShowAllReports(!showAllReports);
        setShowStatistics(false);
        setShowSubmitForm(false);
        // Refresh data when viewing all reports
        if (!showAllReports) {
            refreshData();
        }
    };

    const handleViewStatistics = () => {
        setShowStatistics(!showStatistics);
        setShowAllReports(false);
        setShowSubmitForm(false);
    };

    const handleToggleSubmitForm = () => {
        setShowSubmitForm(!showSubmitForm);
        setShowAllReports(false);
        setShowStatistics(false);
    };

    const handleSubmitSuccess = (newReport) => {
        setShowSubmitForm(false);
        refreshData();
    };

    const filteredReports = filterStatus === 'All' 
        ? allReports 
        : allReports.filter(report => report.Status === filterStatus);

    if (loading) {
        return (
            <>
                <DashboardHeader />
                <LoadingSpinner message="Loading your dashboard..." />
            </>
        );
    }

    return (
        <>
            <DashboardHeader />
            <Container fluid className="my-4 px-4">
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h2>👤 User Dashboard</h2>
                                <p className="text-muted">
                                    Welcome! Manage your incident reports and track their status.
                                </p>
                            </div>
                            {/* ✅ Add Refresh Button */}
                            <Button 
                                variant="outline-primary" 
                                onClick={refreshData}
                                className="d-flex align-items-center gap-2"
                            >
                                🔄 Refresh Data
                            </Button>
                        </div>
                    </Col>
                </Row>

                {/* Quick Actions */}
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5 className="mb-3">Quick Actions</h5>
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>
                                                <FaFilter className="me-2" />
                                                Filter by Status
                                            </Form.Label>
                                            <Form.Select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                            >
                                                <option value="All">All Status</option>
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Closed">Closed</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="d-flex gap-3 flex-wrap">
                                    <Button 
                                        onClick={handleToggleSubmitForm}
                                        variant={showSubmitForm ? "primary" : "outline-primary"}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaPlus /> {showSubmitForm ? 'Hide' : 'Submit New Report'}
                                    </Button>
                                    <Button 
                                        onClick={handleViewAllReports}
                                        variant={showAllReports ? "primary" : "outline-primary"}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaList /> {showAllReports ? 'Hide' : 'View'} All Reports
                                    </Button>
                                    <Button 
                                        onClick={handleViewStatistics}
                                        variant={showStatistics ? "secondary" : "outline-secondary"}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaChartBar /> {showStatistics ? 'Hide' : 'View'} Statistics
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Statistics Cards - ✅ Now showing correct real-time data using shared component */}
                <StatisticsCards 
                    stats={stats}
                    variant="user"
                    onCardClick={(status) => {
                        setFilterStatus(status);
                        setShowAllReports(true);
                        setShowStatistics(false);
                    }}
                />

                {/* Submit Report Form - Shown when button clicked */}
                {showSubmitForm && (
                    <Row className="mb-4">
                        <Col>
                            <Card className="shadow">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
                                    <h5 className="mb-0">📝 Submit New Report</h5>
                                    <Button 
                                        variant="light" 
                                        size="sm"
                                        onClick={() => setShowSubmitForm(false)}
                                    >
                                        Close
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    <SubmitReport 
                                        inline={true} 
                                        onSubmitSuccess={handleSubmitSuccess}
                                        onCancel={() => setShowSubmitForm(false)}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* All Reports Section - Shown when button clicked */}
                {showAllReports && (
                    <Row className="mb-4">
                        <Col>
                            <Card className="shadow">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
                                    <h5 className="mb-0">📋 All Reports ({filteredReports.length})</h5>
                                    <Button 
                                        variant="light" 
                                        size="sm"
                                        onClick={() => setShowAllReports(false)}
                                    >
                                        Close
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    {filteredReports.length === 0 ? (
                                        <div className="text-center py-5">
                                            <p className="text-muted mb-3">No reports found.</p>
                                            <Button as={Link} to="/submit" variant="primary">
                                                Submit Your First Report
                                            </Button>
                                        </div>
                                    ) : (
                                        <Table responsive hover>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Report ID</th>
                                                    <th>Description</th>
                                                    <th>Category</th>
                                                    <th>Status</th>
                                                    <th>Reporter</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredReports.map(report => (
                                                    <tr key={report.ReportID}>
                                                        <td><strong>#{report.ReportID}</strong></td>
                                                        <td>{report.Description.substring(0, 60)}...</td>
                                                        <td>
                                                            <Badge bg="secondary">
                                                                {report.CategoryName}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <StatusBadge status={report.Status} />
                                                        </td>
                                                        <td>{report.ReporterName || 'Anonymous'}</td>
                                                        <td>
                                                            <small>{formatDate(report.Timestamp)}</small>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                as={Link}
                                                                to={`/reports/${report.ReportID}`}
                                                                variant="primary"
                                                                size="sm"
                                                            >
                                                                View Details
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Statistics Section - Shown when button clicked - Using shared component */}
                {showStatistics && (
                    <Row className="mb-4">
                        <Col>
                            <Card className="shadow">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-secondary text-white">
                                    <h5 className="mb-0">📊 Detailed Statistics</h5>
                                    <Button 
                                        variant="light" 
                                        size="sm"
                                        onClick={() => setShowStatistics(false)}
                                    >
                                        Close
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    <DetailedStatistics stats={stats} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Recent Reports - Always Visible */}
                {!showAllReports && !showSubmitForm && (
                    <Row>
                        <Col>
                            <Card className="shadow">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">📋 Recent Reports</h5>
                                    <Button 
                                        onClick={handleViewAllReports}
                                        variant="outline-primary" 
                                        size="sm"
                                    >
                                        View All
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    {recentReports.length === 0 ? (
                                        <div className="text-center py-5">
                                            <p className="text-muted mb-3">No reports found.</p>
                                            <Button onClick={handleToggleSubmitForm} variant="primary">
                                                Submit Your First Report
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            {recentReports.map(report => (
                                                <ReportCard 
                                                    key={report.ReportID} 
                                                    report={report}
                                                    expandable={true}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Help Section */}
                <Row className="mt-4">
                    <Col>
                        <Card className="shadow-sm bg-light">
                            <Card.Body>
                                <h5>ℹ️ Need Help?</h5>
                                <p className="mb-2">
                                    <strong>How to report an incident:</strong>
                                </p>
                                <ol className="mb-0">
                                    <li>Click "Submit New Report" to create an incident report</li>
                                    <li>Fill in the incident details and select appropriate category</li>
                                    <li>Track your report status in "View All Reports"</li>
                                    <li>View detailed progress in each report's detail page</li>
                                </ol>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default UserDashboard;