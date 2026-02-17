import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { RefreshCw } from 'lucide-react';

export default function CustomPullToRefresh({ onRefresh, children }) {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      pullDownThreshold={80}
      maxPullDownDistance={100}
      resistance={2}
      refreshingContent={
        <div className="flex justify-center items-center py-4">
          <RefreshCw className="w-6 h-6 text-pink-500 animate-spin" />
        </div>
      }
      pullingContent={
        <div className="flex justify-center items-center py-4">
          <RefreshCw className="w-6 h-6 text-zinc-400" />
        </div>
      }
    >
      {children}
    </PullToRefresh>
  );
}