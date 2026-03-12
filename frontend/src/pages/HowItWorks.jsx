import React from 'react';

const HowItWorks = () => {
  return (
    <div className="info-page">
      <h1>How It Works</h1>
      
      <div className="steps-container">
        <div className="step-card">
          <div className="step-num">1</div>
          <h3>Gather Your Leads</h3>
          <p>Prepare your leads in an Excel or CSV file. You only need three columns: <strong>Business Name</strong>, <strong>Description</strong>, and <strong>Location/Region</strong>.</p>
        </div>

        <div className="step-card">
          <div className="step-num">2</div>
          <h3>Bulk Paste</h3>
          <p>Copy those three columns and paste them directly into the tool's paste area. The system will automatically parse and create rows for you.</p>
        </div>

        <div className="step-card">
          <div className="step-num">3</div>
          <h3>Configure Your Pitch</h3>
          <p>Select your <strong>Role</strong> (e.g., Web Designer), pick a <strong>Tone</strong> (e.g., Casual), and indicate if you have a <strong>Demo Site</strong> ready to show.</p>
        </div>

        <div className="step-card">
          <div className="step-num">4</div>
          <h3>Generate & Export</h3>
          <p>Hit Generate. Review the AI-crafted messages in the modal views, and then export everything to a CSV file for your CRM.</p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
