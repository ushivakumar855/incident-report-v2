// =============================================
// Report Card Component
// Enhanced to show expandable details
// Author: ushivakumar855
// Date: 2025-10-10
// =============================================

import React, { useState } from 'react';
import { Card, Badge, Button, Collapse, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatRelativeTime, formatDate, getStatusColor, truncateText } from '../utils/helpers';
import { getPriorityColor } from '../utils/constants';
import { FaUser, FaCalendar, FaFolder, FaComments, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';

const ReportCard = ({ report, expandable = false }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className="mb-3 shadow-sm hover-shadow">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">
                        <Link 
                            to={`/reports/${report.ReportID}`}
                            className="text-decoration-none text-dark"
                        >
                            Report #{report.ReportID}
                        </Link>
                    </Card.Title>
                    <div className="d-flex gap-2 align-items-center">
                        <Badge bg={getStatusColor(report.Status)}>
                            {report.Status}
                        </Badge>
                        {expandable && (
                            <Button 
                                size="sm" 
                                variant="outline-secondary"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? <FaChevronUp /> : <FaChevronDown />}
                            </Button>
                        )}
                    </div>
                </div>

                <Card.Text className="text-muted">
                    {truncateText(report.Description, 150)}
                </Card.Text>

                <div className="d-flex flex-wrap gap-3 text-muted small">
                    <span>
                        <FaUser className="me-1" />
                        {report.ReporterName || 'Anonymous'}
                    </span>
                    <span>
                        <FaFolder className="me-1" />
                        {report.CategoryName}
                    </span>
                    {report.Location && (
                        <span>
                            <FaMapMarkerAlt className="me-1" />
                            {report.Location}
                        </span>
                    )}
                    {report.Priority && (
                        <span>
                            <FaExclamationTriangle className="me-1" />
                            {report.Priority}
                        </span>
                    )}
                    <span>
                        <FaCalendar className="me-1" />
                        {formatRelativeTime(report.Timestamp)}
                    </span>
                    {report.ActionCount > 0 && (
                        <span>
                            <FaComments className="me-1" />
                            {report.ActionCount} {report.ActionCount === 1 ? 'action' : 'actions'}
                        </span>
                    )}
                </div>

                {/* Expandable Details Section */}
                {expandable && (
                    <Collapse in={expanded}>
                        <div className="mt-3">
                            <hr />
                            <h6 className="mb-3"><strong>Full Details:</strong></h6>
                            
                            <div className="mb-3">
                                <strong>Full Description:</strong>
                                <p className="mb-2">{report.Description}</p>
                            </div>

                            {report.Location && (
                                <div className="mb-2">
                                    <strong>Location:</strong> {report.Location}
                                </div>
                            )}

                            {report.Priority && (
                                <div className="mb-2">
                                    <strong>Priority:</strong> <Badge bg={getPriorityColor(report.Priority)}>
                                        {report.Priority}
                                    </Badge>
                                </div>
                            )}

                            <div className="mb-2">
                                <strong>Category:</strong> {report.CategoryName} ({report.CategoryRole})
                            </div>

                            <div className="mb-2">
                                <strong>Submitted:</strong> {formatDate(report.Timestamp)}
                            </div>

                            {report.AssignedResponder && (
                                <div className="mb-2">
                                    <strong>Assigned To:</strong> {report.AssignedResponder}
                                </div>
                            )}

                            {report.actions && report.actions.length > 0 && (
                                <div className="mt-3">
                                    <strong>Actions Taken ({report.actions.length}):</strong>
                                    <ListGroup className="mt-2">
                                        {report.actions.map((action, index) => (
                                            <ListGroup.Item key={index}>
                                                <div>
                                                    <Badge bg="secondary">#{index + 1}</Badge>{' '}
                                                    <strong>{action.ResponderName}</strong> - {action.ResponderRole}
                                                </div>
                                                <p className="mb-1 mt-2">{action.ActionDescription || action.actiondescription || 'No description provided'}</p>
                                                <small className="text-muted">
                                                    {formatDate(action.Timestamp || action.timestamp)}
                                                </small>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}

                            <div className="mt-3">
                                <Button
                                    as={Link}
                                    to={`/reports/${report.ReportID}`}
                                    variant="primary"
                                    size="sm"
                                >
                                    View Full Report
                                </Button>
                            </div>
                        </div>
                    </Collapse>
                )}
            </Card.Body>
        </Card>
    );
};

export default ReportCard;
