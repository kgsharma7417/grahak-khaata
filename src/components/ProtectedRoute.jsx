import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import Login from "../pages/auth/Login";

/* =========================================
   PROTECTED ROUTE
========================================= */

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  /* =========================================
     AUTH LISTENER
  ========================================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Loading...
      </div>
    );
  }

  /* =========================================
     NOT LOGGED IN
  ========================================= */

  if (!user) {
    return <Login />;
  }

  /* =========================================
     LOGGED IN
  ========================================= */

  return children;
}
