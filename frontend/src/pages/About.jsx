import React from 'react';

const About = () => {
  return (
    <div className="info-page">
      <h1>About AI Cold Outreach</h1>
      
      <section className="info-section">
        <h2>Who Built It & Why</h2>
        <p>
          Hi, I'm <strong>Bhushan</strong>. I'm a software tester with deep development experience, 
          and I built this tool to solve a problem I encountered personally: the repetitive, 
          time-consuming nature of high-quality outreach.
        </p>
        <p>
          This project exists to empower freelancers and designers to grow their businesses 
          without spending hours every day drafting emails.
        </p>
      </section>

      <section className="info-section">
        <h2>The Problem</h2>
        <p>
          Manual outreach is slow. When you're trying to reach dozens of businesses, writing a 
          personalized message for each one manually is exhausting. Most people end up sending 
          generic templates that get ignored, or they spend so much time personalizing that 
          they can't reach enough people to see results.
        </p>
      </section>

      <section className="info-section">
        <h2>The Solution</h2>
        <p>
          Our AI Cold Mail & Message Generator uses <strong>Google Gemini 2.5 Flash</strong> to 
          bridge the gap between scale and personalization. 
        </p>
        <ul>
          <li><strong>Bulk Processing:</strong> Paste data directly from Excel and generate content for 25+ leads at once.</li>
          <li><strong>Dynamic Personalization:</strong> The AI analyzes the business description to craft a unique pitch.</li>
          <li><strong>Optimized Workflows:</strong> Go from lead list to ready-to-send messages in seconds.</li>
        </ul>
      </section>

      <section className="info-section">
        <h2>About the Creator</h2>
        <p>
          With a background in software testing, I prioritize reliability and user experience. 
          I've combined my technical curiosity with a love for automation to build tools that 
          actually help people work smarter.
        </p>
      </section>
    </div>
  );
};

export default About;
