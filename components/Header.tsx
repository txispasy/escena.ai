import React from 'react';
import { NavLink } from 'react-router-dom';

interface HeaderProps {
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-pink text-white' : 'text-gray-300 hover:bg-brand-light-gray'
    }`;
  
  return (
    <header className="py-4">
      <nav className="max-w-4xl mx-auto flex justify-between items-center px-4">
        <h1 
          className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-fuchsia-400 cursor-pointer"
          onClick={onLogoClick}
          title="Escena.AI"
        >
          Escena.AI
        </h1>
        <div className="flex items-center space-x-2 bg-brand-gray p-1 rounded-lg">
          <NavLink to="/" className={navLinkClass}>
            Generador
          </NavLink>
          <NavLink to="/galeria" className={navLinkClass}>
            Galería
          </NavLink>
          <NavLink to="/clasificacion" className={navLinkClass}>
            Clasificación
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Header;