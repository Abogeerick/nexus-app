"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

export function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-gray-200 dark:bg-gray-800"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            exit={{ width: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

