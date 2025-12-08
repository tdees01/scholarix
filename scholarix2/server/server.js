// Import required modules
const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// ========================================================
// Authentication Routes using Supabase Auth
// ========================================================

// Registration endpoint using Supabase Auth
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log(`Received registration request for email: ${email}`);

  // Email validation
  const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ success: false, message: 'Email must end with @spelman.edu or @morehouse.edu.' });
  }

  try {
    // Register user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } } // Store additional user info
    });

    if (error) throw error;

    res.json({ success: true, message: 'Registration successful. Check your email for verification.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error registering user' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Received login request for email: ${email}`);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    res.json({ success: true, message: 'Login successful', user: data.user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});

// Email verification using 6-digit code
app.post('/verify', async (req, res) => {
  const { email, verificationCode } = req.body;
  console.log(`Verifying email: ${email} with code: ${verificationCode}`);

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: verificationCode,
      type: 'signup'
    });

    if (error) {
      console.error('Verification failed:', error);
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Error verifying email' });
  }
});

// Upsert (create/update) profile
app.post('/api/profile', async (req, res) => {
  try {
    const {
      id,           // user id (uuid from auth)
      name,
      major,
      gpa,
      gradYear,
      selectedInterests,
      classification
    } = req.body;

    console.log('Received profile data:', req.body); // Debug log

    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'id and name are required.' });
    }

    const profileData = {
      user_id: id,
      name,
      major,
      gpa: parseFloat(gpa),
      grad_year: parseInt(gradYear),
      career_interests: selectedInterests,
      classification
    };

    console.log('Inserting into database:', profileData); // Debug log

    const { data, error } = await supabase
      .from('profile')
      .upsert([{ user_id: id, name, major, gpa, gradYear, selectedInterests, classification }], { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error:', error); // More detailed error log
      throw error;
    }

    console.log('Profile saved successfully:', data); // Success log
    res.json({ success: true, message: 'Profile saved', profile: data });
  } catch (err) {
    console.error('Profile upsert error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get own profile
app.get('/api/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err) {
    res.status(404).json({ success: false, message: 'Profile not found' });
  }
});

// // Fallback route to serve React frontend for any unmatched routes
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/build/index.html'));
// });

app.get('/api/scholarships', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*');
    if (error) throw error;
    console.log('Fetched from Supabase:', data); // Debug log
    console.log('Number of scholarships:', data?.length); // Debug log
    res.json({ success: true, scholarships: data });
  } catch (err) {
    console.error('Error fetching scholarships:', err);
    res.status(500).json({ success: false, message: 'Error fetching scholarships' });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});