import React, { useState, useEffect } from 'react'
import Profile from './Profile'
import ScholarshipCard from './components/ScholarshipCard';
import './scholarship-dashboard.css';

const ScholarshipDashboard = ({ name, major, gpa, gradYear, classification, selectedInterests }) => {

  const [matchedScholarships, setMatchedScholarships] = useState([]);
  const [loading, setLoading] = useState(true)

  const fetchScholarships = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/scholarships');
      console.log('API Response status:', response.status); // Debug log

      const result = await response.json();
      console.log('API Response data:', result); // Debug log

      const allscholarships = result.scholarships || [];
      console.log('All scholarships from DB:', allscholarships); // Debug log

      //Take all the scholarships from the database (`allScholarships`)
      //  and the user's profile information (`name, major, gpa, gradYear, classification`), 
      // run them through the `scoreScholarships` function to figure out which scholarships they qualify for 
      // and how well they match, then store the result in a variable called `scored`
      const scored = scoreScholarships(allscholarships, {
        name,
        major,
        gpa,
        gradYear,
        classification,
        selectedInterests
      });
      setMatchedScholarships(scored);
      setLoading(false);
      console.log('Fetched scholarships:', scored);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships([name, major, gpa, gradYear, classification, selectedInterests]);
  }, []);

  if (loading) return <div>Loading scholarships...</div>;

  // Show message if no matches found
  if (matchedScholarships.length === 0) {
    return (
      <div>
        <h2>No matching scholarships found</h2>
        <p>Try updating your profile or check back later for new scholarships.</p>
      </div>
    );
  }

  function scoreScholarships(scholarships, userProfile) {
    // Debug: Show what user profile we're matching against
    console.log('User Profile for matching:', userProfile);

    // We'll check each scholarship one by one
    const scoredScholarships = scholarships.map((scholarship) => {

      console.log(`\n--- Checking scholarship: ${scholarship.title || scholarship.name} ---`);
      console.log('Scholarship requirements:', {
        major: scholarship.major,
        gpa: scholarship.gpa,
        classification: scholarship.classification,
        career_interests: scholarship.career_interests
      });

      // Start with score of 0
      let score = 0;

      // Assume they qualify unless we find a reason they don't
      let qualifies = true;

      // Store reasons why they DON'T qualify (if any)
      let disqualificationReasons = [];

      // ====== CHECK HARD REQUIREMENTS ======
      // These are YES/NO checks - either you meet them or you don't

      // 1. CHECK MAJOR REQUIREMENT
      // If scholarship requires a specific major, user must have it
      if (scholarship.major && scholarship.major !== 'any') {
        let majorList = [];

        // Check if major is stored as an array (multiple eligible majors)
        if (Array.isArray(scholarship.major)) {
          majorList = scholarship.major;
        }
        // If it's a comma-separated string, split it into an array
        else if (typeof scholarship.major === 'string' && scholarship.major.includes(',')) {
          majorList = scholarship.major.split(',').map(m => m.trim());
        }
        // Single major string
        else {
          majorList = [scholarship.major];
        }

        // Now check if user's major is in the list
        if (!majorList.includes(userProfile.major)) {
          qualifies = false;
          disqualificationReasons.push(`Requires one of: ${majorList.join(', ')}`);
          console.log(`DISQUALIFIED: Major not in eligible list (needs one of [${majorList.join(', ')}], user has ${userProfile.major})`);
        } else {
          console.log(`Major matches: ${userProfile.major} is in [${majorList.join(', ')}]`);
        }
      } else {
        console.log(`No major requirement or accepts any major`);
      }

      // 2. CHECK GPA REQUIREMENT
      // If scholarship has minimum GPA, user must meet it
      if (scholarship.gpa) {
        // Convert user's GPA to number for comparison
        const userGPA = parseFloat(userProfile.gpa);

        if (userGPA < scholarship.gpa) {
          // User's GPA is too low
          qualifies = false;
          disqualificationReasons.push(`Requires minimum ${scholarship.gpa} GPA`);
          console.log(`DISQUALIFIED: GPA too low (needs ${scholarship.gpa}, user has ${userGPA})`);
        } else {
          console.log(`GPA meets requirement: ${userGPA} >= ${scholarship.gpa}`);
        }
      } else {
        console.log(`No GPA requirement`);
      }

      // 3. CHECK CLASS YEAR/CLASSIFICATION
      // If scholarship is only for certain class years (Freshman, Sophomore, etc.)
      if (scholarship.classification && scholarship.classification !== 'any' && scholarship.classification !== '') {
        let classificationList = [];

        // If it's stored as an array in your database:
        if (Array.isArray(scholarship.classification)) {
          classificationList = scholarship.classification;
        }
        // If it's a comma-separated string, split it into an array
        else if (typeof scholarship.classification === 'string' && scholarship.classification.includes(',')) {
          classificationList = scholarship.classification.split(',').map(c => c.trim());
        }
        // Single classification string
        else {
          classificationList = [scholarship.classification];
        }

        // Now check if user's classification is in the list
        if (!classificationList.includes(userProfile.classification)) {
          qualifies = false;
          disqualificationReasons.push(`Only for ${classificationList.join(', ')}`);
          console.log(`DISQUALIFIED: Classification not in list (needs one of [${classificationList.join(', ')}], user is ${userProfile.classification})`);
        } else {
          console.log(`Classification matches: ${userProfile.classification} is in [${classificationList.join(', ')}]`);
        }
      } else {
        console.log(`No classification requirement or accepts all classifications`);
      }

      if (scholarship.career_interests && scholarship.career_interests.length > 0) {
        const interestMatch = scholarship.career_interests.some(interest =>
          userProfile.selectedInterests.includes(interest)
        );
        if (!interestMatch) {
          qualifies = false;
          disqualificationReasons.push(`Requires career interests in: ${scholarship.career_interests.join(', ')}`);
          console.log(`DISQUALIFIED: No matching career interests (needs one of ${scholarship.career_interests.join(', ')}, user has ${userProfile.selectedInterests.join(', ')})`);
        } else {
          console.log(`Career interest matches!`);
        }
      } else {
        console.log(`No career interest requirement`);
      }

      // ====== CALCULATE MATCH SCORE ======
      // Only calculate score if they actually qualify
      if (qualifies) {

        // BONUS POINTS: Perfect major match
        // If scholarship specifically wants your major, that's a great match!
        if (scholarship.required_major === userProfile.major) {
          score += 10;
        }

        // BONUS POINTS: High GPA
        // If your GPA is way above the minimum, you're a strong candidate
        if (scholarship.min_gpa) {
          const userGPA = parseFloat(userProfile.gpa);
          const gpaBuffer = userGPA - scholarship.min_gpa;

          // If GPA is 0.5 or more above minimum, add bonus points
          if (gpaBuffer >= 0.5) {
            score += 5;
          }

          // If GPA is 1.0 or more above minimum, add even more points
          if (gpaBuffer >= 1.0) {
            score += 5;
          }
        }

        if (scholarship.classification) {
          if (Array.isArray(scholarship.classification)) {
            if (scholarship.classification.includes(userProfile.classification)) {
              score += 8;
            }
          } else if (scholarship.classification === userProfile.classification) {
            score += 8;
          }
        }
        if (scholarship.major === 'any') {
          score += 3;
        }
      }

      // Return the scholarship with added matching info
      return {
        ...scholarship, // Keep all original scholarship data
        qualifies: qualifies, // true or false
        matchScore: qualifies ? score : 0, // Score only if qualified, otherwise 0
        disqualificationReasons: disqualificationReasons // Why they don't qualify
      };
    });

    // Filter: Only keep scholarships the user qualifies for
    const qualifiedOnly = scoredScholarships.filter(s => s.qualifies === true);

    // Sort: Put highest scoring scholarships first
    const sorted = qualifiedOnly.sort((a, b) => {
      // Sort by match score (highest first)
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // If scores are equal, sort by deadline (soonest first)
      return new Date(a.deadline) - new Date(b.deadline);
    });

    return sorted;
  }

  return (
    <div>
      <div>
        <h2>Welcome Back, {name}!</h2>
        <p className="text-gray-600">
          {classification} • {major} • GPA: {gpa} • Graduation Year: {gradYear}
        </p>
      </div>
      <div>
        <div className="scholarship-list">
          {matchedScholarships.map((scholarship) => (
            <ScholarshipCard
              key={scholarship.id}
              scholarship={scholarship}
            />
          ))}
        </div>
      </div>


    </div>
  )
}

export default ScholarshipDashboard