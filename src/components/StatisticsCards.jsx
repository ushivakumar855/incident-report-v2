// =============================================
// Shared Statistics Component
// Displays statistics cards with real-time data
// Can be used in both User and Responder dashboards
// Author: ushivakumar855
// Date: 2025-11-05
// =============================================

import React from 'react';
import { Row, Col, Card, Table, Badge, ProgressBar } from 'react-bootstrap';
import { FaChartPie, FaChartBar } from 'react-icons/fa';

/**
 * StatisticsCards Component
 * Displays summary cards for report statistics
 * 
 * @param {Object} stats - Statistics object containing total, pending, inProgress, resolved, closed
 * @param {Function} onCardClick - Optional callback when a card is clicked (for filtering)
 * @param {String} variant - 'user' or 'responder' to customize display
 */
export const StatisticsCards = ({ stats, onCardClick, variant = 'user' }) => {
    return (
        <Row className="mb-4">
            {variant === 'user' && (
                <Col md={3} sm={6} className="mb-3">
                    <Card className="text-center bg-primary text-white shadow h-100">
                        <Card.Body>
                            <h3>{stats.total || 0}</h3>
                            <p className="mb-0">Total Reports</p>
                        </Card.Body>
                    </Card>
                </Col>
            )}
            
            <Col md={3} sm={6} className="mb-3">
                <Card 
                    className="text-center bg-warning text-white shadow h-100"
                    style={{ cursor: onCardClick ? 'pointer' : 'default' }}
                    onClick={() => onCardClick && onCardClick('Pending')}
                >
                    <Card.Body>
                        <h3>{stats.pending || 0}</h3>
                        <p className="mb-0">Pending</p>
                    </Card.Body>
                </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
                <Card 
                    className="text-center bg-info text-white shadow h-100"
                    style={{ cursor: onCardClick ? 'pointer' : 'default' }}
                    onClick={() => onCardClick && onCardClick('In Progress')}
                >
                    <Card.Body>
                        <h3>{stats.inProgress || 0}</h3>
                        <p className="mb-0">In Progress</p>
                    </Card.Body>
                </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-3">
                <Card 
                    className="text-center bg-success text-white shadow h-100"
                    style={{ cursor: onCardClick ? 'pointer' : 'default' }}
                    onClick={() => onCardClick && onCardClick('Resolved')}
                >
                    <Card.Body>
                        <h3>{stats.resolved || 0}</h3>
                        <p className="mb-0">Resolved</p>
                    </Card.Body>
                </Card>
            </Col>
            
            {variant === 'responder' && (
                <Col md={3} sm={6} className="mb-3">
                    <Card className="text-center bg-secondary text-white shadow h-100">
                        <Card.Body>
                            <h3>{stats.totalResponders || 0}</h3>
                            <p className="mb-0">Responders</p>
                        </Card.Body>
                    </Card>
                </Col>
            )}
        </Row>
    );
};

/**
 * DetailedStatistics Component
 * Displays detailed statistics with breakdown
 * 
 * @param {Object} stats - Statistics object
 */
export const DetailedStatistics = ({ stats }) => {
    const calculatePercentage = (count, total) => {
        return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    const resolutionRate = calculatePercentage(stats.resolved, stats.total);
    const activeReports = (stats.pending || 0) + (stats.inProgress || 0);

    return (
        <Card className="shadow">
            <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">📊 Detailed Statistics</h5>
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
                                            <td><h4><Badge bg="primary">{stats.total || 0}</Badge></h4></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Pending:</strong></td>
                                            <td><h4><Badge bg="warning">{stats.pending || 0}</Badge></h4></td>
                                        </tr>
                                        <tr>
                                            <td><strong>In Progress:</strong></td>
                                            <td><h4><Badge bg="info">{stats.inProgress || 0}</Badge></h4></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Resolved:</strong></td>
                                            <td><h4><Badge bg="success">{stats.resolved || 0}</Badge></h4></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Closed:</strong></td>
                                            <td><h4><Badge bg="secondary">{stats.closed || 0}</Badge></h4></td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    <Col md={6} className="mb-4">
                        <Card className="border-success">
                            <Card.Header className="bg-success text-white">
                                <h6 className="mb-0">
                                    <FaChartBar className="me-2" />
                                    Performance Metrics
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <div className="text-center mb-4">
                                    <h1 className="display-3 text-success">
                                        {resolutionRate}%
                                    </h1>
                                    <p className="text-muted">Resolution Rate</p>
                                    <ProgressBar 
                                        now={resolutionRate} 
                                        variant="success" 
                                        label={`${resolutionRate}%`}
                                        className="mb-3"
                                    />
                                    <small className="text-muted">
                                        {stats.resolved || 0} out of {stats.total || 0} reports resolved
                                    </small>
                                </div>
                                <hr />
                                <div className="text-center">
                                    <p className="mb-1"><strong>Active Reports:</strong></p>
                                    <h4>
                                        <Badge bg="info">{activeReports}</Badge>
                                    </h4>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

/**
 * QuickStats Component
 * Displays quick statistics summary
 * 
 * @param {Object} stats - Statistics object
 */
export const QuickStats = ({ stats }) => {
    return (
        <Row className="mb-4">
            <Col md={3} sm={6} className="mb-3">
                <Card className="text-center h-100 shadow-sm">
                    <Card.Body>
                        <FaChartPie size={40} className="text-primary mb-2" />
                        <h2 className="display-4">{stats.total || 0}</h2>
                        <p className="text-muted mb-0">Total Reports</p>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
                <Card className="text-center h-100 shadow-sm">
                    <Card.Body>
                        <FaChartBar size={40} className="text-warning mb-2" />
                        <h2 className="display-4">{stats.pending || 0}</h2>
                        <p className="text-muted mb-0">Pending</p>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
                <Card className="text-center h-100 shadow-sm">
                    <Card.Body>
                        <FaChartBar size={40} className="text-info mb-2" />
                        <h2 className="display-4">{stats.inProgress || 0}</h2>
                        <p className="text-muted mb-0">In Progress</p>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
                <Card className="text-center h-100 shadow-sm">
                    <Card.Body>
                        <FaChartBar size={40} className="text-success mb-2" />
                        <h2 className="display-4">{stats.resolved || 0}</h2>
                        <p className="text-muted mb-0">Resolved</p>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default QuickStats;
