import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useStore } from "../store/useStore";
import "./AddCustomerModal.css";

export default function AddCustomerModal({ open, onClose }) {
  const addCustomer = useStore((state) => state.addCustomer);

  const [form, setForm] = useState({
    name: "",
    village: "",
    mobile: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    if (!form.name || !form.mobile) return;

    addCustomer({
      ...form,
      activeGirvi: 0,
      pendingBills: 0,
    });

    setForm({
      name: "",
      village: "",
      mobile: "",
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-card"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 22 }}
          >
            {/* TOP */}
            <div className="modal-top">
              <h3>Add Customer</h3>

              <button onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <div className="modal-form">
              <input
                name="name"
                placeholder="Customer Name"
                value={form.name}
                onChange={handleChange}
              />

              <input
                name="village"
                placeholder="Village"
                value={form.village}
                onChange={handleChange}
              />

              <input
                name="mobile"
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={handleChange}
              />

              <button className="save-btn" onClick={handleSubmit}>
                Save Customer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
