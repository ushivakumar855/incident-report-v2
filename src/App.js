import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SubmitReport from './pages/SubmitReport';
import ViewReports from './pages/ViewReports';
import ReportDetails from './pages/ReportDetails';
import ResponderDashboard from './pages/ResponderDashboard';
import Statistics from './pages/Statistics';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/submit" element={<SubmitReport />} />
                    <Route path="/reports" element={<ViewReports />} />
                    <Route path="/reports/:id" element={<ReportDetails />} />
                    <Route path="/responder" element={<ResponderDashboard />} />
                    <Route path="/stats" element={<Statistics />} />
                </Routes>
                
                <footer className="bg-dark text-white text-center py-3 mt-5">
                    <p className="mb-0">
                        © 2025 Incident Reporting System | Developed by <strong>Varshini</strong>
                    </p>
                    <small className="text-muted">Database: myapp | Version 1.0.0</small>
                </footer>
            </div>
        </Router>
    );
}

export default App;