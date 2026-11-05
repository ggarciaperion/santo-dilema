"use client";

import { motion } from "framer-motion";

export default function PageMotionWrapper({
  children,
  color: _color = "cyan",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page content */}
      {children}
    </motion.div>
  );
}
