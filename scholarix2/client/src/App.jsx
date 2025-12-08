import React, { useState } from 'react';
import axios from 'axios';
import Profile from './Profile'
import ScholarshipDashboard from './ScholarshipDashboard';
import './App.css';
import logo from './assets/scholarix-logo-final.png';

function App() {
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================

    // Original input state variables
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    // NEW: Added password state for authentication
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Original application flow state
    const [message, setMessage] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // NEW: Added authentication mode state to toggle between register and login
    // This controls which form is displayed to the user
    const [authMode, setAuthMode] = useState('register'); // Options: 'register' or 'login'

    const [creationDate, setCreationDate] = useState('');
    const [user, setUser] = useState(null);
    // NEW: Track if profile has been created
    const [profileCreated, setProfileCreated] = useState(false);

    // NEW: Store profile data
    const [profileData, setProfileData] = useState({
        major: '',
        gpa: '',
        gradYear: '',
        classification: '',
        selectedInterests: []
    });
    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    // NEW: Callback function to handle profile submission from Profile component
    const handleProfileComplete = (data) => {
        setProfileData(data);
        setProfileCreated(true);
    };
    // NEW: Renamed from handleSubmit to handleRegister
    // Now specifically handles the registration form submission
    const handleRegister = async (e) => {
        e.preventDefault();

        // Email validation remains the same
        const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
        if (!emailPattern.test(email)) {
            setMessage('Email must end with @spelman.edu or @morehouse.edu.');
            return;
        }

        try {
            // MODIFIED: Changed endpoint from /submit to /register
            // NEW: Now sending password along with name and email
            const response = await axios.post('/register', { name, email, password });
            console.log("Registration API response:", response);
            // Added fallback message in case response doesn't include a message
            setMessage(response.data.message || 'Verification code sent to your email!');
            setIsEmailSent(true); // Show verification step
        } catch (error) {
            // IMPROVED: More detailed error message with fallback
            setMessage('Error during registration: ' + (error.response?.data?.message || error.message));
        }
    };

    // NEW: Added function to handle login form submission
    // This is completely new functionality for returning users
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // Makes API call to login endpoint with email and password
            const response = await axios.post('/login', { email, password });
            console.log("Login API response:", response);

            if (response.data.success) {
                const u = response.data.user;
                setUser(u);
                // NEW: Store user name from response if available
                setName(u?.name || 'User'); // Use name from response or default to 'User'
                setMessage('Login successful!');
                // Skip verification for login and go straight to dashboard
                setIsVerified(true);
                // Check if user already has a profile
                try {
                    const profileResponse = await axios.get(`/api/profile/${u.id}`);
                    if (profileResponse.data.success) {
                        setProfileData(profileResponse.data.profile);
                        setProfileCreated(true);
                    }
                } catch (err) {
                    // Profile doesn't exist yet, user needs to create one
                    setProfileCreated(false);
                }
            } else {
                setMessage(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            setMessage('Error during login: ' + (error.response?.data?.message || error.message));
        }
    };

    // Verify email function remains largely unchanged
    const handleVerifyEmail = async () => {
        try {
            const response = await axios.post('/verify', { email, verificationCode });
            // IMPROVED: Added fallback message
            setMessage(response.data.message || 'Email verified successfully!');
            if (response.data.success) {
                // After verify, log them in immediately with the same creds for demo flow
                try {
                    const login = await axios.post('/login', { email, password });
                    if (login.data.success) {
                        const u = login.data.user;
                        setUser(u);
                        setName(u?.name || 'User');
                        setIsVerified(true);
                    }
                } catch (e) { /* ignore */ }
            }
        } catch (error) {
            setMessage('Invalid verification code.');
        }
    };

    // MODIFIED: Logout handler now resets password state too
    const handleLogout = () => {
        // Reset all states except authMode (keeps the same tab active)
        setName('');
        setEmail('');
        setPassword(''); // NEW: Clear password on logout
        setMessage('');
        setVerificationCode('');
        setIsEmailSent(false);
        setIsVerified(false);
        setUser(null);
        setProfileCreated(false);
        setProfileData({
            major: '',
            gpa: '',
            gradYear: '',
            classification: '',
            selectedInterests: []
        });
    };

    // NEW: Function to toggle between register and login modes
    // This changes which form is displayed without changing page
    const toggleAuthMode = () => {
        setAuthMode(authMode === 'register' ? 'login' : 'register');
        setMessage(''); // Clear any messages when switching modes
    };

    // ==========================================
    // COMPONENT RENDERING FUNCTIONS
    // ==========================================

    // NEW: Separate function to render login form
    // Keeps the JSX organized and easier to maintain
    const renderLoginForm = () => (
        <div className="login-card">
            <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@spelman.edu"
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" className="login-submit-button">Login</button>
            </form>
        </div>
    );

    // NEW: Separate function to render registration form
    // Similar to original form but adds password field
    const renderRegistrationForm = () => (
        <div className="login-card">
            <form onSubmit={handleRegister} className="login-form">
                <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                        type="text"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@spelman.edu"
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                    />
                </div>
                <button type="submit" className="login-submit-button">Register</button>
            </form>
        </div>
    );

    // NEW: Separate function for verification form 
    // Extracted from original code for better organization
    const renderVerificationForm = () => (
        <div>
            <h2>Verify Your Email</h2>
            <label>Enter Verification Code</label>
            <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
            />
            <button onClick={handleVerifyEmail}>Verify</button>
        </div>
    );

    // ==========================================
    // MAIN RENDER FUNCTION
    // ==========================================
    return (
        <div className="app-container">
            <img src={logo} alt="Scholarix Logo" className="app-logo" />
            <div className="app-content">
                {/* MODIFIED: Conditional rendering now includes more logic */}
                {!isVerified ? (
                    <>
                        {/* CHANGED: Heading from "Enter Your Info" to "Welcome" */}
                        {/* <h1 className="app-header">Welcome to Scholarix</h1> */}

                        {/* Conditional rendering: Show verification form or auth forms */}
                        {isEmailSent ? (
                            renderVerificationForm()
                        ) : (
                            <>
                                {/* NEW: Tab navigation for switching between register and login */}
                                <div className="login-tabs">
                                    <button
                                        className={`login-tab ${authMode === 'register' ? 'login-tab-active' : ''}`}
                                        onClick={() => setAuthMode('register')}
                                    >
                                        Register
                                    </button>
                                    <button
                                        className={`login-tab ${authMode === 'login' ? 'login-tab-active' : ''}`}
                                        onClick={() => setAuthMode('login')}
                                    >
                                        Login
                                    </button>
                                </div>

                                {/* NEW: Conditionally render either registration or login form */}
                                {authMode === 'register' ? renderRegistrationForm() : renderLoginForm()}
                            </>
                        )}
                    </>
                ) : !profileCreated ? (
                    <Profile
                        user={user}
                        onProfileComplete={handleProfileComplete}
                        initialData={profileData.major ? { ...profileData, name: profileData.name || name } : null}
                    />
                ) : (
                    <ScholarshipDashboard
                        name={profileData.name || name}
                        major={profileData.major}
                        gpa={profileData.gpa}
                        gradYear={profileData.gradYear}
                        classification={profileData.classification}
                        selectedInterests={profileData.selectedInterests}
                        onEditProfile={() => setProfileCreated(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default App;