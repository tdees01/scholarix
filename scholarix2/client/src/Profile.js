import React, { useState } from 'react';
import axios from 'axios';
import './profile.css';

const Profile = ({ user, onProfileComplete }) => {
  const MAJORS = [
    'Art',
    'Art History',
    'Biochemistry',
    'Biology',
    'Chemistry',
    'Comparative Womens Studies',
    'Computer Science',
    'Dance Performance and Choreography',
    'Documentary Filmmaking',
    'Dual Degree Engineering',
    'Economics',
    'Elementary Education',
    'Education Studies',
    'English',
    'Environmental Sciecnes',
    'Environmental Studies',
    'French',
    'Health Science',
    'History',
    'International Studies',
    'Mathematics',
    'Music',
    'Philosophy',
    'Photography',
    'Physics',
    'Political Science',
    'Psychology',
    'Religious Studies',
    'Spanish',
    'Sociology',
    'Sociology and Anthropology',
    'Theatre and Performance'
  ];

  const CAREER_INTERESTS = [
    'Medicine',
    'Law',
    'Technology',
    'Education',
    'Entrepreneurship',
    'Research',
    'Business',
    'Public Service',
    'Arts',
    'Engineering',
    'Healthcare',
    'Non-Profit',
    'Finance',
    'Media',
    'Government',
    'Video Game Development',
    'Marketing',
    'Construction Management',
    'Human Resources',
    'Animation',
    'Script Writing',
    'Storytelling',
    'Software Engineering',
    'Audio and Music',
    'STEM',
  ]

  const CLASSIFICATIONS = [
    'First Year',
    'Sophomore',
    'Junior',
    'Senior'
  ]

  const [name, setName] = useState('')
  const [major, setMajor] = useState('');
  const [gpa, setGpa] = useState(0.0);
  const [gradYear, setGradYear] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [currentInterest, setCurrentInterest] = useState('');
  const [classification, setClassification] = useState('');
  const [message, setMessage] = useState('');

  const addInterest = (interest) => {
    if (interest && !selectedInterests.includes(interest)) {
      setSelectedInterests([...selectedInterests, interest]);
      setCurrentInterest('');
    }
  };

  const removeInterest = (interest) => {
    setSelectedInterests(selectedInterests.filter((i) => i !== interest));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    console.log('Current user object:', user); // Debug log
    if (!user || !user.id) {
      setMessage('You must be logged in to create a profile');
      return;
    }

    try {
      // Send profile data to the backend
      const profileData = {
        id: user.id,  // User ID from authentication
        name,
        major,
        gpa: parseFloat(gpa),
        gradYear: parseInt(gradYear),
        classification,
        selectedInterests  // Match the server's expected field name
      };
      console.log('Sending profile data:', profileData); // Debug log

      const response = await axios.post('/api/profile', profileData);

      console.log("Profile setup", response);

      if (response.data.success) {
        setMessage('Profile created successfully!');
        // TODO: Navigate to scholarships page or dashboard
        // You might want to redirect the user here
        onProfileComplete({
          major,
          gpa: parseFloat(gpa),
          gradYear: parseInt(gradYear),
          classification,
          selectedInterests
        });
      }
    } catch (error) {
      console.error('Profile submission error:', error);
      setMessage(error.response?.data?.message || 'Error during profile submission');
    }
  }; const isValid =
    name &&
    major &&
    gpa &&
    gradYear &&
    selectedInterests.length > 0;


  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <div className="profile-setup-header">
          <h2>Create Your Profile</h2>
          <p>Tell us about yourself to find scholarships that match your qualifications</p>
        </div>
        {message && (
          <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
        <div className="profile-setup-body">
          <form onSubmit={handleSubmit} className="profile-setup-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="major">Major</label>
              <select
                id="major"
                name="major"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Select your major</option>
                {MAJORS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="gpa">GPA</label>
                <input
                  id="gpa"
                  type="number"
                  max="4.0"
                  name="GPA"
                  value={gpa}
                  step="0.01"
                  placeholder="3.50"
                  onChange={(e) => setGpa(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">Graduation Year</label>
                <input
                  id="year"
                  type="number"
                  min="2025"
                  max="2030"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  placeholder="2026"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="classification">Classification</label>
              <select
                id="classification"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Select your classification</option>
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="interests">Career Interests</label>
              <select
                id="interests"
                value={currentInterest}
                onChange={(e) => addInterest(e.target.value)}
                className="form-select"
              >
                <option value="">Add career interests</option>
                {CAREER_INTERESTS.filter((i) => !selectedInterests.includes(i)).map(
                  (interest) => (
                    <option key={interest} value={interest}>
                      {interest}
                    </option>
                  )
                )}
              </select>
              <div className="interest-tags-container">
                {selectedInterests.map((interest) => (
                  <span
                    key={interest}
                    className="interest-tag"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="interest-tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="profile-setup-submit"
            >
              Find My Scholarships
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile