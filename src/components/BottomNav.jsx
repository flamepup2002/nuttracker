import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Zap, Video, ShoppingBag, User, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const isActive = (path) => location.pathname === path;

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (currentY > lastScrollY.current + 10) {
            setHidden(true);
          } else if (currentY < lastScrollY.current - 5) {
            setHidden(false);
          }
          lastScrollY.current = currentY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: createPageUrl('Home'), icon: Home, label: 'Home' },
    { path: null, icon: Zap, label: 'Sessions', drawer: true },
    { path: createPageUrl('GoonerCam'), icon: Video, label: 'Cam' },
    { path: createPageUrl('Shop'), icon: ShoppingBag, label: 'Shop' },
    { path: createPageUrl('Profile'), icon: User, label: 'Me' },
  ];

  return (
    <>
      {/* Toggle pill — always visible so user can bring nav back */}
      <button
        onClick={() => setHidden(h => !h)}
        className="fixed z-50 transition-all duration-300"
        style={{
          bottom: hidden ? '8px' : '54px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <div className="bg-zinc-800/90 backdrop-blur border border-zinc-700/60 rounded-full px-3 py-0.5 flex items-center gap-1">
          {hidden
            ? <ChevronUp className="w-3 h-3 text-zinc-400" />
            : <ChevronDown className="w-3 h-3 text-zinc-400" />}
        </div>
      </button>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/60 z-40 transition-transform duration-300"
        style={{
          transform: hidden ? 'translateY(100%)' : 'translateY(0)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-12">
          {navItems.map((item) => {
            if (item.drawer) {
              return (
                <Drawer key={item.label} open={sessionDrawerOpen} onOpenChange={setSessionDrawerOpen}>
                  <DrawerTrigger asChild>
                    <button className="flex flex-col items-center justify-center flex-1 h-full text-zinc-500 hover:text-white transition-colors gap-0.5">
                      <item.icon className="w-5 h-5" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Choose Session Type</DrawerTitle>
                      <DrawerDescription>Select the type of session you want to start</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-3">
                      <Link to={createPageUrl('GoonSession')} onClick={() => setSessionDrawerOpen(false)}>
                        <Button className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <div className="text-left">
                            <p className="font-bold">Goon Session</p>
                            <p className="text-xs text-white/70">Free pleasure tracking</p>
                          </div>
                        </Button>
                      </Link>
                      <Link to={createPageUrl('FindomSession')} onClick={() => setSessionDrawerOpen(false)}>
                        <Button className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <div className="text-left">
                            <p className="font-bold">Findom Session</p>
                            <p className="text-xs text-white/70">Financial domination mode</p>
                          </div>
                        </Button>
                      </Link>
                      <DrawerClose asChild>
                        <Button variant="outline" className="w-full">Cancel</Button>
                      </DrawerClose>
                    </div>
                  </DrawerContent>
                </Drawer>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={(e) => {
                  if (isActive(item.path)) {
                    e.preventDefault();
                    navigate(item.path, { replace: true });
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors gap-0.5 ${
                  isActive(item.path) ? 'text-purple-400' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}