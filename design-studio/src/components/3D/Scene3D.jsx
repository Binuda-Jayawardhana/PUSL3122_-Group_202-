import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Plane, Environment, SoftShadows, RoundedBox, Cylinder, TransformControls } from '@react-three/drei';
import { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import useDesignStore from '../../store/designStore';

/* ============================================================
  Realistic procedural 3D furniture builders — one per category.
  Each returns a <group> containing multiple meshes to approximate
  the shape of real furniture (legs, seats, surfaces, etc.).
============================================================ */

const materialProps = (color, shading) => {
  const type = shading?.type || 'smooth';
  const base = { color };

  switch (type) {
    case 'glossy':
      return { ...base, roughness: 0.1, metalness: 0.5 };
    case 'matte':
      return { ...base, roughness: 0.9, metalness: 0 };
    case 'flat':
      return { ...base, roughness: 0.5, metalness: 0 };
    default:
      return { ...base, roughness: 0.4, metalness: 0.1 }; // smooth default
  }
};

// ---- CHAIR ----
const ChairMesh = ({ w, h, d, matProps }) => {
  const legR = 0.03;
  const seatH = 0.05;
  const seatY = h * 0.45;
  const legH = seatY;
  return (
    <group>
      {/* Seat */}
      <RoundedBox args={[w, seatH, d]} position={[0, seatY, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Backrest */}
      <RoundedBox args={[w, h * 0.45, 0.04]} position={[0, seatY + h * 0.25, -d / 2 + 0.02]} radius={0.02} castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Legs */}
      {[[-w / 2 + 0.04, 0, -d / 2 + 0.04], [w / 2 - 0.04, 0, -d / 2 + 0.04], [-w / 2 + 0.04, 0, d / 2 - 0.04], [w / 2 - 0.04, 0, d / 2 - 0.04]].map((pos, i) => (
        <Cylinder key={i} args={[legR, legR, legH, 8]} position={[pos[0], legH / 2, pos[2]]} castShadow>
          <meshStandardMaterial color="#3D2B1F" roughness={0.6} />
        </Cylinder>
      ))}
    </group>
  );
};

// ---- TABLE ----
const TableMesh = ({ w, h, d, matProps }) => {
  const legR = 0.04;
  const topH = 0.06;
  const legH = h - topH;
  return (
    <group>
      {/* Tabletop */}
      <RoundedBox args={[w, topH, d]} position={[0, h - topH / 2, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Legs */}
      {[[-w / 2 + 0.06, 0, -d / 2 + 0.06], [w / 2 - 0.06, 0, -d / 2 + 0.06], [-w / 2 + 0.06, 0, d / 2 - 0.06], [w / 2 - 0.06, 0, d / 2 - 0.06]].map((pos, i) => (
        <Cylinder key={i} args={[legR, legR, legH, 8]} position={[pos[0], legH / 2, pos[2]]} castShadow>
          <meshStandardMaterial color="#5C4033" roughness={0.7} />
        </Cylinder>
      ))}
    </group>
  );
};

// ---- SOFA ----
const SofaMesh = ({ w, h, d, matProps }) => {
  const baseH = h * 0.4;
  const cushionH = h * 0.25;
  const backH = h * 0.35;
  const armW = 0.12;
  return (
    <group>
      {/* Base */}
      <RoundedBox args={[w, baseH, d]} position={[0, baseH / 2, 0]} radius={0.04} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} roughness={(matProps.roughness || 0.5) + 0.2} />
      </RoundedBox>
      {/* Seat cushion */}
      <RoundedBox args={[w - armW * 2, cushionH, d * 0.8]} position={[0, baseH + cushionH / 2, d * 0.05]} radius={0.04} castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Backrest */}
      <RoundedBox args={[w - armW * 2, backH, 0.15]} position={[0, baseH + backH / 2, -d / 2 + 0.1]} radius={0.04} castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Arms */}
      <RoundedBox args={[armW, h * 0.5, d]} position={[-w / 2 + armW / 2, baseH, 0]} radius={0.03} castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      <RoundedBox args={[armW, h * 0.5, d]} position={[w / 2 - armW / 2, baseH, 0]} radius={0.03} castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
    </group>
  );
};

// ---- BED ----
const BedMesh = ({ w, h, d, matProps }) => {
  const frameH = 0.25;
  const mattressH = 0.2;
  const headH = h;
  return (
    <group>
      {/* Frame */}
      <Box args={[w, frameH, d]} position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#5C4033" roughness={0.7} />
      </Box>
      {/* Mattress */}
      <RoundedBox args={[w - 0.05, mattressH, d - 0.1]} position={[0, frameH + mattressH / 2, 0.04]} radius={0.04} castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Headboard */}
      <RoundedBox args={[w, headH, 0.08]} position={[0, headH / 2, -d / 2 + 0.04]} radius={0.03} castShadow>
        <meshStandardMaterial {...matProps} roughness={0.6} />
      </RoundedBox>
    </group>
  );
};

// ---- CUPBOARD / CABINET ----
const CupboardMesh = ({ w, h, d, matProps }) => {
  return (
    <group>
      {/* Body */}
      <Box args={[w, h, d]} position={[0, h / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </Box>
      {/* Door line (visual split) */}
      <Box args={[0.01, h * 0.85, d * 0.01]} position={[0, h / 2, d / 2 + 0.005]} castShadow>
        <meshStandardMaterial color="#222" roughness={0.3} metalness={0.8} />
      </Box>
      {/* Handles */}
      <Cylinder args={[0.015, 0.015, 0.12, 8]} position={[- 0.06, h / 2, d / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.9} />
      </Cylinder>
      <Cylinder args={[0.015, 0.015, 0.12, 8]} position={[0.06, h / 2, d / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.9} />
      </Cylinder>
    </group>
  );
};

// ---- DESK ----
const DeskMesh = ({ w, h, d, matProps }) => {
  const topH = 0.05;
  const legH = h - topH;
  return (
    <group>
      {/* Desktop surface */}
      <RoundedBox args={[w, topH, d]} position={[0, h - topH / 2, 0]} radius={0.01} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Side panel left */}
      <Box args={[0.04, legH, d - 0.1]} position={[-w / 2 + 0.04, legH / 2, 0]} castShadow>
        <meshStandardMaterial {...matProps} roughness={0.6} />
      </Box>
      {/* Side panel right */}
      <Box args={[0.04, legH, d - 0.1]} position={[w / 2 - 0.04, legH / 2, 0]} castShadow>
        <meshStandardMaterial {...matProps} roughness={0.6} />
      </Box>
      {/* Back panel */}
      <Box args={[w - 0.1, legH * 0.6, 0.02]} position={[0, legH * 0.3, -d / 2 + 0.06]} castShadow>
        <meshStandardMaterial {...matProps} roughness={0.7} />
      </Box>
    </group>
  );
};

// ---- SHELF / BOOKSHELF ----
const ShelfMesh = ({ w, h, d, matProps }) => {
  const shelfCount = 5;
  const shelfH = 0.03;
  const gap = h / shelfCount;
  return (
    <group>
      {/* Side panels */}
      <Box args={[0.03, h, d]} position={[-w / 2 + 0.015, h / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </Box>
      <Box args={[0.03, h, d]} position={[w / 2 - 0.015, h / 2, 0]} castShadow>
        <meshStandardMaterial {...matProps} />
      </Box>
      {/* Shelves */}
      {Array.from({ length: shelfCount }, (_, i) => (
        <Box key={i} args={[w - 0.06, shelfH, d]} position={[0, gap * i + shelfH / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...matProps} />
        </Box>
      ))}
      {/* Back panel */}
      <Box args={[w - 0.04, h, 0.01]} position={[0, h / 2, -d / 2 + 0.005]}>
        <meshStandardMaterial {...matProps} roughness={0.8} />
      </Box>
    </group>
  );
};

// ---- TV UNIT ----
const TVUnitMesh = ({ w, h, d, matProps }) => {
  return (
    <group>
      {/* Cabinet body */}
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.02} castShadow receiveShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      {/* Screen (placeholder on top) */}
      <Box args={[w * 0.7, 0.02, 0.01]} position={[0, h + 0.15, 0]} castShadow>
        <meshStandardMaterial color="#111" roughness={0.05} metalness={0.9} />
      </Box>
    </group>
  );
};

// ---- GENERIC FALLBACK ----
const GenericMesh = ({ w, h, d, matProps }) => (
  <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.02} castShadow receiveShadow>
    <meshStandardMaterial {...matProps} />
  </RoundedBox>
);

/* ============================================================
  Category-based dispatch
============================================================ */
const renderCategoryMesh = (category, w, h, d, matProps) => {
  switch (category) {
    case 'chair':
      return <ChairMesh w={w} h={h} d={d} matProps={matProps} />;
    case 'table':
    case 'dining-table':
    case 'side-table':
      return <TableMesh w={w} h={h} d={d} matProps={matProps} />;
    case 'sofa':
      return <SofaMesh w={w} h={h} d={d} matProps={matProps} />;
    case 'bed':
      return <BedMesh w={w} h={h} d={d} matProps={matProps} />;
    case 'cupboard':
    case 'cabinet':
      return <CupboardMesh w={w} h={h} d={d} matProps={matProps} />;
    case 'desk':
      return <DeskMesh w={w} h={h} d={d} matProps={matProps} />;
    case 'shelf':
      return <ShelfMesh w={w} h={h} d={d} matProps={matProps} />;
    case 'tv-unit':
      return <TVUnitMesh w={w} h={h} d={d} matProps={matProps} />;
    default:
      return <GenericMesh w={w} h={h} d={d} matProps={matProps} />;
  }
};

/* ============================================================
  Individual Furniture Item (wraps the correct mesh)
============================================================ */
import { forwardRef } from 'react';

const FurnitureObject3D = forwardRef(({ item, isSelected, onSelect }, ref) => {
  const w = item.furniture?.dimensions?.width || 1;
  const h = item.furniture?.dimensions?.height || 1;
  const d = item.furniture?.dimensions?.depth || 1;

  // Backend stores flat x, y, z fields
  const px = (item.x ?? 0);
  const pz = (item.z ?? 0);
  const py = (item.y ?? 0);

  const ry = (item.rotation || item.rotationY || 0) * (Math.PI / 180);
  const sx = item.scaleX || 1;
  const sy = item.scaleY || 1;
  const sz = item.scaleZ || 1;

  const itemColor = item.color || item.furniture?.defaultColor || '#cccccc';
  const category = item.furniture?.category || 'generic';
  const matProps = materialProps(itemColor, item.shading);

  // Keep the FurnitureObject3D pure, we'll wrap it in TransformControls in the main scene
  return (
    <group
      ref={ref}
      position={[px, py, pz]}
      rotation={[0, ry, 0]}
      scale={[sx, sy, sz]}
      onClick={(e) => { e.stopPropagation(); onSelect(item._id); }}
    >
      {/* Selection highlight ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.6, Math.max(w, d) * 0.7, 32]} />
          <meshBasicMaterial color="#D4AF37" opacity={0.6} transparent side={THREE.DoubleSide} />
        </mesh>
      )}

      {renderCategoryMesh(category, w, h, d, matProps)}
    </group>
  );
});

/* ============================================================
  Dynamic Room Geometry Builder
============================================================ */
const RoomGeometry = ({ width, depth, height, shape, floorColor, wallColor }) => {
  // Use useMemo to generate floor planes and walls based on shape
  const geometry = useMemo(() => {
    const floors = [];
    const walls = []; // Array of { width, height, depth, x, y, z }
    const wallThickness = 0.15;

    // Helper to add a floor rect
    const addFloor = (w, d, px, pz) => {
      floors.push({ w, d, px, pz });
    };

    // Helper to add a wall
    const addWall = (w, h, d, px, py, pz, transparent = false) => {
      walls.push({ w, h, d, px, py, pz, transparent });
    };

    if (shape === 'l-shaped') {
      // Floor: Base rect + Side extension
      addFloor(width, depth * 0.5, width / 2, depth * 0.25);
      addFloor(width * 0.5, depth * 0.5, width * 0.25, depth * 0.75);

      // Walls for L-shape (6 walls)
      // Back wall (full width)
      addWall(width, height, wallThickness, width / 2, height / 2, 0);
      // Left wall (full depth)
      addWall(wallThickness, height, depth, 0, height / 2, depth / 2);
      // Front-left wall (half width)
      addWall(width * 0.5, height, wallThickness, width * 0.25, height / 2, depth);
      // Inner side wall (half depth)
      addWall(wallThickness, height, depth * 0.5, width * 0.5, height / 2, depth * 0.75);
      // Front-right inner wall (half width)
      addWall(width * 0.5, height, wallThickness, width * 0.75, height / 2, depth * 0.5);
      // Right wall (transparent)
      addWall(wallThickness, height, depth * 0.5, width, height / 2, depth * 0.25, true);

    } else if (shape === 't-shaped') {
      // Floor: Top bar + center stem
      addFloor(width, depth * 0.4, width / 2, depth * 0.2);
      addFloor(width * 0.5, depth * 0.6, width / 2, depth * 0.7);

      // Walls (8 walls)
      // Back wall (full width)
      addWall(width, height, wallThickness, width / 2, height / 2, 0);
      // Left top wing
      addWall(wallThickness, height, depth * 0.4, 0, height / 2, depth * 0.2);
      // Front inner left wing
      addWall(width * 0.25, height, wallThickness, width * 0.125, height / 2, depth * 0.4);
      // Stem left side
      addWall(wallThickness, height, depth * 0.6, width * 0.25, height / 2, depth * 0.7);
      // Stem front
      addWall(width * 0.5, height, wallThickness, width * 0.5, height / 2, depth);
      // Stem right side
      addWall(wallThickness, height, depth * 0.6, width * 0.75, height / 2, depth * 0.7);
      // Front inner right wing
      addWall(width * 0.25, height, wallThickness, width * 0.875, height / 2, depth * 0.4);
      // Right top wing (transparent)
      addWall(wallThickness, height, depth * 0.4, width, height / 2, depth * 0.2, true);

    } else if (shape === 'open-plan') {
      // Floor
      addFloor(width, depth, width / 2, depth / 2);
      // 3 Walls only
      // Back wall
      addWall(width, height, wallThickness, width / 2, height / 2, 0);
      // Left wall
      addWall(wallThickness, height, depth, 0, height / 2, depth / 2);
      // Right wall
      addWall(wallThickness, height, depth, width, height / 2, depth / 2);

    } else {
      // Standard Rectangular
      addFloor(width, depth, width / 2, depth / 2);
      // Back
      addWall(width, height, wallThickness, width / 2, height / 2, 0);
      // Left
      addWall(wallThickness, height, depth, 0, height / 2, depth / 2);
      // Right (transparent for viewing)
      addWall(wallThickness, height, depth, width, height / 2, depth / 2, true);
    }

    return { floors, walls };
  }, [width, depth, height, shape]);

  return (
    <group>
      {/* Render Floors */}
      {geometry.floors.map((fl, i) => (
        <Plane key={`f-${i}`} args={[fl.w, fl.d]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[fl.px, 0, fl.pz]}>
          <meshStandardMaterial color={floorColor} roughness={0.7} />
        </Plane>
      ))}

      {/* Render Walls */}
      {geometry.walls.map((wl, i) => (
        <Box key={`w-${i}`} args={[wl.w, wl.h, wl.d]} position={[wl.px, wl.py, wl.pz]} receiveShadow={!wl.transparent}>
          <meshStandardMaterial color={wallColor} roughness={0.85} transparent={wl.transparent} opacity={wl.transparent ? 0.15 : 1} />
        </Box>
      ))}
    </group>
  );
};

/* ============================================================
  Draggable Wrapper Component (Fixes Local Coordinate Save Bug)
============================================================ */
const DraggableFurniture = ({ item, isSelected, onSelect, updateFurnitureItem, designId, width, depth }) => {
  const groupRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [transformObject, setTransformObject] = useState(null);

  useEffect(() => {
    if (isSelected && groupRef.current) {
      setTransformObject(groupRef.current);
      return;
    }
    setTransformObject(null);
  }, [isSelected]);

  // Send dragging state up so OrbitControls can pause
  // We use the same update pattern as before

  return (
    <>
      <FurnitureObject3D
        ref={groupRef}
        item={item}
        isSelected={isSelected}
        onSelect={onSelect}
      />
      {isSelected && transformObject && (
        <TransformControls
          object={transformObject}
          mode="translate"
          showY={false} // Only allow X-Z floor movement
          onDraggingChanged={(e) => {
            const draggingInfo = e.value;
            setIsDragging(draggingInfo);

            // Dispatch custom event to let Scene3D know the drag state
            const event = new CustomEvent('furnitureDragState', { detail: draggingInfo });
            window.dispatchEvent(event);

            // If we just finished dragging, save the absolute coordinates
            if (!draggingInfo && groupRef.current) {
              const { x, z } = groupRef.current.position;
              const cX = Math.max(0, Math.min(x, width));
              const cZ = Math.max(0, Math.min(z, depth));

              // Force local component back in bounds visually before state catches up
              groupRef.current.position.set(cX, groupRef.current.position.y, cZ);

              updateFurnitureItem(designId, item._id, { x: cX, z: cZ }, true);
            }
          }}
          onChange={() => {
            // Live optimistic dragging
            if (isDragging && groupRef.current) {
              const { x, z } = groupRef.current.position;
              const cX = Math.max(0, Math.min(x, width));
              const cZ = Math.max(0, Math.min(z, depth));
              updateFurnitureItem(designId, item._id, { x: cX, z: cZ }, false);
            }
          }}
        />
      )}
    </>
  );
};

/* ============================================================
  Scene3D Root Component
============================================================ */
const Scene3D = ({ design }) => {
  const { selectedItemId, selectItem, deselectItem, updateFurnitureItem } = useDesignStore();
  const [globalDragState, setGlobalDragState] = useState(false);

  useEffect(() => {
    const handleDrag = (e) => setGlobalDragState(e.detail);
    window.addEventListener('furnitureDragState', handleDrag);
    return () => window.removeEventListener('furnitureDragState', handleDrag);
  }, []);

  if (!design?.room) return null;

  const { width, depth, height, floorColor, wallColor } = design.room;
  const roomOffsetX = -width / 2;
  const roomOffsetZ = -depth / 2;

  return (
    <div style={{ width: '100%', height: '100%', cursor: 'grab' }}>
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [width * 0.8, Math.max(width, depth) * 1.2, depth * 1.5], fov: 50 }}
        onPointerMissed={() => deselectItem()}
      >
        <SoftShadows size={25} samples={16} focus={0.5} />
        <ambientLight intensity={0.45} />
        <directionalLight
          castShadow
          position={[width, height * 3, depth]}
          intensity={1.8}
          shadow-mapSize={2048}
          shadow-bias={-0.001}
        >
          <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
        </directionalLight>
        <pointLight position={[0, height, 0]} intensity={0.3} color="#FFF5E1" />

        <Suspense fallback={null}>
          <Environment preset="apartment" />

          <group position={[roomOffsetX, 0, roomOffsetZ]}>
            <RoomGeometry
              width={width}
              depth={depth}
              height={height}
              shape={design.room.shape}
              floorColor={floorColor}
              wallColor={wallColor}
            />

            {/* Furniture items */}
            {design.furnitureItems?.map(item => (
              <DraggableFurniture
                key={item._id}
                item={item}
                isSelected={selectedItemId === item._id}
                onSelect={selectItem}
                updateFurnitureItem={updateFurnitureItem}
                designId={design._id}
                width={width}
                depth={depth}
              />
            ))}
          </group>
        </Suspense>

        <OrbitControls
          makeDefault
          enabled={!globalDragState}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2}
          maxDistance={Math.max(width, depth) * 3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};

export default Scene3D;
