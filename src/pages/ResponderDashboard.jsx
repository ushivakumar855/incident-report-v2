

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { reportAPI, responderAPI } from '../services/api';
import { formatDate, getStatusColor, handleAPIError } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const ResponderDashboard = () => {
    const [reports, setReports] = useState([]);
    const [responders, setResponders] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedStatus]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reportsRes, respondersRes] = await Promise.all([
                reportAPI.getByStatus(selectedStatus),
                responderAPI.getAll()
            ]);

            setReports(reportsRes.data.data);
            setResponders(respondersRes.data.data);
        } catch (error) {
            console.error('Error:', handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    return (
        <Container className="my-5">
            <Row className="mb-4">
                <Col>
                    <h2>��� Responder Dashboard</h2>
                    <p className="text-muted">
                        Manage and respond to incident reports
                    </p>
                </Col>
            </Row>

            {/* Summary Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center bg-warning text-white">
                        <Card.Body>
                            <h3>{reports.filter(r => r.Status === 'Pending').length}</h3>
                            <p className="mb-0">Pending</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center bg-info text-white">
                        <Card.Body>
                            <h3>{reports.filter(r => r.Status === 'In Progress').length}</h3>
                            <p className="mb-0">In Progress</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center bg-success text-white">
                        <Card.Body>
                            <h3>{reports.filter(r => r.Status === 'Resolved').length}</h3>
                            <p className="mb-0">Resolved</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center bg-secondary text-white">
                        <Card.Body>
                            <h3>{responders.length}</h3>
                            <p className="mb-0">Responders</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filter */}
            <Row className="mb-3">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Filter by Status</Form.Label>
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

            {/* Reports Table */}
            <Card className="shadow">
                <Card.Header>
                    <h5 className="mb-0">��� Reports - {selectedStatus} ({reports.length})</h5>
                </Card.Header>
                <Card.Body>
                    {reports.length === 0 ? (
                        <p className="text-center text-muted my-4">
                            No {selectedStatus.toLowerCase()} reports found.
                        </p>
                    ) : (
                        <Table responsive hover>
                            <thead>
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

            {/* Responders List */}
            <Card className="shadow mt-4">
                <Card.Header>
                    <h5 className="mb-0">��� Active Responders ({responders.length})</h5>
                </Card.Header>
                <Card.Body>
                    <Table responsive striped>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th>Actions Taken</th>
                                <th>Total Resolved</th>
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
                                    <td>
                                        <Badge bg="success">
                                            {responder.TotalResolved || 0} resolved
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ResponderDashboard;
