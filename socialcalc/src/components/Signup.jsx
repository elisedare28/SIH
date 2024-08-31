import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // For displaying error messages
  
  const navigate = useNavigate();
  
  const handleClick = async (e) => {
    e.preventDefault(); // Prevent the default form submission
    
    // Basic client-side validation
    if (!email || !name || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/users/signup", {
        email,
        password,
        name
      });

      localStorage.setItem("token", response.data.token); // Save token to local storage
      navigate("/"); // Redirect to homepage after successful signup
    } catch (err) {
      console.error("Error during sign up:", err);
      setError("Failed to create an account. Please try again."); // Display error message
    }
  };

  return (
    <div className="wrapper signUp">
      <div className="illustration">
        <img src="https://img.freepik.com/premium-photo/unique-realistic-login-website-smartphone-template_1029469-218360.jpg?size=626&ext=jpg" 
        style={{ width: '28rem', height: '90rem' }} alt="illustration" />
      </div>
      <div className="form">
        <div className="heading">CREATE AN ACCOUNT</div>
        <form>
          <div>
            <label htmlFor="name">Name</label>
            <input
              onChange={(e) => setName(e.target.value)}
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name} // Control the input value
            />
          </div>
          <div>
            <label htmlFor="email">E-Mail</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email" // Changed id to 'email' for accessibility
              placeholder="Enter your email"
              value={email} // Control the input value
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password} // Control the input value
            />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error messages */}
          <button onClick={handleClick} type="button">Sign Up</button>
          <h2 align="center">OR</h2>
        </form>
        <p>
          Have an account? <Link to="/signin">Login</Link>
        </p>
      </div>
    </div>
  );
}
