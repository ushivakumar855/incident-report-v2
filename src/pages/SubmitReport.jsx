// =============================================
// Submit Report Page
// Author: ushivakumar855
// Date: 2025-10-10
// =============================================

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { reportAPI, categoryAPI, userAPI } from '../services/api';
import { handleAPIError, showSuccessToast, showErrorToast } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const SubmitReport = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        categoryId: '',
        description: '',
        isAnonymous: false,
        pseudonym: '',
        campusDept: '',
        optionalContact: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAll();
            setCategories(response.data.data);
        } catch (error) {
            showErrorToast(handleAPIError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.categoryId || !formData.description) {
            showErrorToast('Please fill in all required fields');
            return;
        }

        setSubmitting(true);

        try {
            let userId = null;

            // If not anonymous, create/get user
            if (!formData.isAnonymous && formData.pseudonym) {
                const userData = {
                    pseudonym: formData.pseudonym,
                    campusDept: formData.campusDept,
                    optionalContact: formData.optionalContact
                };
                
                const userResponse = await userAPI.create(userData);
                userId = userResponse.data.data.UserID;
            }

            // Create report
            const reportData = {
                categoryId: formData.categoryId,
                userId: userId,
                description: formData.description,
                isAnonymous: formData.isAnonymous
            };

            const response = await reportAPI.create(reportData);
            
            showSuccessToast('Report submitted successfully!');
            
            // Navigate to report details
            setTimeout(() => {
                navigate(`/reports/${response.data.data.ReportID}`);
            }, 1500);

        } catch (error) {
            showErrorToast(handleAPIError(error));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading categories..." />;
    }

    return (
        <Container className="my-5">
            <Card className="shadow">
                <Card.Header className="bg-primary text-white">
                    <h3 className="mb-0">��� Submit New Report</h3>
                </Card.Header>
                <Card.Body>
                    <Alert variant="info">
                        <strong>ℹ️ Note:</strong> You can submit reports anonymously or with your contact information.
                        All reports are confidential and handled professionally.
                    </Alert>

                    <Form onSubmit={handleSubmit}>
                        {/* Category Selection */}
                        <Form.Group className="mb-3">
                            <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a category...</option>
                                {categories.map(category => (
                                    <option key={category.CategoryID} value={category.CategoryID}>
                                        {category.Name} - {category.Role}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Choose the category that best describes your incident
                            </Form.Text>
                        </Form.Group>

                        {/* Description */}
                        <Form.Group className="mb-3">
                            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the incident in detail..."
                                required
                            />
                            <Form.Text className="text-muted">
                                Provide as much detail as possible to help us address the issue effectively
                            </Form.Text>
                        </Form.Group>

                        {/* Anonymous Checkbox */}
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                name="isAnonymous"
                                label="Submit anonymously (no contact information will be collected)"
                                checked={formData.isAnonymous}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* Contact Information (shown if not anonymous) */}
                        {!formData.isAnonymous && (
                            <Card className="mb-3 bg-light">
                                <Card.Body>
                                    <h5 className="mb-3">��� Your Information (Optional)</h5>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name/Pseudonym</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="pseudonym"
                                            value={formData.pseudonym}
                                            onChange={handleChange}
                                            placeholder="e.g., JohnDoe"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Department</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="campusDept"
                                            value={formData.campusDept}
                                            onChange={handleChange}
                                            placeholder="e.g., Computer Science"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Contact Information</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="optionalContact"
                                            value={formData.optionalContact}
                                            onChange={handleChange}
                                            placeholder="Email or phone number"
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Submit Button */}
                        <div className="d-grid gap-2">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                size="lg"
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline-secondary"
                                onClick={() => navigate('/')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SubmitReport;
