import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase";
import "./Auth.css";

const googleProvider = new GoogleAuthProvider();

export default function Login() {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
    setSuccess("");
  };

  const switchTab = (t) => {
    setTab(t);
    resetFields();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Account created! You are now logged in.");
    } catch (err) {
      if (err.code === "auth/email-already-in-use")
        setError("Email already in use.");
      else setError("Failed to create account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.18 } },
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

      {/* TAB ROW */}
      <div className="auth-tab-row">
        <button
          className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
          onClick={() => switchTab("login")}
        >
          Login
        </button>
        <button
          className={`auth-tab-btn ${tab === "signup" ? "active" : ""}`}
          onClick={() => switchTab("signup")}
        >
          Sign Up
        </button>
      </div>

      {/* ANIMATED PANELS */}
      <AnimatePresence mode="wait">
        {tab === "login" ? (
          <motion.form
            key="login"
            className="login-body"
            onSubmit={handleLogin}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <Mail size={17} />
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

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <Lock size={17} />
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
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="forgot-row">
              <button type="button" className="forgot-btn">
                Forgot password?
              </button>
            </div>

            {error && <div className="login-error">⚠ {error}</div>}
            {success && <div className="login-success">✓ {success}</div>}

            <motion.button
              type="submit"
              className="login-submit-btn"
              whileTap={{ scale: 0.97 }}
              disabled={loading}
            >
              {loading ? <span className="login-spinner" /> : "Login"}
            </motion.button>

            <div className="login-divider">
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div>

            <motion.button
              type="button"
              className="google-signin-btn"
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogle}
              disabled={loading}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </motion.form>
        ) : (
          <motion.form
            key="signup"
            className="login-body"
            onSubmit={handleSignup}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="login-field">
              <label className="login-label">Full Name</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <User size={17} />
                </span>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <Mail size={17} />
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

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <Lock size={17} />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  className="login-input"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Confirm Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <Lock size={17} />
                </span>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div className="login-error">⚠ {error}</div>}

            <motion.button
              type="submit"
              className="login-submit-btn"
              whileTap={{ scale: 0.97 }}
              disabled={loading}
            >
              {loading ? <span className="login-spinner" /> : "Create Account"}
            </motion.button>

            <div className="login-divider">
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div>

            <motion.button
              type="button"
              className="google-signin-btn"
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogle}
              disabled={loading}
            >
              <GoogleIcon />
              Sign up with Google
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
