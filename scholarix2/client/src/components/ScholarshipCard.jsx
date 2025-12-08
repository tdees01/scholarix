import React from 'react'
import { useState, useEffect } from 'react';
import '../scholarship-card.css';

const ScholarshipCard = ({ scholarship }) => {

    return (
        <div className="scholarship-card">
            <div className="scholarship-card-header">
                <div className="scholarship-card-title-row">
                    <div className="scholarship-card-title-container">
                        <div className="scholarship-card-title-inner">
                            <h3>{scholarship.name || scholarship.title}</h3>
                            {/* Show match score if it exists */}
                            {scholarship.matchScore > 0 && (
                                <span className="match-badge">
                                    {scholarship.matchScore} points
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="scholarship-card-body">
                <div className="scholarship-card-meta">
                    <div className="scholarship-card-meta-item">
                        <span>Amount: ${scholarship.award_amount}</span>
                    </div>
                    <div className="scholarship-card-meta-item">
                        <span>Deadline: {scholarship.deadline}</span>
                    </div>
                    <div className="scholarship-card-meta-item">
                        <span>Essay Required? {scholarship.essay_required ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="scholarship-card-meta-item">
                        <span>Recommendation Required? {scholarship.recommendation_required ? 'Yes' : 'No'}</span>
                    </div>
                </div>

                {scholarship.prevWon && (
                    <div className="scholarship-winners">
                        <div className="scholarship-winners-content">
                            <p className="scholarship-winners-names">
                                Spelman students who won this: {scholarship.prevWon}
                            </p>
                        </div>
                    </div>
                )}

                <div className="scholarship-actions">
                    <button
                        onClick={() => window.location.href = scholarship.application_link}
                        className="scholarship-button apply-now"
                    >
                        Apply Now
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ScholarshipCard