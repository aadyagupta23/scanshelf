import { Link, useLocation } from "wouter";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useEffect } from "react";

interface NavbarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Navbar({ sidebarOpen, toggleSidebar }: NavbarProps) {
  const [location] = useLocation();

  // Auto-close sidebar on route/location change
  useEffect(() => {
    if (sidebarOpen) {
      toggleSidebar();
    }
  }, [location]);

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="mr-4 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-5 w-5"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-7 w-7 text-gray-900 dark:text-white" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
              <span className="text-lg font-medium text-gray-900 dark:text-white">Scanshelf</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors"
              aria-label="Scan History"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="hidden md:inline text-sm font-medium">History</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      {/* Sidebar Navigation - Notion-style */}
      <aside 
        className={`w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 fixed top-[57px] bottom-0 left-0 z-20 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="h-full flex flex-col">
          <div className="p-2 flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4">
              <div>
                <ul className="space-y-1">
                  <li>
                    <Link href="/" className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md font-medium text-sm transition-colors duration-150 ${
                        location === '/' 
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground' 
                          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-4 w-4"
                        >
                          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Home</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/books" className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md font-medium text-sm transition-colors duration-150 ${
                        location === '/books' 
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground' 
                          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-4 w-4"
                        >
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                        <span>Book Scanner</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/reading-list" className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md font-medium text-sm transition-colors duration-150 ${
                        location === '/reading-list' 
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground' 
                          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-4 w-4"
                        >
                          <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" />
                        </svg>
                        <span>Reading List</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/history" className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md font-medium text-sm transition-colors duration-150 ${
                        location === '/history' 
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground' 
                          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-4 w-4"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Scan History</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md font-medium text-sm transition-colors duration-150 ${
                        location === '/settings' 
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground' 
                          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="h-4 w-4"
                        >
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>Settings</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
        </nav>
      </aside>
      
    </>
  );
}
