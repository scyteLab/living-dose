import React from "react";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="ld-footer">
      <div className="container ld-footer-inner">
        <p>&copy; {new Date().getFullYear()} Living Dose. Healthy Living Made Affordable.</p>
        <div className="ld-footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}
