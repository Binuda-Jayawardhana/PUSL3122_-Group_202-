import { useEffect, useState } from 'react';
import useDesignStore from '../store/designStore';
import { MdSearch, MdCategory, MdSquareFoot } from 'react-icons/md';

const Catalog = () => {
  const { furnitureCatalog, categories, fetchFurniture, fetchCategories, isLoading } = useDesignStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchFurniture();
    fetchCategories();
  }, [fetchFurniture, fetchCategories]);

  // Derived state
  const filteredFurniture = furnitureCatalog.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const FurnitureCard = ({ item }) => (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', border: 'none', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ 
        height: '240px', 
        backgroundColor: '#FAFBFC', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: '8px' }}>
          <div 
            title={`Default Color: ${item.defaultColor}`}
            style={{ 
              width: 24, height: 24, borderRadius: '50%', 
              backgroundColor: item.defaultColor || '#ccc', 
              border: '2px solid white',
              boxShadow: 'var(--shadow-sm)'
            }} 
          />
        </div>
        
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="furniture-img" />
        ) : (
          <div style={{ 
            width: '120px', height: '120px', 
            backgroundColor: item.defaultColor || '#ccc', 
            borderRadius: '16px', 
            boxShadow: 'var(--shadow-lg)',
            border: '4px solid white',
            transform: 'rotate(-5deg) scale(1.1)',
            transition: 'var(--transition)'
          }} className="furniture-box" />
        )}
      </div>
      
      <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>{item.name}</h3>
          <span style={{ 
            fontSize: '0.75rem', 
            padding: '4px 10px', 
            backgroundColor: 'var(--background)',
            color: 'var(--primary)',
            fontWeight: '600',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {item.category}
          </span>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.6' }}>
          {item.description || "A masterfully crafted piece ready to elevate your premium interior space."}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '500' }}>
            <MdSquareFoot size={18} color="var(--secondary)" />
            {item.dimensions?.width}m × {item.dimensions?.depth}m
          </div>
          
          <button className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
            Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Furniture Collection</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Curated premium assets ready for your 2D and 3D scenes.</p>
      </header>

      {/* Filters and Search */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ flex: '1 1 350px', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: '16px', color: 'var(--primary)' }} size={24} />
          <input 
            type="text" 
            placeholder="Search by name or description..." 
            className="input-field" 
            style={{ width: '100%', paddingLeft: '50px', margin: 0, height: '54px', fontSize: '1.05rem', backgroundColor: 'var(--surface)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${selectedCategory === 'All' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedCategory('All')}
            style={{ padding: '8px 20px', fontSize: '0.95rem', backgroundColor: selectedCategory === 'All' ? '' : 'var(--surface)' }}
          >
            All
          </button>
          
          {categories.map(cat => (
            <button 
              key={cat}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ padding: '8px 20px', fontSize: '0.95rem', textTransform: 'capitalize', whiteSpace: 'nowrap', backgroundColor: selectedCategory === cat ? '' : 'var(--surface)' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}><div className="animate-fade-in" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading catalog...</div></div>
      ) : (
        <>
          {filteredFurniture.length === 0 ? (
            <div className="animate-fade-in card" style={{ textAlign: 'center', padding: '6rem 2rem', backgroundColor: 'var(--surface)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem auto' }}>
                <MdCategory size={40} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No items found</h3>
              <p style={{ color: 'var(--text-muted)' }}>We couldn't find any furniture matching your current filters.</p>
              <button className="btn btn-outline" style={{ marginTop: '1.5rem' }} onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>Clear Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {filteredFurniture.map(item => (
                <FurnitureCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Catalog;
