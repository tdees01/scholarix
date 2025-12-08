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
      console.log('API Response status:', response.status);

      const result = await response.json();
      console.log('API Response data:', result);

      const allscholarships = result.scholarships || [];
      console.log('All scholarships from DB:', allscholarships);

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

  if (matchedScholarships.length === 0) {
    return (
      <div>
        <h2>No matching scholarships found</h2>
        <p>Try updating your profile or check back later for new scholarships.</p>
      </div>
    );
  }

  function scoreScholarships(scholarships, userProfile) {
    console.log('User Profile for matching:', userProfile);

    const scoredScholarships = scholarships.map((scholarship) => {

      console.log(`\n--- Checking scholarship: ${scholarship.title || scholarship.name} ---`);
      console.log('Scholarship requirements:', {
        major: scholarship.major,
        gpa: scholarship.gpa,
        classification: scholarship.classification,
        career_interests: scholarship.career_interests
      });

      let score = 0;
      let qualifies = true;
      let disqualificationReasons = [];

      if (scholarship.major && scholarship.major !== 'any') {
        let majorList = [];

        
        if (Array.isArray(scholarship.major)) {
          majorList = scholarship.major;
        }
        else if (typeof scholarship.major === 'string' && scholarship.major.includes(',')) {
          majorList = scholarship.major.split(',').map(m => m.trim());
        }
        else {
          majorList = [scholarship.major];
        }

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
      if (scholarship.classification && scholarship.classification !== 'any' && scholarship.classification !== '') {
        let classificationList = [];
        // If it's a comma-separated string, split it into an array
        if (typeof scholarship.classification === 'string' && scholarship.classification.includes(',')) {
          classificationList = scholarship.classification.split(',').map(c => c.trim());
        }
        else {
          classificationList = [scholarship.classification];
        }

        // check if user's classification is in the list
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

      if (qualifies) {

        if (scholarship.required_major === userProfile.major) {
          score += 10;
        }

        if (scholarship.min_gpa) {
          const userGPA = parseFloat(userProfile.gpa);
          const gpaBuffer = userGPA - scholarship.min_gpa;

          if (gpaBuffer >= 0.5) {
            score += 5;
          }

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
      // If scores are equal, sort by deadline
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