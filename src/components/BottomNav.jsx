import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Lock,
  Receipt,
  ShoppingBag,
  Calculator,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import "./BottomNav.css";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/girvi", icon: Lock, label: "Girvi" },
  { to: "/bills", icon: Receipt, label: "Bills" },
  { to: "/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/calculator", icon: Calculator, label: "Calc" },
  { to: "/more", icon: MoreHorizontal, label: "More" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink key={tab.to} to={tab.to} end className="nav-item">
              {({ isActive }) => (
                <motion.div
                  className={`nav-btn ${isActive ? "active" : ""}`}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  {/* PREMIUM FLOATING PILL BACKGROUND */}
                  {isActive && (
                    <motion.div
                      className="nav-pill"
                      layoutId="nav-pill"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* ICON - Custom Stroke for Premium Feel */}
                  <div className="nav-icon-wrapper">
                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>

                  {/* LABEL */}
                  <span>{tab.label}</span>
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
