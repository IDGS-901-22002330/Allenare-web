import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ showIcons = true, username = "(username)", email = "(correo)", photoURL }) => {
  return (
    <header className="header">
      <div className="user-profile">
        <Link to="/profile">
          <img
            src={photoURL || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png?20170328184010 "}
            alt="User Avatar"
            className="avatar"
          />
        </Link>
        <div className="user-info">
          <h1>Bienvenido, {username}!</h1>
          <p>{email}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;