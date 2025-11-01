

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, ProgressBar } from 'react-bootstrap';
import { reportAPI } from '../services/api';
import { handleAPIError, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaChartPie, FaChartBar, FaList } from 'react-icons/fa';

const Statistics = () => {
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
            console.error('Error:', handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading statistics..." />;
    }

    if (!stats) {
        return <Container className="my-5">
            <p>No statistics available.</p>
        </Container>;
    }

    const calculatePercentage = (count, total) => {
        return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    };

    return (
        <Container className="my-5">
            <h2 className="mb-4">��� System Statistics</h2>

            {/* Overview Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <FaChartPie size={40} className="text-primary mb-2" />
                            <h2 className="display-4">{stats.totals.totalReports}</h2>
                            <p className="text-muted mb-0">Total Reports</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <FaChartBar size={40} className="text-success mb-2" />
                            <h2 className="display-4">{stats.totals.totalUsers}</h2>
                            <p className="text-muted mb-0">Registered Users</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <FaList size={40} className="text-info mb-2" />
                            <h2 className="display-4">{stats.totals.totalResponders}</h2>
                            <p className="text-muted mb-0">Active Responders</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <FaChartPie size={40} className="text-warning mb-2" />
                            <h2 className="display-4">{stats.totals.totalActions}</h2>
                            <p className="text-muted mb-0">Actions Taken</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Status Distribution */}
            <Card className="mb-4 shadow">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">��� Reports by Status</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Count</th>
                                <th>Percentage</th>
                                <th>Visual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.byStatus.map(item => (
                                <tr key={item.Status}>
                                    <td><strong>{item.Status}</strong></td>
                                    <td>{item.count}</td>
                                    <td>
                                        {calculatePercentage(item.count, stats.totals.totalReports)}%
                                    </td>
                                    <td>
                                        <ProgressBar 
                                            now={calculatePercentage(item.count, stats.totals.totalReports)}
                                            variant={getStatusColor(item.Status)}
                                            label={`${item.count}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Category Distribution */}
            <Card className="shadow">
                <Card.Header className="bg-success text-white">
                    <h5 className="mb-0">��� Reports by Category</h5>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Count</th>
                                <th>Percentage</th>
                                <th>Visual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.byCategory.map(item => (
                                <tr key={item.Name}>
                                    <td><strong>{item.Name}</strong></td>
                                    <td>{item.count}</td>
                                    <td>
                                        {calculatePercentage(item.count, stats.totals.totalReports)}%
                                    </td>
                                    <td>
                                        <ProgressBar 
                                            now={calculatePercentage(item.count, stats.totals.totalReports)}
                                            variant="success"
                                            label={`${item.count}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Key Metrics */}
            <Row className="mt-4">
                <Col md={6}>
                    <Card className="shadow">
                        <Card.Header className="bg-info text-white">
                            <h5 className="mb-0">��� Key Metrics</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Resolution Rate:</span>
                                <strong>
                                    {calculatePercentage(
                                        stats.byStatus.find(s => s.Status === 'Resolved')?.count || 0,
                                        stats.totals.totalReports
                                    )}%
                                </strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Pending Reports:</span>
                                <strong>
                                    {stats.byStatus.find(s => s.Status === 'Pending')?.count || 0}
                                </strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Average Actions per Report:</span>
                                <strong>
                                    {(stats.totals.totalActions / stats.totals.totalReports || 0).toFixed(2)}
                                </strong>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow">
                        <Card.Header className="bg-warning text-dark">
                            <h5 className="mb-0">⚡ Quick Stats</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Most Common Category:</span>
                                <strong>
                                    {stats.byCategory.reduce((prev, current) => 
                                        (prev.count > current.count) ? prev : current
                                    ).Name}
                                </strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Anonymous Reports:</span>
                                <strong>
                                    {stats.totals.totalReports - stats.totals.totalUsers}
                                </strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Active Categories:</span>
                                <strong>{stats.byCategory.length}</strong>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Statistics;
