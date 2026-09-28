import React from "react";
import "./navbar.css";

const NAV_LINKS = [
  { label: "Marketplace", href: "#marketplace" },
  { label: "Nutrition Care", href: "#nutrition" },
  { label: "Telehealth", href: "#telehealth" },
  { label: "Resources", href: "#resources" },
];

export default function Navbar() {
  return (
    <header className="ld-navbar">
      <div className="container ld-navbar-inner">
        <div className="ld-logo">
          <span className="ld-logo-mark">
            <span className="ld-logo-green" />
            <span className="ld-logo-orange" />
            <span className="ld-logo-blue" />
          </span>
          <span className="ld-logo-text">Living Dose</span>
        </div>

        <nav className="ld-nav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ld-nav-actions">
          <button className="ld-btn-ghost">Log in</button>
          <button className="ld-btn-primary">Get Started</button>
        </div>
      </div>
    </header>
  );
}
