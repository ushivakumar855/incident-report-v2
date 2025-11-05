// =============================================
// Protected Route Component
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated but role doesn't match, show access denied
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return (
            <Container className="my-5">
                <Alert variant="danger">
                    <Alert.Heading>⛔ Access Denied</Alert.Heading>
                    <p>
                        You don't have permission to access this page. 
                        This page is only accessible to: <strong>{allowedRoles.join(', ')}</strong>
                    </p>
                    <hr />
                    <div className="d-flex gap-2">
                        <Button 
                            variant="outline-danger" 
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={() => {
                                if (userRole === 'student') {
                                    navigate('/dashboard/user');
                                } else if (userRole === 'responder') {
                                    navigate('/dashboard/responder');
                                }
                            }}
                        >
                            Go to My Dashboard
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return children;
};

export default ProtectedRoute;