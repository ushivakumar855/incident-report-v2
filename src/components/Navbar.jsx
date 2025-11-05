// =============================================
// Navbar Component with Authentication
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { FaHome, FaPlus, FaList, FaUserShield, FaChartBar, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    
    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        navigate('/login');
    };

    return (
        <BSNavbar bg="dark" variant="dark" expand="lg" sticky="top">
            <Container>
                <BSNavbar.Brand as={Link} to="/">
                    🚨 Incident Reporting
                </BSNavbar.Brand>
                <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BSNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-center">
                        {/* Dashboard Link based on role */}
                        {userRole === 'student' && (
                            <>
                                <Nav.Link 
                                    as={Link} 
                                    to="/dashboard/user" 
                                    className={isActive('/dashboard/user')}
                                >
                                    <FaHome /> Dashboard
                                </Nav.Link>
                                <Nav.Link 
                                    as={Link} 
                                    to="/submit" 
                                    className={isActive('/submit')}
                                >
                                    <FaPlus /> Submit Report
                                </Nav.Link>
                            </>
                        )}

                        {userRole === 'responder' && (
                            <Nav.Link 
                                as={Link} 
                                to="/dashboard/responder" 
                                className={isActive('/dashboard/responder')}
                            >
                                <FaUserShield /> Responder Dashboard
                            </Nav.Link>
                        )}

                        {/* Common Links for both roles */}
                        <Nav.Link 
                            as={Link} 
                            to="/reports" 
                            className={isActive('/reports')}
                        >
                            <FaList /> View Reports
                        </Nav.Link>
                        
                        <Nav.Link 
                            as={Link} 
                            to="/stats" 
                            className={isActive('/stats')}
                        >
                            <FaChartBar /> Statistics
                        </Nav.Link>

                        {/* User Info and Logout */}
                        <Nav.Item className="d-flex align-items-center mx-2">
                            <Badge bg={userRole === 'student' ? 'primary' : 'success'} className="me-2">
                                <FaUser className="me-1" />
                                {username}
                            </Badge>
                            <Badge bg="secondary">
                                {userRole === 'student' ? 'Student' : 'Responder'}
                            </Badge>
                        </Nav.Item>

                        <Button 
                            variant="outline-light" 
                            size="sm" 
                            onClick={handleLogout}
                            className="ms-2"
                        >
                            <FaSignOutAlt /> Logout
                        </Button>
                    </Nav>
                </BSNavbar.Collapse>
            </Container>
        </BSNavbar>
    );
};

export default Navbar;