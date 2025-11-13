import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import loginImage from '../images/etsi_informatica.png';

const Login = ({ setUser }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", form);
      setUser(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Ha ocurrido un error");
    }
  };

  return (
    <>
    <h1 className="login-title">ULL CALENDAR</h1>
    <div className="login-container">
      <div className="login-left">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" className="login-button">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
      <div className="login-right">
        <img src={loginImage} alt="Illustration de login" />
      </div>
    </div>
    </>
  );
};

export default Login;
