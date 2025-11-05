// =============================================
// Main App Component with Authentication (No Navbar)
// Author: ushivakumar855
// Date: 2025-11-03
// =============================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SubmitReport from './pages/SubmitReport';
import ViewReports from './pages/ViewReports';
import ReportDetails from './pages/ReportDetails';
import UserDashboard from './pages/UserDashboard';
import ResponderDashboard from './pages/ResponderDashboard';
import Statistics from './pages/Statistics';
import ProtectedRoute from './components/ProtectedRoute';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');

    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Public Route - Login */}
                    <Route path="/login" element={<Login />} />

                    {/* Default Route - Redirect to appropriate dashboard or login */}
                    <Route 
                        path="/" 
                        element={
                            isAuthenticated ? (
                                userRole === 'student' ? (
                                    <Navigate to="/dashboard/user" replace />
                                ) : (
                                    <Navigate to="/dashboard/responder" replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        } 
                    />

                    {/* Student Routes - Only accessible by students */}
                    <Route 
                        path="/dashboard/user" 
                        element={
                            <ProtectedRoute allowedRoles={['student']}>
                                <UserDashboard />
                            </ProtectedRoute>
                        } 
                    />

                    <Route 
                        path="/submit" 
                        element={
                            <ProtectedRoute allowedRoles={['student']}>
                                <SubmitReport />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Responder Routes - Only accessible by responders */}
                    <Route 
                        path="/dashboard/responder" 
                        element={
                            <ProtectedRoute allowedRoles={['responder']}>
                                <ResponderDashboard />
                            </ProtectedRoute>
                        } 
                    />


                    {/* Common Routes - Accessible by both roles */}
                    <Route 
                        path="/reports" 
                        element={
                            <ProtectedRoute allowedRoles={['student', 'responder']}>
                                <ViewReports />
                            </ProtectedRoute>
                        } 
                    />

                    <Route 
                        path="/reports/:id" 
                        element={
                            <ProtectedRoute allowedRoles={['student', 'responder']}>
                                <ReportDetails />
                            </ProtectedRoute>
                        } 
                    />

                    <Route 
                        path="/stats" 
                        element={
                            <ProtectedRoute allowedRoles={['student', 'responder']}>
                                <Statistics />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;