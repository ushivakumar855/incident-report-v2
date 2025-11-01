

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Alert, ListGroup, Form } from 'react-bootstrap';
import { reportAPI, actionAPI, responderAPI } from '../services/api';
import { formatDate, getStatusColor, handleAPIError, showSuccessToast, showErrorToast } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { FaUser, FaCalendar, FaFolder, FaArrowLeft, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const ReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [responders, setResponders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showActionForm, setShowActionForm] = useState(false);
    const [actionForm, setActionForm] = useState({
        responderId: '',
        actionDescription: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [reportRes, respondersRes] = await Promise.all([
                reportAPI.getById(id),
                responderAPI.getAll()
            ]);

            setReport(reportRes.data.data);
            setResponders(respondersRes.data.data);
        } catch (error) {
            showErrorToast(handleAPIError(error));
            navigate('/reports');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await reportAPI.updateStatus(id, newStatus);
            showSuccessToast('Report status updated successfully');
            fetchData();
        } catch (error) {
            showErrorToast(handleAPIError(error));
        }
    };

    const handleDeleteReport = async () => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await reportAPI.delete(id);
                showSuccessToast('Report deleted successfully');
                navigate('/reports');
            } catch (error) {
                showErrorToast(handleAPIError(error));
            }
        }
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();

        if (!actionForm.responderId || !actionForm.actionDescription) {
            showErrorToast('Please fill in all fields');
            return;
        }

        try {
            await actionAPI.create({
                reportId: id,
                responderId: actionForm.responderId,
                actionDescription: actionForm.actionDescription
            });

            showSuccessToast('Action added successfully');
            setActionForm({ responderId: '', actionDescription: '' });
            setShowActionForm(false);
            fetchData();
        } catch (error) {
            showErrorToast(handleAPIError(error));
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading report details..." />;
    }

    if (!report) {
        return (
            <Container className="my-5">
                <Alert variant="danger">Report not found</Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5">
            {/* Back Button */}
            <Button 
                variant="outline-secondary" 
                className="mb-3"
                onClick={() => navigate('/reports')}
            >
                <FaArrowLeft /> Back to Reports
            </Button>

            {/* Report Header */}
            <Card className="mb-4 shadow">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">��� Report #{report.ReportID}</h3>
                    <StatusBadge status={report.Status} />
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <p><strong><FaUser /> Reporter:</strong> {report.ReporterName || 'Anonymous'}</p>
                            {report.ReporterDepartment && (
                                <p><strong>Department:</strong> {report.ReporterDepartment}</p>
                            )}
                            {report.ReporterContact && (
                                <p><strong>Contact:</strong> {report.ReporterContact}</p>
                            )}
                        </Col>
                        <Col md={6}>
                            <p><strong><FaFolder /> Category:</strong> {report.CategoryName}</p>
                            <p><strong>Responsible:</strong> {report.CategoryRole}</p>
                            <p><strong>Contact:</strong> {report.CategoryContact}</p>
                        </Col>
                    </Row>

                    <hr />

                    <Row>
                        <Col>
                            <p><strong><FaCalendar /> Submitted:</strong> {formatDate(report.Timestamp)}</p>
                        </Col>
                    </Row>

                    <hr />

                    <h5>Description:</h5>
                    <p className="bg-light p-3 rounded">{report.Description}</p>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                        <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleStatusChange('Resolved')}
                            disabled={report.Status === 'Resolved' || report.Status === 'Closed'}
                        >
                            <FaEdit /> Mark as Resolved
                        </Button>
                        <Button 
                            variant="info" 
                            size="sm"
                            onClick={() => handleStatusChange('In Progress')}
                            disabled={report.Status === 'In Progress'}
                        >
                            <FaEdit /> Mark as In Progress
                        </Button>
                        <Button 
                            variant="danger" 
                            size="sm"
                            onClick={handleDeleteReport}
                        >
                            <FaTrash /> Delete Report
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Actions Section */}
            <Card className="mb-4 shadow">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">��� Actions Taken ({report.actions?.length || 0})</h4>
                    <Button 
                        variant="light" 
                        size="sm"
                        onClick={() => setShowActionForm(!showActionForm)}
                    >
                        <FaPlus /> Add Action
                    </Button>
                </Card.Header>
                <Card.Body>
                    {/* Action Form */}
                    {showActionForm && (
                        <Card className="mb-3 bg-light">
                            <Card.Body>
                                <h5>Add New Action</h5>
                                <Form onSubmit={handleActionSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Responder</Form.Label>
                                        <Form.Select
                                            value={actionForm.responderId}
                                            onChange={(e) => setActionForm({
                                                ...actionForm,
                                                responderId: e.target.value
                                            })}
                                            required
                                        >
                                            <option value="">Select responder...</option>
                                            {responders.map(responder => (
                                                <option key={responder.ResponderID} value={responder.ResponderID}>
                                                    {responder.Name} - {responder.Role}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Action Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={actionForm.actionDescription}
                                            onChange={(e) => setActionForm({
                                                ...actionForm,
                                                actionDescription: e.target.value
                                            })}
                                            placeholder="Describe the action taken..."
                                            required
                                        />
                                    </Form.Group>

                                    <div className="d-flex gap-2">
                                        <Button type="submit" variant="primary">
                                            Submit Action
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="secondary"
                                            onClick={() => setShowActionForm(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Actions List */}
                    {report.actions && report.actions.length > 0 ? (
                        <ListGroup>
                            {report.actions.map((action, index) => (
                                <ListGroup.Item key={action.actionid}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 className="mb-1">
                                                <Badge bg="secondary">#{index + 1}</Badge>{' '}
                                                {action.ResponderName} - {action.ResponderRole}
                                            </h6>
                                            <p className="mb-1">{action.actiondescription}</p>
                                            <small className="text-muted">
                                                {formatDate(action.timestamp)}
                                            </small>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <Alert variant="info">
                            No actions have been taken yet. Add the first action above.
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReportDetails;
