import React, { useState, useEffect } from 'react';
import './index.css';

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" }
];

function App() {
  const [quote, setQuote] = useState(QUOTES[0]);
  const [animate, setAnimate] = useState(false);

  const getRandomQuote = () => {
    setAnimate(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * QUOTES.length);
      setQuote(QUOTES[randomIndex]);
      setAnimate(false);
    }, 300);
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text="${quote.text}" - ${quote.author}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="container">
      <div className="quote-icon">“</div>
      <div className={`quote-content ${animate ? 'fade-out' : 'fade-in'}`}>
        <p className="quote-text">{quote.text}</p>
        <p className="quote-author">— {quote.author}</p>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={getRandomQuote}>
          New Quote
        </button>
        <button className="btn btn-secondary" onClick={shareOnTwitter}>
          Share
        </button>
      </div>

      <div className="footer">
        DEPLOYMENT TRACKING SYSTEM • V1.0.0
      </div>
    </div>
  );
}

export default App;
