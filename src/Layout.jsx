import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import NotificationToast from './components/NotificationToast';
import BottomNav from './components/BottomNav';

const THEME_COLORS = {
  default: {
    primary: '330 80% 60%',
    accent: '280 80% 60%',
    ring: '330 80% 60%',
  },
  midnight: {
    primary: '217 100% 50%',
    accent: '243 75% 59%',
    ring: '217 100% 50%',
  },
  crimson: {
    primary: '0 84% 48%',
    accent: '25 95% 53%',
    ring: '0 84% 48%',
  },
  emerald: {
    primary: '160 84% 39%',
    accent: '174 83% 31%',
    ring: '160 84% 39%',
  },
  gold: {
    primary: '48 89% 50%',
    accent: '38 92% 50%',
    ring: '48 89% 50%',
  },
  neon: {
    primary: '185 100% 49%',
    accent: '280 100% 50%',
    ring: '185 100% 49%',
  },
};

export default function Layout({ children }) {
  const [activeTheme, setActiveTheme] = useState('default');

  useEffect(() => {
    const loadTheme = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (user?.active_theme) {
        setActiveTheme(user.active_theme);
      }
    };
    loadTheme();
  }, []);

  const colors = THEME_COLORS[activeTheme] || THEME_COLORS.default;

  return (
    <div className="min-h-screen bg-black">
      <NotificationToast />
      <style>{`
        :root {
          --background: 0 0% 0%;
          --foreground: 0 0% 100%;
          --card: 240 6% 10%;
          --card-foreground: 0 0% 100%;
          --popover: 240 6% 10%;
          --popover-foreground: 0 0% 100%;
          --primary: ${colors.primary};
          --primary-foreground: 0 0% 100%;
          --secondary: 240 5% 15%;
          --secondary-foreground: 0 0% 100%;
          --muted: 240 5% 20%;
          --muted-foreground: 240 5% 65%;
          --accent: ${colors.accent};
          --accent-foreground: 0 0% 100%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 0 0% 100%;
          --border: 240 5% 20%;
          --input: 240 5% 20%;
          --ring: ${colors.ring};
        }
        
        body {
          background: black;
          -webkit-tap-highlight-color: transparent;
          overscroll-behavior-y: none;
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        *::-webkit-scrollbar {
          display: none;
        }
        
        button, a, nav {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .slider-pink [data-orientation="horizontal"] > span:first-child {
          background: linear-gradient(to right, #ec4899, #a855f7);
        }
      `}</style>
      {children}
      <BottomNav />
    </div>
  );
}