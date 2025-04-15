import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/image-generator">Image Generator</Link></li>
        <li><Link to="/chat">Chat</Link></li>
        <li><Link to="/nlp">NLP</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;