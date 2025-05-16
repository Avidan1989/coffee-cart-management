import React from 'react';
import "../assets/styles/About.css";
import avidanimg from '../assets/img/avidan.jpg';



/**
 * About Component
 * Input: No specific input required.
 * Output: Renders the 'About Us' page with information about the platform, team members, vision, mission, and contact details.
 */
function About() {
  return (
    <div className="about-container">
      <section className="intro-section">
        <h1>About Us</h1>
        <p>
          Welcome to the Coffee Cart Management Platform! Our goal is to provide coffee cart owners with a comprehensive tool for managing inventory, employees, sales, and maintenance efficiently. We strive to help you streamline your business operations and focus on what really matters — serving excellent coffee to your customers!
        </p>
      </section>

      <section className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-members">
         
          <div className="team-member">
            <img src={avidanimg} alt="Avidan Salomi" />
            <h3>Avidan Salomi</h3>
            <p>Founder and Developer</p>
          </div>
        </div>
      </section>

      <section className="vision-section">
        <h2>Our Vision</h2>
        <p>
          Our vision is to create a future where coffee cart owners can manage their business in a smarter and more organized way, through an intuitive platform that provides them with tools to manage inventory, employees, sales, and maintenance easily. We aim to empower coffee cart owners and help them optimize their business operations and grow, while improving the customer experience.
        </p>
      </section>

      <section className="mission-section">
        <h2>Our Mission</h2>
        <p>
          Our mission is to build a comprehensive solution for coffee cart owners that simplifies inventory, employee, sales, and maintenance management. We focus on providing easy-to-use tools tailored to the unique needs of coffee cart businesses, helping our users save time and improve business performance.
        </p>
      </section>

      <section className="contact-section">
        <h2>Contact Us</h2>
        <p>If you have any questions or feedback, feel free to <a href="/contact">reach out to us</a>!</p>
      </section>
    </div>
  );
}

export default About;
