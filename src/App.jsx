import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import ProtectedRoute from "./components/ProtectedRoute";
import { useTheme } from "./hooks/useTheme";
import { useStore } from "./store/useStore";
import { auth } from "./firebase";

import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Contacts from "./pages/Contacts";
import Girvi from "./pages/Girvi";
import Bills from "./pages/bills/Bills";
import More from "./pages/More";
import Orders from "./pages/Orders";
import CustomerDetails from "./pages/CustomerDetails";
import Calculator from "./pages/Calculator";

import "./styles/tokens.css";
import "./App.css";

export default function App() {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let unsubListeners = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubListeners();
      if (user) {
        unsubListeners = useStore.getState().init();
      } else {
        unsubListeners = () => {};
      }
    });

    return () => {
      unsubAuth();
      unsubListeners();
    };
  }, []);

  return (
    <BrowserRouter>
      <ProtectedRoute>
        <div className="app-shell">
          <Routes>
            <Route
              path="/"
              element={<Home toggleTheme={toggleTheme} theme={theme} />}
            />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/girvi" element={<Girvi />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/more" element={<More />} />
            <Route path="/customer/:id" element={<CustomerDetails />} />
            <Route path="/calculator" element={<Calculator />} />
          </Routes>
          <BottomNav />
        </div>
      </ProtectedRoute>
    </BrowserRouter>
  );
}
