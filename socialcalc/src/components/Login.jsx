import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page
    
    // Basic validation
    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/users/signin', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token); // Save token to local storage
      navigate('/'); // Redirect to homepage after successful login
    } catch (err) {
      console.error('Error during login:', err);
      setError('Failed to log in. Please check your credentials and try again.');
    }
  };

  return (
    <div className="wrapper signIn">
      <div className="illustration">
        <img src="https://img.freepik.com/premium-photo/unique-realistic-login-website-smartphone-template_1029469-218360.jpg?size=626&ext=jpg"
        style={{ width: '26rem', height: '40rem' }} alt="illustration" />
      </div>
      <div className="form">
        <div className="heading">LOGIN</div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error messages */}
          <button type="submit">LOG IN</button>
        </form>
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
