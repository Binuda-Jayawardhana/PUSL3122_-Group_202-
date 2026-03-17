import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useDesignStore from '../store/designStore';
import RoomCanvas from '../components/2D/RoomCanvas';
import Scene3D from '../components/3D/Scene3D';
import FurniturePalette from '../components/common/FurniturePalette';
import {
  MdFormatPaint, MdPalette, MdDelete, MdRotateRight,
  MdColorLens, MdArrowBack, MdUndo, MdRedo,
  MdViewInAr, MdGridOn, MdPictureAsPdf
} from 'react-icons/md';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const DesignEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentDesign, fetchDesignById, isLoading,
    selectedItemId,
    updateFurnitureItem, removeFurniture, addFurnitureToDesign
  } = useDesignStore();
  const [viewMode, setViewMode] = useState('2D');
  const [itemColor, setItemColor] = useState('#ffffff');
  const [isExporting, setIsExporting] = useState(false);
  const collisionAlertRef = useRef(new Set());
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    if (id) fetchDesignById(id);
  }, [id, fetchDesignById]);

  // Sync item color picker when selection changes
  useEffect(() => {
    if (selectedItemId && currentDesign?.furnitureItems) {
      const item = currentDesign.furnitureItems.find(i => i._id === selectedItemId);
      if (item) setItemColor(item.color || item.furniture?.defaultColor || '#ffffff');
    }
  }, [selectedItemId, currentDesign]);

  const applyItemColor = () => {
    if (currentDesign && selectedItemId) {
      updateFurnitureItem(currentDesign._id, selectedItemId, { color: itemColor });
    }
  };

  const rotateSelectedItem = (deg) => {
    if (!currentDesign || !selectedItemId) return;
    const item = currentDesign.furnitureItems.find(i => i._id === selectedItemId);
    if (!item) return;
    const currentRot = item.rotation || item.rotationY || 0;
    updateFurnitureItem(currentDesign._id, selectedItemId, { rotation: currentRot + deg });
  };

  const deleteSelectedItem = () => {
    if (currentDesign && selectedItemId) removeFurniture(currentDesign._id, selectedItemId);
  };

  // Handle clicking "+" button in Furniture Palette
  const handleAddItemFromPalette = (furniture) => {
    if (!currentDesign) return;
    // Place at center of room
    const cx = (currentDesign.room?.width || 5) / 2;
    const cz = (currentDesign.room?.depth || 5) / 2;
    addFurnitureToDesign(currentDesign._id, furniture._id, cx, cz);
  };

  const handleExportPDF = async () => {
    if (!canvasContainerRef.current || isExporting) return;
    setIsExporting(true);

    try {
      // 1. Capture the visual area. 3D mode uses direct WebGL canvas capture for reliability.
      let imgData;
      if (viewMode === '3D') {
        const webglCanvas = canvasContainerRef.current.querySelector('canvas');
        if (!webglCanvas) {
          throw new Error('3D canvas not found for export.');
        }

        // Wait one frame so the latest render is committed before exporting.
        await new Promise(resolve => requestAnimationFrame(resolve));
        imgData = webglCanvas.toDataURL('image/jpeg', 0.92);
      } else {
        const canvas = await html2canvas(canvasContainerRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        imgData = canvas.toDataURL('image/jpeg', 0.92);
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const docW = doc.internal.pageSize.getWidth();

      // Calculate image height to fit width
      const imgProps = doc.getImageProperties(imgData);
      const imgH = (imgProps.height * (docW - 20)) / imgProps.width;

      // 2. Build Document Header & Image
      doc.setFontSize(22);
      doc.text(`Design Proposal: ${currentDesign.name}`, 10, 20);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Room: ${currentDesign.room?.name} | Dimensions: ${currentDesign.room?.width}m x ${currentDesign.room?.depth}m`, 10, 28);

      doc.addImage(imgData, 'JPEG', 10, 35, docW - 20, imgH);

      // 3. Build Itemized Receipt Page
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.text('Itemized Estimate List', 10, 20);

      doc.setFontSize(11);
      let cursorY = 35;
      let totalCost = 0;

      // Group items by exact furniture model to show quantities
      const frequency = {};
      (currentDesign.furnitureItems || []).forEach(item => {
        const id = item.furniture?._id;
        if (!frequency[id]) {
          frequency[id] = { name: item.furniture?.name, cat: item.furniture?.category, count: 0, price: item.furniture?.price || 0 };
        }
        frequency[id].count += 1;
        totalCost += (item.furniture?.price || 0);
      });

      // Draw table headers
      doc.setFont(undefined, 'bold');
      doc.text('Qty', 10, cursorY);
      doc.text('Item Name', 25, cursorY);
      doc.text('Unit Price', 150, cursorY);
      doc.text('Subtotal', 180, cursorY);
      doc.line(10, cursorY + 2, docW - 10, cursorY + 2);
      cursorY += 10;
      doc.setFont(undefined, 'normal');

      // Draw rows
      Object.values(frequency).forEach(row => {
        const sub = row.count * row.price;
        doc.text(`${row.count}x`, 10, cursorY);
        doc.text(`${row.name} (${row.cat})`, 25, cursorY);
        doc.text(`$${row.price}`, 150, cursorY);
        doc.text(`$${sub}`, 180, cursorY);
        cursorY += 8;
      });

      // Draw Total
      cursorY += 5;
      doc.line(100, cursorY - 5, docW - 10, cursorY - 5);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      doc.text('Grand Total:', 130, cursorY);
      doc.text(`$${totalCost}`, 180, cursorY);

      doc.save(`${currentDesign.name.replace(/\s+/g, '_')}_Estimate.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedItem = currentDesign?.furnitureItems?.find(i => i._id === selectedItemId);

  if (isLoading || !currentDesign) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--background)' }}>
        <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--secondary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Design Editor...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--background)' }}>

      {/* ══════════ LEFT SIDEBAR: FURNITURE CATALOG ══════════ */}
      <aside style={{
        width: '240px',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <FurniturePalette onAddItem={handleAddItemFromPalette} />
      </aside>

      {/* ══════════ MAIN AREA ══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ──── TOP TOOLBAR ──── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          minHeight: '52px',
        }}>
          {/* Left: Back + Design Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '6px' }}>
              <MdArrowBack size={22} color="var(--text-muted)" />
            </button>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--primary)' }}>{currentDesign.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {currentDesign.room?.name} · {currentDesign.room?.width}m × {currentDesign.room?.depth}m
              </div>
            </div>
          </div>

          {/* Center: View Toggle */}
          <div style={{
            display: 'flex',
            gap: '0',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '2px solid var(--secondary)',
          }}>
            <button
              onClick={() => setViewMode('2D')}
              style={{
                padding: '6px 20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                fontFamily: 'inherit',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: viewMode === '2D' ? 'var(--secondary)' : 'transparent',
                color: viewMode === '2D' ? 'white' : 'var(--primary)',
                transition: 'all 0.2s ease',
              }}
            >
              <MdGridOn size={16} /> 2D View
            </button>
            <button
              onClick={() => setViewMode('3D')}
              style={{
                padding: '6px 20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                fontFamily: 'inherit',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: viewMode === '3D' ? 'var(--secondary)' : 'transparent',
                color: viewMode === '3D' ? 'white' : 'var(--primary)',
                transition: 'all 0.2s ease',
              }}
            >
              <MdViewInAr size={16} /> 3D View
            </button>
          </div>

          {/* Right: Item count & Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {currentDesign.furnitureItems?.length || 0} items placed
              <div style={{ fontWeight: 'bold', color: '#27ae60', marginTop: '2px' }}>
                Total: ${currentDesign.furnitureItems?.reduce((sum, it) => sum + (it.furniture?.price || 0), 0) || 0}
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '6px',
                backgroundColor: 'var(--primary)', color: 'white',
                border: 'none', cursor: isExporting ? 'wait' : 'pointer',
                fontSize: '0.85rem', fontWeight: '500', opacity: isExporting ? 0.7 : 1
              }}
            >
              <MdPictureAsPdf size={16} /> {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* ──── CANVAS / 3D SCENE ──── */}
        <div ref={canvasContainerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {viewMode === '2D' ? (
            <RoomCanvas design={currentDesign} collisionAlertRef={collisionAlertRef} />
          ) : (
            <Scene3D design={currentDesign} />
          )}
        </div>
      </div>

      {/* ══════════ RIGHT SIDEBAR: ITEM PROPERTIES ══════════ */}
      <aside style={{
        width: selectedItem ? '260px' : '0px',
        overflow: 'hidden',
        backgroundColor: 'var(--surface)',
        borderLeft: selectedItem ? '1px solid var(--border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.3s ease',
      }}>
        {selectedItem && (
          <div style={{ width: '260px', padding: '0' }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '2px' }}>{selectedItem.furniture?.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{selectedItem.furniture?.category}</p>
            </div>

            {/* Color */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                <MdColorLens style={{ verticalAlign: 'middle', marginRight: '4px' }} size={14} /> Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={itemColor}
                  onChange={(e) => setItemColor(e.target.value)}
                  style={{ width: '40px', height: '34px', padding: '2px', border: '2px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                />
                <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem', flex: 1, borderRadius: '6px' }} onClick={applyItemColor}>
                  Apply
                </button>
              </div>
              {/* Quick color presets */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                {['#8B4513', '#2C2C2C', '#D2B48C', '#696969', '#E8D8C4', '#4A6741', '#B0C4DE', '#FFF8DC'].map(c => (
                  <button
                    key={c}
                    onClick={() => { setItemColor(c); updateFurnitureItem(currentDesign._id, selectedItemId, { color: c }); }}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c,
                      border: itemColor === c ? '3px solid var(--secondary)' : '2px solid var(--border)',
                      cursor: 'pointer', transition: 'all 0.15s', padding: 0,
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Rotation */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                <MdRotateRight style={{ verticalAlign: 'middle', marginRight: '4px' }} size={14} /> Rotation
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ label: '↺ -45°', deg: -45 }, { label: '↻ +45°', deg: 45 }, { label: '90°', deg: 90 }].map(r => (
                  <button
                    key={r.deg}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '6px 4px', fontSize: '0.78rem', borderRadius: '6px' }}
                    onClick={() => rotateSelectedItem(r.deg)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Scale
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--background)', borderRadius: '6px', padding: '4px' }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '1.2rem' }}
                  onClick={() => {
                    const s = Math.max(0.1, (selectedItem.scaleX || 1) - 0.1);
                    updateFurnitureItem(currentDesign._id, selectedItemId, { scaleX: s, scaleY: s, scaleZ: s });
                  }}
                >-</button>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', width: '50px', textAlign: 'center' }}>
                  {((selectedItem.scaleX || 1) * 100).toFixed(0)}%
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '1.2rem' }}
                  onClick={() => {
                    const s = Math.min(5.0, (selectedItem.scaleX || 1) + 0.1);
                    updateFurnitureItem(currentDesign._id, selectedItemId, { scaleX: s, scaleY: s, scaleZ: s });
                  }}
                >+</button>
              </div>
            </div>

            {/* Shading */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                <MdFormatPaint style={{ verticalAlign: 'middle', marginRight: '4px' }} size={14} /> Material Finish
              </label>
              <select
                value={selectedItem.shading?.type || 'smooth'}
                onChange={(e) => updateFurnitureItem(currentDesign._id, selectedItemId, { shading: { type: e.target.value } })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="smooth">Smooth (Default)</option>
                <option value="matte">Matte (Rough)</option>
                <option value="glossy">Glossy (Shiny)</option>
                <option value="flat">Flat</option>
              </select>
            </div>

            {/* Position Info */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Position
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--background)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>X: </span>{(selectedItem.x ?? 0).toFixed(1)}m
                </div>
                <div style={{ padding: '6px 8px', backgroundColor: 'var(--background)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Z: </span>{(selectedItem.z ?? 0).toFixed(1)}m
                </div>
              </div>
              <div style={{ marginTop: '6px', padding: '6px 8px', backgroundColor: 'var(--background)', borderRadius: '4px', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Size: </span>
                {selectedItem.furniture?.dimensions?.width}m × {selectedItem.furniture?.dimensions?.depth}m × {selectedItem.furniture?.dimensions?.height}m
              </div>
            </div>

            {/* Delete */}
            <div style={{ padding: '1rem 1.25rem' }}>
              <button
                onClick={deleteSelectedItem}
                style={{
                  width: '100%', padding: '10px', fontSize: '0.85rem',
                  backgroundColor: 'rgba(231,76,60,0.08)', color: '#E74C3C',
                  border: '1px solid rgba(231,76,60,0.2)', borderRadius: '8px',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <MdDelete size={18} /> Remove Item
              </button>
            </div>
          </div>
        )}
      </aside>

    </div>
  );
};

export default DesignEditor;
