import React from 'react';
import { LogOut } from 'lucide-react';

const LogoutButton = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg from-red-600 via-red-500/60 to-red-600 focus-visible:ring-red-600/20 dark:focus-visible:ring-red-600/40 bg-transparent bg-gradient-to-r [background-size:200%_auto] text-white hover:bg-[99%_center] font-semibold shadow-sm transition-all"
    >
      <LogOut size={18} />
      <span>Sign Out</span>
    </button>
  );
};

export default LogoutButton;
