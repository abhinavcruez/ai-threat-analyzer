import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Server, AlertTriangle, Activity, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 flex items-center space-x-2 border-b border-gray-800">
          <Shield className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold">ThreatAnalyzer</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/assets" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <Server className="h-5 w-5" />
            <span>Asset Inventory</span>
          </Link>
          <Link to="/threats" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <AlertTriangle className="h-5 w-5" />
            <span>Threat Feeds</span>
          </Link>
          <Link to="/impact" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <Activity className="h-5 w-5" />
            <span>Impact Analysis</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-800 transition-colors text-red-400 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
