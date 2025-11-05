// =============================================
// Dashboard Header Component
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Button, Badge } from 'react-bootstrap';
import { 
    FaUserShield, 
    FaList, 
    FaChartBar, 
    FaSignOutAlt, 
    FaUser,
    FaHome 
} from 'react-icons/fa';

const DashboardHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
            <Container fluid className="px-4">
                <Navbar.Brand className="fw-bold">
                    🚨 Incident Reporting
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="dashboard-navbar" />
                
                <Navbar.Collapse id="dashboard-navbar">
                    <Nav className="ms-auto align-items-center">
                        {/* Dashboard Home Button */}
                        <Button
                            variant={isActive(
                                userRole === 'student' 
                                    ? '/dashboard/user' 
                                    : '/dashboard/responder'
                            ) ? 'primary' : 'outline-light'}
                            size="sm"
                            className="me-2 d-flex align-items-center"
                            onClick={() => handleNavigation(
                                userRole === 'student' 
                                    ? '/dashboard/user' 
                                    : '/dashboard/responder'
                            )}
                        >
                            {userRole === 'responder' ? <FaUserShield className="me-1" /> : <FaHome className="me-1" />}
                            {userRole === 'responder' ? 'Responder Dashboard' : 'Dashboard'}
                        </Button>

                        {/* View Reports Button */}
                        <Button
                            variant={isActive('/reports') ? 'primary' : 'outline-light'}
                            size="sm"
                            className="me-2 d-flex align-items-center"
                            onClick={() => handleNavigation('/reports')}
                        >
                            <FaList className="me-1" /> View Reports
                        </Button>

                        {/* Statistics Button */}
                        <Button
                            variant={isActive('/stats') ? 'primary' : 'outline-light'}
                            size="sm"
                            className="me-2 d-flex align-items-center"
                            onClick={() => handleNavigation('/stats')}
                        >
                            <FaChartBar className="me-1" /> Statistics
                        </Button>

                        {/* User Info Badge */}
                        <Badge 
                            bg={userRole === 'student' ? 'success' : 'info'} 
                            className="me-2 px-3 py-2"
                        >
                            <FaUser className="me-1" />
                            {username}
                        </Badge>

                        {/* Role Badge */}
                        <Badge 
                            bg={userRole === 'student' ? 'primary' : 'warning'} 
                            className="me-2 px-3 py-2"
                        >
                            {userRole === 'student' ? 'Student' : 'Responder'}
                        </Badge>

                        {/* Logout Button */}
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={handleLogout}
                            className="d-flex align-items-center"
                        >
                            <FaSignOutAlt className="me-1" /> Logout
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default DashboardHeader;