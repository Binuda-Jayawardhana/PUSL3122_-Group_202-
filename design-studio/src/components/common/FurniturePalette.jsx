import { useEffect, useState } from 'react';
import useDesignStore from '../../store/designStore';
import { MdSearch, MdAdd, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { 
  MdChair, MdTableRestaurant, MdWeekend, MdKingBed, 
  MdShelves, MdTv, MdDesk, MdDoorSliding
} from 'react-icons/md';

// Map category to icon
const categoryIcons = {
  'chair':        MdChair,
  'armchair':     MdWeekend,
  'table':        MdTableRestaurant,
  'dining-table': MdTableRestaurant,
  'side-table':   MdTableRestaurant,
  'coffee-table': MdTableRestaurant,
  'sofa':         MdWeekend,
  'bed':          MdKingBed,
  'cupboard':     MdDoorSliding,
  'cabinet':      MdDoorSliding,
  'shelf':        MdShelves,
  'desk':         MdDesk,
  'wardrobe':     MdDoorSliding,
  'tv-unit':      MdTv,
};

const getCategoryIcon = (cat) => categoryIcons[cat] || MdChair;

// Friendly display names for categories
const categoryLabels = {
  'chair': 'Chairs',
  'armchair': 'Armchairs',
  'table': 'Tables',
  'dining-table': 'Dining Tables',
  'side-table': 'Side Tables',
  'coffee-table': 'Coffee Tables',
  'sofa': 'Sofas',
  'bed': 'Beds',
  'cupboard': 'Cupboards',
  'cabinet': 'Cabinets',
  'shelf': 'Shelves',
  'desk': 'Desks',
  'wardrobe': 'Wardrobes',
  'tv-unit': 'TV Units',
};

const FurniturePalette = ({ onAddItem }) => {
  const { furnitureCatalog, categories, fetchFurniture, fetchCategories, isLoading } = useDesignStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCats, setExpandedCats] = useState({}); // { category: true/false }

  useEffect(() => {
    if (furnitureCatalog.length === 0) fetchFurniture();
    if (categories.length === 0) fetchCategories();
  }, [furnitureCatalog.length, categories.length, fetchFurniture, fetchCategories]);

  // Group items by category
  const grouped = {};
  furnitureCatalog.forEach(item => {
    const cat = item.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    // Filter by search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)) {
        grouped[cat].push(item);
      }
    } else {
      grouped[cat].push(item);
    }
  });

  // Remove empty categories
  Object.keys(grouped).forEach(k => { if (grouped[k].length === 0) delete grouped[k]; });

  const toggleCategory = (cat) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleDragStart = (e, furniture) => {
    const dragItem = { furniture, source: 'palette' };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragItem));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddClick = (furniture) => {
    if (onAddItem) onAddItem(furniture);
  };

  if (isLoading) return <div style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Loading catalog...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--primary)' }}>
          Furniture Catalog
        </h3>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            placeholder="Search furniture..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 34px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              backgroundColor: 'var(--background)',
              color: 'var(--text-main)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Category List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.keys(grouped).sort().map(cat => {
          const items = grouped[cat];
          const isExpanded = expandedCats[cat] !== false; // Default expanded
          const CatIcon = getCategoryIcon(cat);
          const label = categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);

          return (
            <div key={cat}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 1.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'var(--primary)',
                  gap: '8px',
                  textAlign: 'left',
                }}
              >
                <CatIcon size={20} color="var(--secondary)" />
                <span style={{ flex: 1 }}>{label}</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--secondary)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                }}>
                  {items.length}
                </span>
                {isExpanded ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
              </button>

              {/* Category Items */}
              {isExpanded && (
                <div style={{ backgroundColor: 'var(--background)' }}>
                  {items.map(item => (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 1.25rem 8px 2.5rem',
                        gap: '10px',
                        cursor: 'grab',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.08)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Icon with color swatch */}
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: item.defaultColor || '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      }}>
                        <CatIcon size={18} color="rgba(255,255,255,0.9)" />
                      </div>

                      {/* Name & dimensions */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.dimensions?.width}×{item.dimensions?.depth}×{item.dimensions?.height}m
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#27ae60', fontWeight: 'bold' }}>
                          ${item.price || 0}
                        </div>
                      </div>

                      {/* Add button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddClick(item); }}
                        title={`Add ${item.name} to room`}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          border: '2px solid var(--secondary)',
                          background: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--secondary)',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--secondary)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--secondary)'; }}
                      >
                        <MdAdd size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No items match your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default FurniturePalette;
