import { useRef, useState, useEffect, useMemo } from 'react';
import useDesignStore from '../../store/designStore';

/* ============================================================
  Collision Detection Utility
============================================================ */
const getItemBounds = (item) => {
  const w = (item.furniture?.dimensions?.width || 1) * (item.scaleX || 1);
  const d = (item.furniture?.dimensions?.depth || 1) * (item.scaleZ || 1);
  const cx = item.x ?? 0;
  const cz = item.z ?? 0;
  return {
    left: cx - w / 2,
    right: cx + w / 2,
    top: cz - d / 2,
    bottom: cz + d / 2,
    width: w,
    depth: d,
  };
};

const checkCollision = (boundsA, boundsB) => {
  return !(
    boundsA.right <= boundsB.left ||
    boundsA.left >= boundsB.right ||
    boundsA.bottom <= boundsB.top ||
    boundsA.top >= boundsB.bottom
  );
};

const findCollisions = (items) => {
  const collisions = new Set();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = getItemBounds(items[i]);
      const b = getItemBounds(items[j]);
      if (checkCollision(a, b)) {
        collisions.add(items[i]._id);
        collisions.add(items[j]._id);
      }
    }
  }
  return collisions;
};

/* ============================================================
  Category Icon Map (for drawing text labels / icons on canvas)
============================================================ */
const categoryLabels = {
  'chair': '🪑', 'armchair': '🛋️', 'table': '🪵',
  'dining-table': '🍽️', 'side-table': '☕', 'coffee-table': '☕',
  'sofa': '🛋️', 'bed': '🛏️', 'cupboard': '🚪',
  'cabinet': '🚪', 'shelf': '📚', 'desk': '💻',
  'wardrobe': '👕', 'tv-unit': '📺',
};

const RoomCanvas = ({ design, collisionAlertRef }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { addFurnitureToDesign, updateFurnitureItem, selectedItemId, selectItem, deselectItem } = useDesignStore();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [dragging, setDragging] = useState(null);

  const PPS = 50;
  const furnitureItems = design ? design.furnitureItems : undefined;

  // Auto-scale to fit room
  useEffect(() => {
    if (!containerRef.current || !design?.room) return;
    const cW = containerRef.current.clientWidth;
    const cH = containerRef.current.clientHeight;
    const rW = design.room.width * PPS;
    const rH = design.room.depth * PPS;
    const s = Math.min((cW * 0.85) / rW, (cH * 0.85) / rH, 2.5);
    setScale(s);
    setOffset({ x: (cW - rW * s) / 2, y: (cH - rH * s) / 2 });
  }, [design?.room]);

  const collisions = useMemo(() => {
    if (!furnitureItems) return new Set();
    return findCollisions(furnitureItems);
  }, [furnitureItems]);

  // Expose collision state to parent
  useEffect(() => {
    if (collisionAlertRef) collisionAlertRef.current = collisions;
  }, [collisionAlertRef, collisions]);

  // ─── RENDER CANVAS ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !design?.room) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const step = PPS * scale;
    const roomW = design.room.width * step;
    const roomH = design.room.depth * step;
    
    // Define the room boundary path depending on shape
    ctx.beginPath();
    if (design.room.shape === 'l-shaped') {
      ctx.moveTo(offset.x, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y + roomH * 0.5);
      ctx.lineTo(offset.x + roomW * 0.5, offset.y + roomH * 0.5);
      ctx.lineTo(offset.x + roomW * 0.5, offset.y + roomH);
      ctx.lineTo(offset.x, offset.y + roomH);
      ctx.closePath();
    } else if (design.room.shape === 't-shaped') {
      ctx.moveTo(offset.x, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y + roomH * 0.4);
      ctx.lineTo(offset.x + roomW * 0.75, offset.y + roomH * 0.4);
      ctx.lineTo(offset.x + roomW * 0.75, offset.y + roomH);
      ctx.lineTo(offset.x + roomW * 0.25, offset.y + roomH);
      ctx.lineTo(offset.x + roomW * 0.25, offset.y + roomH * 0.4);
      ctx.lineTo(offset.x, offset.y + roomH * 0.4);
      ctx.closePath();
    } else {
      // rectangular, square, or open-plan all use full bounding box for floor area
      ctx.moveTo(offset.x, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y + roomH);
      ctx.lineTo(offset.x, offset.y + roomH);
      ctx.closePath();
    }
    
    // Floor fill
    ctx.fillStyle = design.room.floorColor || '#E8E0D0';
    ctx.fill();

    // Setup Clipping for Grid
    ctx.save();
    ctx.clip(); // Restrict everything next inside the polygon boundary

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = offset.x; x <= offset.x + roomW; x += step) {
      ctx.moveTo(x, offset.y); ctx.lineTo(x, offset.y + roomH);
    }
    for (let y = offset.y; y <= offset.y + roomH; y += step) {
      ctx.moveTo(offset.x, y); ctx.lineTo(offset.x + roomW, y);
    }
    ctx.stroke();
    
    ctx.restore(); // End clipping

    // Walls (re-stroke the path)
    ctx.strokeStyle = design.room.wallColor || '#333';
    ctx.lineWidth = 6;
    
    if (design.room.shape === 'open-plan') {
      // Draw 3 walls, missing the front opening
      ctx.beginPath();
      ctx.moveTo(offset.x, offset.y + roomH);
      ctx.lineTo(offset.x, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y);
      ctx.lineTo(offset.x + roomW, offset.y + roomH);
      ctx.stroke();
      
      // Dashed line for opening
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.setLineDash([10, 10]);
      ctx.moveTo(offset.x + roomW, offset.y + roomH);
      ctx.lineTo(offset.x, offset.y + roomH);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Full enclosed stroke
      // We already defined the closed path above for the fill, so draw the exact path
      ctx.beginPath();
      
      if (design.room.shape === 'l-shaped') {
        ctx.moveTo(offset.x, offset.y);
        ctx.lineTo(offset.x + roomW, offset.y);
        ctx.lineTo(offset.x + roomW, offset.y + roomH * 0.5);
        ctx.lineTo(offset.x + roomW * 0.5, offset.y + roomH * 0.5);
        ctx.lineTo(offset.x + roomW * 0.5, offset.y + roomH);
        ctx.lineTo(offset.x, offset.y + roomH);
      } else if (design.room.shape === 't-shaped') {
        ctx.moveTo(offset.x, offset.y);
        ctx.lineTo(offset.x + roomW, offset.y);
        ctx.lineTo(offset.x + roomW, offset.y + roomH * 0.4);
        ctx.lineTo(offset.x + roomW * 0.75, offset.y + roomH * 0.4);
        ctx.lineTo(offset.x + roomW * 0.75, offset.y + roomH);
        ctx.lineTo(offset.x + roomW * 0.25, offset.y + roomH);
        ctx.lineTo(offset.x + roomW * 0.25, offset.y + roomH * 0.4);
        ctx.lineTo(offset.x, offset.y + roomH * 0.4);
      } else {
        ctx.moveTo(offset.x, offset.y);
        ctx.lineTo(offset.x + roomW, offset.y);
        ctx.lineTo(offset.x + roomW, offset.y + roomH);
        ctx.lineTo(offset.x, offset.y + roomH);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // ─── Draw Furniture Items ───
    if (design.furnitureItems?.length > 0) {
      design.furnitureItems.forEach(item => {
        if (!item) return;
        const sx = item.scaleX || 1;
        const sz = item.scaleZ || 1;
        const w = (item.furniture?.dimensions?.width || 1) * step * sx;
        const h = (item.furniture?.dimensions?.depth || 1) * step * sz;
        const cx = offset.x + ((item.x ?? 0) * step);
        const cy = offset.y + ((item.z ?? 0) * step);

        const isColliding = collisions.has(item._id);
        const isSel = selectedItemId === item._id;
        const isHov = hoveredItemId === item._id;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((item.rotation || item.rotationY || 0) * Math.PI / 180);

        // Shadow
        ctx.shadowColor = isColliding ? 'rgba(231,76,60,0.5)' : 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = isColliding ? 16 : 6;
        ctx.shadowOffsetY = isColliding ? 0 : 3;

        // Fill body
        const color = item.color || item.furniture?.defaultColor || '#888';
        ctx.fillStyle = color;

        const cat = item.furniture?.category || '';

        // Category-specific shapes
        if (cat.includes('sofa') || cat === 'armchair') {
          // Sofa: rounded rect with arms
          ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, Math.min(w, h) * 0.12); ctx.fill();
          ctx.fillStyle = darken(color, 12);
          ctx.fillRect(-w/2, -h/2, w * 0.07, h);
          ctx.fillRect(w/2 - w * 0.07, -h/2, w * 0.07, h);
          // Cushion lines
          ctx.strokeStyle = darken(color, 18); ctx.lineWidth = 1;
          for (let i = 1; i <= 2; i++) {
            const lx = -w/2 + w * 0.07 + (w - w * 0.14) * (i / 3);
            ctx.beginPath(); ctx.moveTo(lx, -h/2 + 4); ctx.lineTo(lx, h/2 - 4); ctx.stroke();
          }
        } else if (cat.includes('bed')) {
          ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 6); ctx.fill();
          ctx.fillStyle = darken(color, 25);
          ctx.fillRect(-w/2, -h/2, w, h * 0.06);
          ctx.fillStyle = lighten(color, 15);
          const pw = w * 0.35, ph = h * 0.08;
          ctx.beginPath(); ctx.roundRect(-w/2 + w * 0.08, -h/2 + h * 0.08, pw, ph, 3); ctx.fill();
          ctx.beginPath(); ctx.roundRect(w/2 - w * 0.08 - pw, -h/2 + h * 0.08, pw, ph, 3); ctx.fill();
        } else if (cat.includes('table') || cat.includes('desk') || cat === 'coffee-table') {
          ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 4); ctx.fill();
          ctx.fillStyle = darken(color, 20);
          const r = Math.min(w, h) * 0.06;
          [[-w/2 + w * 0.08, -h/2 + h * 0.08], [w/2 - w * 0.08, -h/2 + h * 0.08],
           [-w/2 + w * 0.08, h/2 - h * 0.08], [w/2 - w * 0.08, h/2 - h * 0.08]].forEach(([lx, ly]) => {
            ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.fill();
          });
        } else if (cat.includes('cupboard') || cat.includes('cabinet') || cat === 'wardrobe') {
          ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 3); ctx.fill();
          ctx.strokeStyle = darken(color, 20); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(0, -h/2 + 4); ctx.lineTo(0, h/2 - 4); ctx.stroke();
          ctx.fillStyle = '#C0C0C0';
          ctx.beginPath(); ctx.arc(-w * 0.08, 0, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(w * 0.08, 0, 2.5, 0, Math.PI * 2); ctx.fill();
        } else if (cat === 'chair') {
          ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 5); ctx.fill();
          ctx.fillStyle = darken(color, 15);
          ctx.fillRect(-w/2 + 2, -h/2, w - 4, h * 0.18);
        } else {
          ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 4); ctx.fill();
        }

        // ─── COLLISION VISUAL ALERT ───
        if (isColliding) {
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#E74C3C';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 4]);
          ctx.beginPath(); ctx.roundRect(-w/2 - 3, -h/2 - 3, w + 6, h + 6, 8); ctx.stroke();
          ctx.setLineDash([]);
          // Warning icon
          ctx.fillStyle = '#E74C3C';
          ctx.font = `bold ${Math.max(12, 10 * scale)}px sans-serif`;
          ctx.textAlign = 'right'; ctx.textBaseline = 'top';
          ctx.fillText('⚠', w/2 + 2, -h/2 - 14);
        }

        // Selection ring
        if (isSel && !isColliding) {
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 3]);
          ctx.beginPath(); ctx.roundRect(-w/2 - 3, -h/2 - 3, w + 6, h + 6, 8); ctx.stroke();
          ctx.setLineDash([]);
        } else if (isHov && !isSel && !isColliding) {
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = 'rgba(212,175,55,0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect(-w/2 - 2, -h/2 - 2, w + 4, h + 4, 6); ctx.stroke();
        }

        // Label
        const emoji = categoryLabels[cat] || '📦';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
        ctx.font = `${Math.max(11, 9 * scale)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 0, 0);

        ctx.restore();
      });
    }
  }, [design, scale, offset, hoveredItemId, selectedItemId, collisions]);

  // ─── HIT TESTING ───
  const hitTest = (mx, my) => {
    if (!design?.furnitureItems) return null;
    const step = PPS * scale;
    const x = mx - offset.x, y = my - offset.y;
    for (let i = design.furnitureItems.length - 1; i >= 0; i--) {
      const item = design.furnitureItems[i];
      if (!item) continue;
      const w = (item.furniture?.dimensions?.width || 1) * step * (item.scaleX || 1);
      const h = (item.furniture?.dimensions?.depth || 1) * step * (item.scaleZ || 1);
      const cx = (item.x ?? 0) * step, cy = (item.z ?? 0) * step;
      if (x >= cx - w/2 && x <= cx + w/2 && y >= cy - h/2 && y <= cy + h/2) return item;
    }
    return null;
  };

  // ─── MOUSE HANDLERS ───
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    if (dragging) {
      canvasRef.current.style.cursor = 'grabbing';
      const step = PPS * scale;
      let rX = (mx - offset.x) / step, rZ = (my - offset.y) / step;
      rX = Math.max(0, Math.min(rX, design.room.width));
      rZ = Math.max(0, Math.min(rZ, design.room.depth));
      
      // Update local state ONLY, prevent API spam
      updateFurnitureItem(design._id, dragging.itemId, { x: rX, z: rZ }, false);
      return;
    }
    const hit = hitTest(mx, my);
    setHoveredItemId(hit?._id || null);
    canvasRef.current.style.cursor = hit ? 'grab' : 'default';
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit) {
      selectItem(hit._id);
      setDragging({ itemId: hit._id });
    } else {
      deselectItem();
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      // Find the final position in local state and sync to backend
      const finalItem = design.furnitureItems.find(i => i._id === dragging.itemId);
      if (finalItem) {
        updateFurnitureItem(design._id, dragging.itemId, { x: finalItem.x, z: finalItem.z }, true);
      }
      setDragging(null);
    }
    canvasRef.current.style.cursor = hoveredItemId ? 'grab' : 'default';
  };

  // Drop from palette
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw || !design) return;
    try {
      const data = JSON.parse(raw);
      if (data.source === 'palette' && data.furniture) {
        const rect = canvasRef.current.getBoundingClientRect();
        const step = PPS * scale;
        let rX = (e.clientX - rect.left - offset.x) / step;
        let rZ = (e.clientY - rect.top - offset.y) / step;
        rX = Math.max(0.5, Math.min(rX, design.room.width - 0.5));
        rZ = Math.max(0.5, Math.min(rZ, design.room.depth - 0.5));
        addFurnitureToDesign(design._id, data.furniture._id, rX, rZ);
      }
    } catch (err) { console.error(err); }
  };

  if (!design?.room) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No room selected</div>;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} onDragOver={handleDragOver} onDrop={handleDrop}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Collision Alert Banner */}
      {collisions.size > 0 && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(231,76,60,0.95)', color: 'white',
          padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem',
          fontWeight: '600', boxShadow: '0 4px 16px rgba(231,76,60,0.3)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeIn 0.3s ease-out',
          zIndex: 10,
        }}>
          ⚠ {collisions.size} item{collisions.size > 1 ? 's' : ''} colliding! Move them apart.
        </div>
      )}

      {/* Scale Legend */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        background: 'rgba(255,255,255,0.92)', padding: '8px 14px', borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '0.75rem', border: '1px solid var(--border)',
      }}>
        <div style={{ fontWeight: '600', marginBottom: 3, color: 'var(--primary)' }}>Scale</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: PPS * scale, height: 3, backgroundColor: 'var(--secondary)', borderRadius: 2 }} />
          <span>1m</span>
        </div>
      </div>
    </div>
  );
};

function darken(hex, pct) {
  const c = (v) => Math.max(0, Math.min(255, v));
  return `rgb(${c(parseInt(hex.slice(1,3),16) - 255*pct/100)},${c(parseInt(hex.slice(3,5),16) - 255*pct/100)},${c(parseInt(hex.slice(5,7),16) - 255*pct/100)})`;
}
function lighten(hex, pct) {
  const c = (v) => Math.max(0, Math.min(255, v));
  return `rgb(${c(parseInt(hex.slice(1,3),16) + 255*pct/100)},${c(parseInt(hex.slice(3,5),16) + 255*pct/100)},${c(parseInt(hex.slice(5,7),16) + 255*pct/100)})`;
}

export default RoomCanvas;
