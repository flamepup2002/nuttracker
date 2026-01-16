import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CAPTIONS = [
  "STROKE THAT GOON STICK",
  "GET FIRED",
  "BREAK YOUR PENIS GOONER",
  "EDGE HARDER",
  "DON'T STOP NOW",
  "GOON BRAIN ACTIVATE",
  "YOU'RE ADDICTED",
  "ONE MORE EDGE",
  "LOSE YOURSELF",
  "GOON HARDER",
  "NO THOUGHTS HEAD EMPTY",
  "PUMP FOREVER",
  "EMBRACE THE GOON",
  "MELT YOUR BRAIN",
  "BECOME THE GOON",
  "RUIN YOUR LIFE",
  "WHO NEEDS SLEEP",
  "JUST ONE MORE HOUR",
  "CANCEL YOUR PLANS",
  "CALL IN SICK",
];

export default function GoonCaptions({ isActive }) {
  const [currentCaption, setCurrentCaption] = useState('');
  const [showCaption, setShowCaption] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setShowCaption(false);
      return;
    }

    const showRandomCaption = () => {
      const randomCaption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
      setCurrentCaption(randomCaption);
      setShowCaption(true);

      // Hide after 3-5 seconds
      setTimeout(() => {
        setShowCaption(false);
      }, Math.random() * 2000 + 3000);
    };

    // Show first caption after 10-20 seconds
    const initialDelay = setTimeout(showRandomCaption, Math.random() * 10000 + 10000);

    // Then show captions every 15-30 seconds
    const interval = setInterval(() => {
      if (!showCaption) {
        showRandomCaption();
      }
    }, Math.random() * 15000 + 15000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [isActive, showCaption]);

  return (
    <AnimatePresence>
      {showCaption && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 rounded-2xl px-8 py-6 shadow-2xl border-4 border-white/30">
            <p className="text-white font-black text-3xl md:text-4xl text-center tracking-wider drop-shadow-lg">
              {currentCaption}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}