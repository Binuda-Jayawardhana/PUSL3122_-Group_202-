import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DesignEditor from './pages/DesignEditor';
import Catalog from './pages/Catalog';
import useAuthStore from './store/authStore';
import { useEffect } from 'react';

// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <div className="loading-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  const { loadUser, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: '1.12rem', color: 'var(--primary)', fontWeight: '700' }}>
          Loading Design Studio...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container app-shell" style={{ display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/design/:id" element={
              <ProtectedRoute>
                <DesignEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/design/new/:roomId" element={
              <ProtectedRoute>
                <DesignEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/catalog" element={
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            } />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
