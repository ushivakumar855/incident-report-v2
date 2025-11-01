import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { reportAPI } from '../services/api';
import { FaPlus, FaList, FaChartBar, FaExclamationTriangle } from 'react-icons/fa';

const Home = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await reportAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="my-5">
            {/* Hero Section */}
            <div className="text-center mb-5">
                <h1 className="display-4 fw-bold mb-3">
                    ��� Incident Reporting System
                </h1>
                <p className="lead text-muted">
                    Report issues, track progress, and ensure accountability
                </p>
                <p className="text-muted">
                    Welcome, <strong>Varshini</strong>
                </p>
            </div>

            {/* Quick Actions */}
            <Row className="mb-5">
                <Col md={4} className="mb-3">
                    <Card className="h-100 text-center shadow-sm">
                        <Card.Body>
                            <FaPlus size={40} className="text-primary mb-3" />
                            <Card.Title>Submit Report</Card.Title>
                            <Card.Text>
                                Report a new incident or grievance anonymously or with your details
                            </Card.Text>
                            <Button as={Link} to="/submit" variant="primary">
                                Submit Now
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} className="mb-3">
                    <Card className="h-100 text-center shadow-sm">
                        <Card.Body>
                            <FaList size={40} className="text-success mb-3" />
                            <Card.Title>View Reports</Card.Title>
                            <Card.Text>
                                Browse all submitted reports and track their status
                            </Card.Text>
                            <Button as={Link} to="/reports" variant="success">
                                View All
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4} className="mb-3">
                    <Card className="h-100 text-center shadow-sm">
                        <Card.Body>
                            <FaChartBar size={40} className="text-info mb-3" />
                            <Card.Title>Statistics</Card.Title>
                            <Card.Text>
                                View detailed analytics and insights about reports
                            </Card.Text>
                            <Button as={Link} to="/stats" variant="info">
                                View Stats
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Statistics Dashboard */}
            {!loading && stats && (
                <div>
                    <h3 className="mb-4">��� Quick Statistics</h3>
                    <Row>
                        <Col md={3} className="mb-3">
                            <Card className="text-center bg-primary text-white">
                                <Card.Body>
                                    <h2 className="display-4">{stats.totals.totalReports}</h2>
                                    <p className="mb-0">Total Reports</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3} className="mb-3">
                            <Card className="text-center bg-warning text-white">
                                <Card.Body>
                                    <h2 className="display-4">
                                        {stats.byStatus.find(s => s.Status === 'Pending')?.count || 0}
                                    </h2>
                                    <p className="mb-0">Pending</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3} className="mb-3">
                            <Card className="text-center bg-info text-white">
                                <Card.Body>
                                    <h2 className="display-4">
                                        {stats.byStatus.find(s => s.Status === 'In Progress')?.count || 0}
                                    </h2>
                                    <p className="mb-0">In Progress</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={3} className="mb-3">
                            <Card className="text-center bg-success text-white">
                                <Card.Body>
                                    <h2 className="display-4">
                                        {stats.byStatus.find(s => s.Status === 'Resolved')?.count || 0}
                                    </h2>
                                    <p className="mb-0">Resolved</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}

            {/* Features Section */}
            <div className="mt-5">
                <h3 className="mb-4">✨ Key Features</h3>
                <Row>
                    <Col md={6} className="mb-3">
                        <Card>
                            <Card.Body>
                                <h5>��� Anonymous Reporting</h5>
                                <p className="text-muted">
                                    Submit reports without revealing your identity for sensitive issues
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                        <Card>
                            <Card.Body>
                                <h5>��� Action Tracking</h5>
                                <p className="text-muted">
                                    Monitor all actions taken by responders with timestamps
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                        <Card>
                            <Card.Body>
                                <h5>��� Category Management</h5>
                                <p className="text-muted">
                                    Reports are routed to appropriate departments automatically
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                        <Card>
                            <Card.Body>
                                <h5>��� Real-time Updates</h5>
                                <p className="text-muted">
                                    Get instant updates on report status and actions
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default Home;
