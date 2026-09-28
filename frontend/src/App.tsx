import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Threats from './pages/Threats';
import Impact from './pages/Impact';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

import axios from 'axios';

// Automatically log out if the backend rejects our token (e.g., token expired or database wiped)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if it's a 401 and not from the login page itself
    if (error.response && error.response.status === 401 && !error.config.url?.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="threats" element={<Threats />} />
          <Route path="impact" element={<Impact />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
