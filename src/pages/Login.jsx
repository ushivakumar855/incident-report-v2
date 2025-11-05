// =============================================
// Login Page Component
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaUserShield } from 'react-icons/fa';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!selectedRole) {
            setError('Please select your role');
            return;
        }

        // Store user info in localStorage
        localStorage.setItem('userRole', selectedRole);
        localStorage.setItem('username', username);
        localStorage.setItem('isAuthenticated', 'true');

        // Redirect based on role
        if (selectedRole === 'student') {
            navigate('/dashboard/user');
        } else if (selectedRole === 'responder') {
            navigate('/dashboard/responder');
        }
    };

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-lg">
                        <Card.Header className="bg-primary text-white text-center py-4">
                            <h3>🔐 Login to Incident Reporting System</h3>
                            <p className="mb-0">Select your role to continue</p>
                        </Card.Header>
                        <Card.Body className="p-4">
                            <Form onSubmit={handleLogin}>
                                {error && (
                                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                                        {error}
                                    </Alert>
                                )}

                                <Form.Group className="mb-4">
                                    <Form.Label>Your Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter your name"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        size="lg"
                                    />
                                </Form.Group>

                                <Form.Label className="mb-3">Select Your Role:</Form.Label>
                                
                                <Row className="mb-4">
                                    <Col md={6} className="mb-3 mb-md-0">
                                        <Card 
                                            className={`text-center cursor-pointer ${selectedRole === 'student' ? 'border-primary border-3' : ''}`}
                                            onClick={() => setSelectedRole('student')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Card.Body className="py-4">
                                                <FaUserGraduate size={60} className="text-primary mb-3" />
                                                <h5>Student</h5>
                                                <p className="text-muted small mb-0">
                                                    Report and track incidents
                                                </p>
                                                <Form.Check
                                                    type="radio"
                                                    name="role"
                                                    value="student"
                                                    checked={selectedRole === 'student'}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="mt-3"
                                                    label="Select Student Role"
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    
                                    <Col md={6}>
                                        <Card 
                                            className={`text-center cursor-pointer ${selectedRole === 'responder' ? 'border-success border-3' : ''}`}
                                            onClick={() => setSelectedRole('responder')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Card.Body className="py-4">
                                                <FaUserShield size={60} className="text-success mb-3" />
                                                <h5>Responder</h5>
                                                <p className="text-muted small mb-0">
                                                    Manage and respond to incidents
                                                </p>
                                                <Form.Check
                                                    type="radio"
                                                    name="role"
                                                    value="responder"
                                                    checked={selectedRole === 'responder'}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="mt-3"
                                                    label="Select Responder Role"
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="lg" 
                                    className="w-100"
                                >
                                    Login
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;