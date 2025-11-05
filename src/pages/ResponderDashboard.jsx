// =============================================
// Responder Dashboard Page - With Auto-Refresh Stats
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { reportAPI, responderAPI } from '../services/api';
import { formatDate, handleAPIError } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import DashboardHeader from '../components/DashboardHeader';
import { StatisticsCards, DetailedStatistics } from '../components/StatisticsCards';
import { FaList, FaChartBar, FaFilter, FaUsers } from 'react-icons/fa';

const ResponderDashboard = () => {
    const [reports, setReports] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [responders, setResponders] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0
    });
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [loading, setLoading] = useState(true);
    const [showAllReports, setShowAllReports] = useState(false);
    const [showStatistics, setShowStatistics] = useState(false);
    const [showResponders, setShowResponders] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStatus]);

    // ✅ FIXED: Proper calculation of statistics from actual report data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [reportsRes, respondersRes, allReportsRes] = await Promise.all([
                reportAPI.getByStatus(selectedStatus),
                responderAPI.getAll(),
                reportAPI.getAll()
            ]);

            const allReportsData = allReportsRes.data.data;
            setReports(reportsRes.data.data);
            setAllReports(allReportsData);
            setResponders(respondersRes.data.data);
            
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
        fetchData();
    };

    const handleViewAllReports = () => {
        setShowAllReports(!showAllReports);
        setShowStatistics(false);
        setShowResponders(false);
        // Refresh data when viewing all reports
        if (!showAllReports) {
            refreshData();
        }
    };

    const handleViewStatistics = () => {
        setShowStatistics(!showStatistics);
        setShowAllReports(false);
        setShowResponders(false);
    };

    const handleViewResponders = () => {
        setShowResponders(!showResponders);
        setShowAllReports(false);
        setShowStatistics(false);
    };

    if (loading) {
        return (
            <>
                <DashboardHeader />
                <LoadingSpinner message="Loading dashboard..." />
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
                                <h2>🛡️ Responder Dashboard</h2>
                                <p className="text-muted">
                                    Manage and respond to incident reports
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
                                <div className="d-flex gap-3 flex-wrap">
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
                                    <Button 
                                        onClick={handleViewResponders}
                                        variant={showResponders ? "success" : "outline-success"}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaUsers /> {showResponders ? 'Hide' : 'View'} Responders
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Summary Cards - ✅ Now showing correct real-time data using shared component */}
                <StatisticsCards 
                    stats={{...stats, totalResponders: responders.length}}
                    variant="responder"
                    onCardClick={(status) => setSelectedStatus(status)}
                />

                {/* All Reports Section - Shown when button clicked */}
                {showAllReports && (
                    <Row className="mb-4">
                        <Col>
                            <Card className="shadow">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
                                    <h5 className="mb-0">📋 All Reports ({allReports.length})</h5>
                                    <Button 
                                        variant="light" 
                                        size="sm"
                                        onClick={() => setShowAllReports(false)}
                                    >
                                        Close
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    {allReports.length === 0 ? (
                                        <p className="text-center text-muted my-4">
                                            No reports found.
                                        </p>
                                    ) : (
                                        <Table responsive hover>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Category</th>
                                                    <th>Description</th>
                                                    <th>Reporter</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                    <th>Date</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allReports.map(report => (
                                                    <tr key={report.ReportID}>
                                                        <td><strong>#{report.ReportID}</strong></td>
                                                        <td>
                                                            <Badge bg="secondary">
                                                                {report.CategoryName}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            {report.Description.substring(0, 50)}...
                                                        </td>
                                                        <td>{report.ReporterName || 'Anonymous'}</td>
                                                        <td>
                                                            <StatusBadge status={report.Status} />
                                                        </td>
                                                        <td>
                                                            <Badge bg="info">
                                                                {report.ActionCount || 0} actions
                                                            </Badge>
                                                        </td>
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
                                                                View
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

                {/* Responders List - Shown when button clicked */}
                {showResponders && (
                    <Row className="mb-4">
                        <Col>
                            <Card className="shadow">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-success text-white">
                                    <h5 className="mb-0">👥 Active Responders ({responders.length})</h5>
                                    <Button 
                                        variant="light" 
                                        size="sm"
                                        onClick={() => setShowResponders(false)}
                                    >
                                        Close
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    <Table responsive striped hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Role</th>
                                                <th>Contact</th>
                                                <th>Actions Taken</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {responders.map(responder => (
                                                <tr key={responder.ResponderID}>
                                                    <td><strong>{responder.Name}</strong></td>
                                                    <td>{responder.Role}</td>
                                                    <td>{responder.ContactInfo}</td>
                                                    <td>
                                                        <Badge bg="info">
                                                            {responder.ActionCount || 0} actions
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Filter and Current Status Reports - Always Visible */}
                {!showAllReports && !showStatistics && !showResponders && (
                    <>
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>
                                        <FaFilter className="me-2" />
                                        Filter by Status
                                    </Form.Label>
                                    <Form.Select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Card className="shadow">
                            <Card.Header>
                                <h5 className="mb-0">📋 Reports - {selectedStatus} ({reports.length})</h5>
                            </Card.Header>
                            <Card.Body>
                                {reports.length === 0 ? (
                                    <p className="text-center text-muted my-4">
                                        No {selectedStatus.toLowerCase()} reports found.
                                    </p>
                                ) : (
                                    <Table responsive hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Category</th>
                                                <th>Description</th>
                                                <th>Reporter</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                                <th>Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reports.map(report => (
                                                <tr key={report.ReportID}>
                                                    <td><strong>#{report.ReportID}</strong></td>
                                                    <td>
                                                        <Badge bg="secondary">
                                                            {report.CategoryName}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {report.Description.substring(0, 50)}...
                                                    </td>
                                                    <td>{report.ReporterName || 'Anonymous'}</td>
                                                    <td>
                                                        <StatusBadge status={report.Status} />
                                                    </td>
                                                    <td>
                                                        <Badge bg="info">
                                                            {report.ActionCount || 0} actions
                                                        </Badge>
                                                    </td>
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
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </>
                )}
            </Container>
        </>
    );
};

export default ResponderDashboard;