import { useState } from "react";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { motion } from "framer-motion";

import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../../firebase";

import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,

        email,

        password,
      );
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* TOP */}

      <div className="login-top">
        <div className="login-top-glow" />

        <div className="login-logo-row">
          <div className="login-logo-sm">S</div>

          <div>
            <h1 className="login-app-name">Sharma Jewellers</h1>

            <p className="login-welcome">Premium Jewellery System</p>
          </div>
        </div>
      </div>

      {/* FORM */}

      <form className="login-body" onSubmit={handleLogin}>
        {/* EMAIL */}

        <div className="login-field">
          <label className="login-label">Email</label>

          <div className="login-input-wrap">
            <span className="login-input-icon">
              <Mail size={18} />
            </span>

            <input
              type="email"
              className="login-input"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* PASSWORD */}

        <div className="login-field">
          <label className="login-label">Password</label>

          <div className="login-input-wrap">
            <span className="login-input-icon">
              <Lock size={18} />
            </span>

            <input
              type={showPass ? "text" : "password"}
              className="login-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="eye-toggle"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="login-error">{error}</div>}

        {/* BUTTON */}

        <motion.button
          type="submit"
          className="login-submit-btn"
          whileTap={{ scale: 0.97 }}
          disabled={loading}
        >
          {loading ? <span className="login-spinner" /> : "Login"}
        </motion.button>
      </form>
    </div>
  );
}
