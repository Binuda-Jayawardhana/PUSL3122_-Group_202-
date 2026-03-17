import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useDesignStore from '../store/designStore';
import { MdAdd, MdFormatPaint, MdSquareFoot, MdOutlineMeetingRoom, MdEdit } from 'react-icons/md';
import { MdChair } from 'react-icons/md';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { 
    designs, 
    rooms, 
    roomTemplates, 
    fetchDesigns, 
    fetchRooms, 
    fetchRoomTemplates,
    createRoom,
    createDesign,
    updateDesignName,
    deleteDesign,
    isLoading 
  } = useDesignStore();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('designs'); // 'designs' | 'templates'
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  
  // Custom room form
  const [roomForm, setRoomForm] = useState({
    name: '',
    width: 5,
    height: 3,
    depth: 4,
    shape: 'rectangular',
    wallColor: '#F5F5F5',
    floorColor: '#D2B48C'
  });

  useEffect(() => {
    fetchDesigns();
    fetchRooms();
    fetchRoomTemplates();
  }, [fetchDesigns, fetchRooms, fetchRoomTemplates]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const newRoom = await createRoom(roomForm);
    if (newRoom) {
      setShowNewRoomModal(false);
      // Directly pass the new room to create the design, 
      // avoiding state lookup that hasn't fired yet
      const designName = `${newRoom.name} Design`;
      const newDesign = await createDesign(designName, newRoom._id);
      
      if (newDesign) {
        navigate(`/design/${newDesign._id}`);
      }
    }
  };

  const handleCreateDesign = async (roomId) => {
    const room = [...rooms, ...roomTemplates].find(r => r._id === roomId);
    if (!room) return;
    
    const designName = `${room.name} Design`;
    const newDesign = await createDesign(designName, roomId);
    
    if (newDesign) {
      navigate(`/design/${newDesign._id}`);
    }
  };

  // Helper render components
  const MiniMapPreview = ({ design }) => {
    if (!design?.room) return null;
    const { width, depth, shape, wallColor, floorColor } = design.room;
    const padding = 10;
    const svgW = 200, svgH = 140;
    
    // Scale real-world meters to SVG pixels
    const sw = (svgW - padding * 2) / width;
    const sh = (svgH - padding * 2) / depth;
    const s = Math.min(sw, sh);
    const fw = width * s;
    const fh = depth * s;
    const ox = (svgW - fw) / 2;
    const oy = (svgH - fh) / 2;

    // Build the room polygon path
    let path = '';
    if (shape === 'l-shaped') {
      path = `M 0,0 L ${fw},0 L ${fw},${fh * 0.5} L ${fw * 0.5},${fh * 0.5} L ${fw * 0.5},${fh} L 0,${fh} Z`;
    } else if (shape === 't-shaped') {
      path = `M 0,0 L ${fw},0 L ${fw},${fh * 0.4} L ${fw * 0.75},${fh * 0.4} L ${fw * 0.75},${fh} L ${fw * 0.25},${fh} L ${fw * 0.25},${fh * 0.4} L 0,${fh * 0.4} Z`;
    } else if (shape === 'open-plan') {
      // Just visually represent as a floor with open edges by tweaking stroke
      path = `M 0,0 L ${fw},0 L ${fw},${fh} L 0,${fh} Z`;
    } else {
      path = `M 0,0 L ${fw},0 L ${fw},${fh} L 0,${fh} Z`;
    }

    return (
      <div style={{ backgroundColor: 'var(--primary)', height: '160px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
        <svg width={svgW} height={svgH}>
          <g transform={`translate(${ox}, ${oy})`}>
            {/* Draw Floor */}
            <path d={path} fill={floorColor || '#ddd'} />
            
            {/* Draw Walls */}
            <path d={path} fill="none" stroke={wallColor || '#444'} strokeWidth={shape === 'open-plan' ? '1' : '3'} strokeDasharray={shape === 'open-plan' ? '4,4' : 'none'} />

            {/* Draw Furniture Items */}
            {design.furnitureItems?.map(item => {
              const ix = item.x * s;
              const iy = item.z * s;
              const iw = (item.furniture?.dimensions?.width || 1) * s * (item.scaleX || 1);
              const ih = (item.furniture?.dimensions?.depth || 1) * s * (item.scaleZ || 1);
              const color = item.color || item.furniture?.defaultColor || '#888';
              
              return (
                <g key={item._id} transform={`translate(${ix}, ${iy}) rotate(${item.rotation || item.rotationY || 0})`}>
                  <rect x={-iw/2} y={-ih/2} width={iw} height={ih} fill={color} stroke="#000" strokeWidth="0.5" rx="1" />
                </g>
              );
            })}
          </g>
        </svg>
        
        {/* Overlay Count */}
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(11, 18, 32, 0.72)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
          {design.furnitureItems?.length || 0} items
        </div>
      </div>
    );
  };

  const DesignCard = ({ design }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(design.name);

    const handleSaveName = () => {
      if (editName.trim() && editName !== design.name) {
        updateDesignName(design._id, editName.trim());
      }
      setIsEditing(false);
    };

    const handleDelete = (e) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this design?')) {
        deleteDesign(design._id);
      }
    };

    return (
      <div className="card animate-fade-in" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', borderTop: '4px solid var(--secondary-light)', overflow: 'hidden' }}>
        <MiniMapPreview design={design} />
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <input 
                  autoFocus
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '1.1rem' }}
                />
              </div>
            ) : (
              <h3 
                style={{ fontSize: '1.25rem', cursor: 'pointer', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                title="Click to rename"
              >
                {design.name} <MdEdit size={14} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
              </h3>
            )}
            <button 
              onClick={handleDelete}
              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px', opacity: 0.7, marginLeft: '8px' }}
              title="Delete Design"
            >
              ✕
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdOutlineMeetingRoom size={18} /> {design.room?.name || 'Custom Room'} ({design.room?.shape})
          </p>
          
          <button 
            className="btn btn-primary" 
            onClick={() => navigate(`/design/${design._id}`)}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <MdEdit /> Continue Designing
          </button>
        </div>
      </div>
    );
  };

  const RoomCard = ({ room, isTemplate = false }) => (
    <div className="card animate-fade-in" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Visual Header representing the room */}
      <div style={{ 
        height: '120px', 
        backgroundColor: room.wallColor,
        borderBottom: `10px solid ${room.floorColor}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
         <MdOutlineMeetingRoom size={48} color="rgba(0,0,0,0.1)" />
         {isTemplate && (
                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'var(--secondary)', color: 'white', padding: '4px 12px', borderRadius: '20px', boxShadow: 'var(--shadow-md)' }}>
            TEMPLATE
          </span>
        )}
      </div>

      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>{room.name}</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '10px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dimensions</p>
            <p style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--primary)' }}>{room.width}m × {room.depth}m</p>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shape</p>
            <p style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--primary)', textTransform: 'capitalize' }}>{room.shape}</p>
          </div>
        </div>
        
        <button 
          className="btn btn-outline" 
          onClick={() => handleCreateDesign(room._id)}
          style={{ width: '100%', marginTop: 'auto' }}
        >
          <MdFormatPaint /> Start Design Here
        </button>
      </div>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Welcome back, <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>{user?.name}</span></p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '14px 28px' }}
          onClick={() => setShowNewRoomModal(true)}
        >
          <MdAdd size={22} /> New Custom Room
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '3rem' }}>
        {['designs', 'templates'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid var(--secondary)' : '3px solid transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? '600' : '500',
              textTransform: 'capitalize',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              outline: 'none'
            }}
          >
            My {tab}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '5rem' }}><div className="animate-fade-in" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading your creative space...</div></div>}

      {!isLoading && activeTab === 'designs' && (
        <>
          {designs.length === 0 ? (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '6rem 2rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem auto' }}>
                <MdFormatPaint size={40} color="var(--secondary)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No designs yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>Start your interior design journey by selecting a room template or creating a custom layout.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('templates')}>Browse Templates</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
              {designs.map(design => <DesignCard key={design._id} design={design} />)}
            </div>
          )}
        </>
      )}

      {!isLoading && activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
          {roomTemplates.map(room => <RoomCard key={room._id} room={room} isTemplate={true} />)}
        </div>
      )}

      {/* New Room Modal (Glassmorphism inspired) */}
      {showNewRoomModal && (
        <div className="animate-fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(26, 28, 32, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '3rem 2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Create Custom Room</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Define the exact dimensions of your space</p>
              </div>
              <button className="btn-ghost" onClick={() => setShowNewRoomModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', padding: '8px', marginTop: '-8px' }}>×</button>
            </div>
            
            <form onSubmit={handleCreateRoom}>
              <div className="input-group">
                <label className="input-label">Room Name</label>
                <input required type="text" className="input-field" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} placeholder="e.g. Master Bedroom" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Width (Meters)</label>
                  <input required type="number" step="0.1" min="1" max="20" className="input-field" value={roomForm.width} onChange={e => setRoomForm({...roomForm, width: Number(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Depth (Meters)</label>
                  <input required type="number" step="0.1" min="1" max="20" className="input-field" value={roomForm.depth} onChange={e => setRoomForm({...roomForm, depth: Number(e.target.value)})} />
                </div>
              </div>

              {/* Room Shape Selector */}
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label">Room Shape</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {[
                    { value: 'rectangular', label: 'Rectangular', icon: '▬' },
                    { value: 'square', label: 'Square', icon: '■' },
                    { value: 'l-shaped', label: 'L-Shaped', icon: '⌐' },
                    { value: 't-shaped', label: 'T-Shaped', icon: '⊤' },
                    { value: 'open-plan', label: 'Open Plan', icon: '◻' },
                  ].map(shape => (
                    <button
                      key={shape.value}
                      type="button"
                      onClick={() => setRoomForm({...roomForm, shape: shape.value})}
                      className={`btn ${roomForm.shape === shape.value ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '8px 16px', fontSize: '0.85rem', flex: '1 1 auto', minWidth: '100px' }}
                    >
                      <span style={{ fontSize: '1.1rem', marginRight: '4px' }}>{shape.icon}</span> {shape.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Wall Paint Color</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input type="color" className="input-field" value={roomForm.wallColor} onChange={e => setRoomForm({...roomForm, wallColor: e.target.value})} style={{ padding: '4px', height: '48px', width: '60px', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{roomForm.wallColor}</span>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Floor Material Color</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input type="color" className="input-field" value={roomForm.floorColor} onChange={e => setRoomForm({...roomForm, floorColor: e.target.value})} style={{ padding: '4px', height: '48px', width: '60px', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{roomForm.floorColor}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, backgroundColor: 'var(--background)' }} onClick={() => setShowNewRoomModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>Generate Space</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
