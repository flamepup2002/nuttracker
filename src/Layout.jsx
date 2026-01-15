import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black">
      <style>{`
        :root {
          --background: 0 0% 0%;
          --foreground: 0 0% 100%;
          --card: 240 6% 10%;
          --card-foreground: 0 0% 100%;
          --popover: 240 6% 10%;
          --popover-foreground: 0 0% 100%;
          --primary: 330 80% 60%;
          --primary-foreground: 0 0% 100%;
          --secondary: 240 5% 15%;
          --secondary-foreground: 0 0% 100%;
          --muted: 240 5% 20%;
          --muted-foreground: 240 5% 65%;
          --accent: 280 80% 60%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 84% 60%;
          --destructive-foreground: 0 0% 100%;
          --border: 240 5% 20%;
          --input: 240 5% 20%;
          --ring: 330 80% 60%;
        }
        
        body {
          background: black;
          -webkit-tap-highlight-color: transparent;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #27272a transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 3px;
        }
        
        .slider-pink [data-orientation="horizontal"] > span:first-child {
          background: linear-gradient(to right, #ec4899, #a855f7);
        }
      `}</style>
      {children}
    </div>
  );
}