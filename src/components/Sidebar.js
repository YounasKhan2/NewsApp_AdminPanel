import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  BarChart,
  NewspaperIcon,
  TrendingUp,
  PlusCircle,
  FileText,
  Settings,
  UserCircle,
  LogOut,
  ChevronDown,
  Menu
} from "lucide-react";

const Sidebar = ({ setActivePage }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserDetails(profile);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (page) => {
    setActiveItem(page);
    setActivePage(page);
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      id: "dashboard"
    },
    {
      title: "Analytics",
      icon: BarChart,
      id: "analytics"
    },
    {
      title: "Trending News",
      icon: TrendingUp,
      id: "trending-news"
    },
    {
      title: "Add News",
      icon: PlusCircle,
      id: "add-news"
    },
    {
      title: "News Report",
      icon: FileText,
      id: "news-report"
    },
    {
      title: "Manage Content",
      icon: NewspaperIcon,
      id: "manage-content"
    }
  ];

  return (
    <div 
      className={`bg-gray-900 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h1 className="text-xl font-bold">News Admin</h1>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-800">
        <div 
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="flex-shrink-0">
            <UserCircle className="w-8 h-8" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userDetails?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {userDetails?.email}
              </p>
            </div>
          )}
          {!isCollapsed && <ChevronDown size={16} />}
        </div>

        {/* User Menu Dropdown */}
        {showUserMenu && !isCollapsed && (
          <div className="mt-2 py-2 px-4 bg-gray-800 rounded-md">
            <button
              onClick={() => handleNavigation('settings')}
              className="flex items-center space-x-2 text-sm py-2 px-3 w-full hover:bg-gray-700 rounded-md"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-sm py-2 px-3 w-full hover:bg-gray-700 rounded-md text-red-400"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-md transition-colors ${
              activeItem === item.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-800'
            }`}
          >
            <item.icon size={20} />
            {!isCollapsed && <span>{item.title}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>v1.0.0</span>
            <a 
              href="#" 
              className="hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('help');
              }}
            >
              Help
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;