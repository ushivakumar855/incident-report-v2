// =============================================
// User Dashboard Page - With Integrated Header
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import { formatDate, getStatusColor, handleAPIError } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import ReportCard from '../components/ReportCard';
import StatusBadge from '../components/StatusBadge';
import DashboardHeader from '../components/DashboardHeader';
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
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const [reportsRes, statsRes] = await Promise.all([
                reportAPI.getAll(),
                reportAPI.getStats()
            ]);

            const allReportsData = reportsRes.data.data;
            setAllReports(allReportsData);
            setRecentReports(allReportsData.slice(0, 5));
            
            if (statsRes.data.data && statsRes.data.data.length > 0) {
                const statsData = statsRes.data.data[0];
                setStats({
                    total: statsData.TotalReports || 0,
                    pending: statsData.PendingReports || 0,
                    inProgress: statsData.InProgressReports || 0,
                    resolved: statsData.ResolvedReports || 0,
                    closed: statsData.ClosedReports || 0
                });
            }
        } catch (error) {
            console.error('Error:', handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleViewAllReports = () => {
        setShowAllReports(!showAllReports);
        setShowStatistics(false);
    };

    const handleViewStatistics = () => {
        setShowStatistics(!showStatistics);
        setShowAllReports(false);
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
                        <h2>👤 User Dashboard</h2>
                        <p className="text-muted">
                            Welcome! Manage your incident reports and track their status.
                        </p>
                    </Col>
                </Row>

                {/* Quick Actions */}
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5 className="mb-3">Quick Actions</h5>
                                <div className="d-flex gap-3 flex-wrap">
                                    <Button 
                                        as={Link} 
                                        to="/submit" 
                                        variant="primary"
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaPlus /> Submit New Report
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

                {/* Statistics Cards */}
                <Row className="mb-4">
                    <Col md={3} sm={6} className="mb-3">
                        <Card className="text-center bg-primary text-white shadow">
                            <Card.Body>
                                <h3>{stats.total}</h3>
                                <p className="mb-0">Total Reports</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                        <Card className="text-center bg-warning text-white shadow">
                            <Card.Body>
                                <h3>{stats.pending}</h3>
                                <p className="mb-0">Pending</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                        <Card className="text-center bg-info text-white shadow">
                            <Card.Body>
                                <h3>{stats.inProgress}</h3>
                                <p className="mb-0">In Progress</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3} sm={6} className="mb-3">
                        <Card className="text-center bg-success text-white shadow">
                            <Card.Body>
                                <h3>{stats.resolved}</h3>
                                <p className="mb-0">Resolved</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

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
                                    {/* Filter Section */}
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

                {/* Statistics Section - Shown when button clicked */}
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
                                    <Row>
                                        <Col md={6} className="mb-4">
                                            <Card className="border-primary">
                                                <Card.Header className="bg-primary text-white">
                                                    <h6 className="mb-0">Report Status Breakdown</h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table borderless>
                                                        <tbody>
                                                            <tr>
                                                                <td><strong>Total Reports:</strong></td>
                                                                <td><h4><Badge bg="primary">{stats.total}</Badge></h4></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Pending:</strong></td>
                                                                <td><h4><Badge bg="warning">{stats.pending}</Badge></h4></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>In Progress:</strong></td>
                                                                <td><h4><Badge bg="info">{stats.inProgress}</Badge></h4></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Resolved:</strong></td>
                                                                <td><h4><Badge bg="success">{stats.resolved}</Badge></h4></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Closed:</strong></td>
                                                                <td><h4><Badge bg="secondary">{stats.closed}</Badge></h4></td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={6} className="mb-4">
                                            <Card className="border-success">
                                                <Card.Header className="bg-success text-white">
                                                    <h6 className="mb-0">Resolution Rate</h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="text-center">
                                                        <h1 className="display-3 text-success">
                                                            {stats.total > 0 
                                                                ? Math.round((stats.resolved / stats.total) * 100)
                                                                : 0}%
                                                        </h1>
                                                        <p className="text-muted">
                                                            {stats.resolved} out of {stats.total} reports resolved
                                                        </p>
                                                    </div>
                                                    <hr />
                                                    <div className="text-center">
                                                        <p className="mb-1"><strong>Active Reports:</strong></p>
                                                        <h4>
                                                            <Badge bg="info">
                                                                {stats.pending + stats.inProgress}
                                                            </Badge>
                                                        </h4>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Recent Reports - Always Visible */}
                {!showAllReports && (
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
                                            <Button as={Link} to="/submit" variant="primary">
                                                Submit Your First Report
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            {recentReports.map(report => (
                                                <ReportCard key={report.ReportID} report={report} />
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