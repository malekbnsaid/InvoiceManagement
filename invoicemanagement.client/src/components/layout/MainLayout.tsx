import React from 'react';
import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, 
  FileText, 
  FolderKanban, 
  FileSpreadsheet,
  Users,
  BarChart, 
  Settings,
  Menu,
  X as XMarkIcon,
  Bell,
  PlusCircle,
  LogOut,
  Moon,
  Sun,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  description?: string;
  action?: boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: 'Overview and statistics'
  },
  {
    name: 'Projects',
    path: '/projects',
    icon: <FolderKanban className="h-5 w-5" />,
    description: 'Manage IT projects'
  },
  {
    name: 'Invoices',
    path: '/invoices',
    icon: <FileText className="h-5 w-5" />,
    description: 'Track and manage invoices'
  },
  {
    name: 'LPOs',
    path: '/lpos',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    description: 'Purchase orders management'
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: <BarChart className="h-5 w-5" />,
    description: 'Analytics and reporting'
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'System configuration'
  },
];

const actionItems: NavItem[] = [
  {
    name: 'New Project',
    path: '/projects/new',
    icon: <PlusCircle className="h-5 w-5" />,
    action: true
  },
  {
    name: 'Upload Invoice',
    path: '/invoices/upload',
    icon: <PlusCircle className="h-5 w-5" />,
    action: true
  }
];

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getCurrentPageName = () => {
    const currentPath = location.pathname;
    const currentItem = [...navItems, ...actionItems].find(item => item.path === currentPath);
    
    if (currentItem) {
      return currentItem.name;
    }
    
    if (currentPath.startsWith('/projects/')) {
      return 'Project Details';
    }
    
    if (currentPath.startsWith('/invoices/')) {
      if (currentPath.includes('/upload')) {
        return 'Upload Invoice';
      }
      return 'Invoice Details';
    }
    
    if (currentPath.startsWith('/lpos/')) {
      return 'LPO Details';
    }
    
    return 'Dashboard';
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-lg transform lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">IT Invoice Manager</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <nav className="px-4 pb-4">
                <div className="py-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    Navigation
                  </h3>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          location.pathname === item.path
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className={`${location.pathname === item.path ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {item.icon}
                        </span>
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="py-2 mt-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    Quick Actions
                  </h3>
                  <div className="space-y-1">
                    {actionItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="text-primary-600 dark:text-primary-400">{item.icon}</span>
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>
              
              <div className="px-4 py-2 border-t dark:border-gray-700 mt-auto">
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="ml-3">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mt-1"
                >
                  <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="ml-3">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: desktopSidebarCollapsed ? '80px' : '288px' }}
        transition={{ duration: 0.3 }}
        className={`hidden lg:flex lg:flex-col bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 overflow-hidden`}
      >
        <div className="flex items-center h-16 px-4 border-b dark:border-gray-700 justify-between">
          {!desktopSidebarCollapsed && (
            <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">IT Invoice Manager</h2>
          )}
          <button 
            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
            className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {desktopSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {!desktopSidebarCollapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
        
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="py-2">
            {!desktopSidebarCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">
                Navigation
              </h3>
            )}
            <div className="space-y-1 px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex ${desktopSidebarCollapsed ? 'justify-center' : 'justify-between'} items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`${location.pathname === item.path ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.icon}
                    </span>
                    {!desktopSidebarCollapsed && <span className="ml-3">{item.name}</span>}
                  </div>
                  {!desktopSidebarCollapsed && item.description && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden group-hover:block">
                      {item.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="py-2 mt-2">
            {!desktopSidebarCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">
                Quick Actions
              </h3>
            )}
            <div className="space-y-1 px-3">
              {actionItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex ${desktopSidebarCollapsed ? 'justify-center' : 'items-center'} px-3 py-2 text-sm font-medium rounded-lg text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors`}
                >
                  <span className="text-primary-600 dark:text-primary-400">{item.icon}</span>
                  {!desktopSidebarCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        
        <div className={`px-4 py-2 border-t dark:border-gray-700 ${desktopSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
          <button
            onClick={toggleDarkMode}
            className={`flex ${desktopSidebarCollapsed ? 'justify-center' : 'items-center'} w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
            {!desktopSidebarCollapsed && <span className="ml-3">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {user && (
            <button
              onClick={logout}
              className={`flex ${desktopSidebarCollapsed ? 'justify-center mt-2' : 'items-center'} w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${!desktopSidebarCollapsed ? 'mt-1' : ''}`}
            >
              <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              {!desktopSidebarCollapsed && <span className="ml-3">Logout</span>}
            </button>
          )}
        </div>
      </motion.aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 mr-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {getCurrentPageName()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg"
                onClick={() => navigate('/projects/new')}
              >
                <span className="sr-only">New Project</span>
                <PlusCircle className="h-6 w-6" />
              </button>
              <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-gray-700 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm">
                  {user ? user.username.substring(0, 2).toUpperCase() : 'GU'}
                </div>
                <div className="ml-2 hidden sm:block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                    {user ? user.username : 'Guest'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user ? user.role : 'No Role'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 