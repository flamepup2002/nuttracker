import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Zap, Video, ShoppingBag, User } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const location = useLocation();
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: createPageUrl('Home'), icon: Home, label: 'Home' },
    { path: null, icon: Zap, label: 'Sessions', drawer: true },
    { path: createPageUrl('GoonerCam'), icon: Video, label: 'Cam' },
    { path: createPageUrl('Shop'), icon: ShoppingBag, label: 'Shop' },
    { path: createPageUrl('Profile'), icon: User, label: 'Profile' },
  ];

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 z-50"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            if (item.drawer) {
              return (
                <Drawer key={item.label} open={sessionDrawerOpen} onOpenChange={setSessionDrawerOpen}>
                  <DrawerTrigger asChild>
                    <button
                      className="flex flex-col items-center justify-center flex-1 h-full text-zinc-400 hover:text-white transition-colors"
                    >
                      <item.icon className="w-6 h-6 mb-1" />
                      <span className="text-xs">{item.label}</span>
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
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive(item.path)
                    ? 'text-purple-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}