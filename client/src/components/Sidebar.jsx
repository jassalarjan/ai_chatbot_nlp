import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Image, MessageSquare, Cpu } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div
      className={`sidebar ${isHovered ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ul className="sidebar-list">
        <li>
          <Link to="/profile">
            <User className="icon" />
            {isHovered && <span>Profile</span>}
          </Link>
        </li>
        <li>
          <Link to="/image-generator">
            <Image className="icon" />
            {isHovered && <span>Image Generator</span>}
          </Link>
        </li>
        <li>
          <Link to="/chat">
            <MessageSquare className="icon" />
            {isHovered && <span>Chat</span>}
          </Link>
        </li>
        <li>
          <Link to="/nlp">
            <Cpu className="icon" />
            {isHovered && <span>NLP</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;