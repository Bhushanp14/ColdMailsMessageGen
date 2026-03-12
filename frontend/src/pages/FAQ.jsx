import React from 'react';

const FAQ = () => {
  const faqs = [
    {
      q: "What is the generation limit?",
      a: "Guests (unauthenticated users) can generate up to 10 emails and 10 messages. Logged-in users get a limit of 25 for each."
    },
    {
      q: "Which AI model powers this tool?",
      a: "We currently use Google Gemini 2.5 Flash, which is optimized for speed and high-quality conversational text."
    },
    {
      q: "Is my data private?",
      a: "Yes. We do not store your lead lists or generated content on our servers. All data exists in your browser session until you refresh."
    },
    {
      q: "Why use this instead of a template?",
      a: "Templates look like templates. This tool uses AI to reference the business's specific description, making the email feel like it was written specifically for them."
    },
    {
      q: "Can I export my results?",
      a: "Absolutely! Once generated, you can use the 'Export to CSV' button to save all your results for your records."
    }
  ];

  return (
    <div className="info-page">
      <h1>Frequently Asked Questions</h1>
      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <h3>{faq.q}</h3>
            <p>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
