import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface StatusBannerProps {
  statusMsg: { text: string; type: "success" | "error" | "info" } | null;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ statusMsg }) => {
  return (
    <AnimatePresence>
      {statusMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-[4px_4px_0px_#141414] border-2 border-[#141414] px-6 py-3 flex items-center space-x-3 text-xs font-bold uppercase tracking-wider font-mono ${
            statusMsg.type === "success"
              ? "bg-emerald-100 text-[#141414]"
              : statusMsg.type === "error"
              ? "bg-rose-100 text-[#141414]"
              : "bg-blue-100 text-[#141414]"
          }`}
        >
          <div
            className={`w-3 h-3 border border-[#141414] ${
              statusMsg.type === "success"
                ? "bg-emerald-500"
                : statusMsg.type === "error"
                ? "bg-rose-500"
                : "bg-blue-500"
            }`}
          />
          <span>{statusMsg.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
