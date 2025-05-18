import React, { useState } from 'react';
import './ThemeToggleButton.css';

function ThemeToggleButton({ theme, setTheme }) {
  const [anim, setAnim] = useState(false);

  const handleClick = () => {
    if (anim) return;
    setAnim(true);
    setTimeout(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      setAnim(false);
    }, 700);
  };

  return (
    <div className="theme-toggle-btn-wrap">
      <div className={`ambient ${theme} ${anim ? 'anim' : ''}`}></div>
      <button
        className={`theme-toggle-btn-unique ${theme} ${anim ? 'anim' : ''}`}
        onClick={handleClick}
        aria-label="테마 전환"
      >
        <span className="icon sun">☀️</span>
        <span className="icon moon">🌙</span>
      </button>
    </div>
  );
}

export default ThemeToggleButton;
