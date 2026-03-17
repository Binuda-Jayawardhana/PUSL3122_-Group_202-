import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { MdChair, MdLogout, MdDashboard, MdPerson, MdInventory2 } from 'react-icons/md';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav-brand">
        <MdChair size={28} color="var(--secondary)" />
        Design Studio
      </Link>

      <div className="top-nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/" className="btn btn-ghost" style={{ padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}>
              <MdDashboard size={20} />
              Dashboard
            </Link>
            {/* <Link to="/catalog" className="btn btn-ghost" style={{ padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}>
              <MdInventory2 size={20} />
              Catalog
            </Link> */}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderLeft: '1px solid var(--border)',
              paddingLeft: '0.75rem',
              marginLeft: '0.15rem'
            }}>
              <div className="top-nav-pill">
                <MdPerson size={18} />
                <span>{user?.name}</span>
                {user?.role === 'admin' && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    borderRadius: '4px',
                    marginLeft: '4px'
                  }}>
                    Designer
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', color: 'var(--error)' }}
                title="Logout"
              >
                <MdLogout size={20} />
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
