const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Import models
const User = require('../models/User');
const Room = require('../models/Room');
const Furniture = require('../models/Furniture');
const Design = require('../models/Design');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    await Furniture.deleteMany({});
    await Design.deleteMany({});
    console.log('Existing data cleared.');

    // ===== CREATE USERS =====
    const adminUser = await User.create({
      name: 'Admin Designer',
      email: 'admin@designstudio.com',
      password: 'admin123',
      role: 'admin',
    });

    const regularUser = await User.create({
      name: 'John Customer',
      email: 'john@example.com',
      password: 'user123',
      role: 'user',
    });

    console.log('Users created.');

    // ===== CREATE FURNITURE (18 items across 7 categories) =====
    const furnitureData = [
      // ---- CHAIRS (3) ----
      {
        name: 'Modern Dining Chair',
        category: 'chair',
        defaultColor: '#8B4513',
        dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        description: 'Sleek modern dining chair with tapered wooden legs and a contoured upholstered seat in warm saddle brown.',
        price: 85,
      },
      {
        name: 'Executive Office Chair',
        category: 'chair',
        defaultColor: '#2C2C2C',
        dimensions: { width: 0.65, height: 1.2, depth: 0.65 },
        description: 'Premium ergonomic office chair with adjustable lumbar support, padded armrests, and breathable mesh back.',
        price: 349,
      },
      {
        name: 'Accent Armchair',
        category: 'chair',
        defaultColor: '#4A6741',
        dimensions: { width: 0.75, height: 0.85, depth: 0.8 },
        description: 'Luxurious velvet accent armchair with deep forest green upholstery and polished brass legs.',
        price: 299,
      },

      // ---- TABLES (3) ----
      {
        name: 'Rectangular Dining Table',
        category: 'table',
        defaultColor: '#A0522D',
        dimensions: { width: 1.8, height: 0.75, depth: 0.9 },
        description: 'Classic solid oak rectangular dining table with refined beveled edges, seating 6 persons comfortably.',
        price: 550,
      },
      {
        name: 'Round Dining Table',
        category: 'table',
        defaultColor: '#DEB887',
        dimensions: { width: 1.2, height: 0.75, depth: 1.2 },
        description: 'Elegant round pedestal dining table crafted from natural birchwood with a polished matte finish.',
        price: 450,
      },
      {
        name: 'Compact Side Table',
        category: 'table',
        defaultColor: '#D2691E',
        dimensions: { width: 0.45, height: 0.55, depth: 0.45 },
        description: 'Minimalist side table with a warm chocolate finish, ideal for placing beside sofas and armchairs.',
        price: 75,
      },

      // ---- SOFAS (3) ----
      {
        name: 'L-Shaped Corner Sofa',
        category: 'sofa',
        defaultColor: '#696969',
        dimensions: { width: 2.5, height: 0.85, depth: 1.8 },
        description: 'Large L-shaped sectional sofa upholstered in premium charcoal fabric with deep foam cushioning.',
        price: 1250,
      },
      {
        name: 'Classic 3-Seater Sofa',
        category: 'sofa',
        defaultColor: '#8B7355',
        dimensions: { width: 2.1, height: 0.85, depth: 0.9 },
        description: 'Timeless three-seater sofa with rich tan leather upholstery and solid walnut wood frame.',
        price: 899,
      },
      {
        name: 'Modern Loveseat',
        category: 'sofa',
        defaultColor: '#B0C4DE',
        dimensions: { width: 1.4, height: 0.8, depth: 0.85 },
        description: 'Compact two-seater loveseat in soft steel blue fabric, perfect for cozy reading corners.',
        price: 550,
      },

      // ---- CUPBOARDS & CABINETS (3) ----
      {
        name: 'Tall Wardrobe',
        category: 'cupboard',
        defaultColor: '#F5DEB3',
        dimensions: { width: 1.2, height: 2.0, depth: 0.6 },
        description: 'Full-height double-door wardrobe in natural wheat finish with internal shelving and hanging rail.',
        price: 499,
      },
      {
        name: 'Kitchen Cabinet',
        category: 'cupboard',
        defaultColor: '#FAEBD7',
        dimensions: { width: 0.8, height: 0.9, depth: 0.45 },
        description: 'Contemporary kitchen base cabinet with soft-close doors and adjustable interior shelf.',
        price: 220,
      },
      {
        name: 'Display Cabinet',
        category: 'cupboard',
        defaultColor: '#2F4F4F',
        dimensions: { width: 0.9, height: 1.6, depth: 0.4 },
        description: 'Elegant glass-front display cabinet in dark slate with integrated LED shelf lighting.',
        price: 375,
      },

      // ---- BEDS (2) ----
      {
        name: 'Queen Size Bed',
        category: 'bed',
        defaultColor: '#E8D8C4',
        dimensions: { width: 1.6, height: 1.1, depth: 2.0 },
        description: 'Upholstered queen-size platform bed with a tufted linen headboard and low-profile solid wood frame.',
        price: 650,
      },
      {
        name: 'Single Bed Frame',
        category: 'bed',
        defaultColor: '#C0C0C0',
        dimensions: { width: 1.0, height: 0.9, depth: 2.0 },
        description: 'Modern single bed with a sleek steel frame, powder-coated matte silver finish.',
        price: 250,
      },

      // ---- DESKS & SHELVES (2) ----
      {
        name: 'Executive Office Desk',
        category: 'desk',
        defaultColor: '#BC8F8F',
        dimensions: { width: 1.4, height: 0.75, depth: 0.7 },
        description: 'Spacious L-shaped executive desk with integrated cable management and three soft-close drawers.',
        price: 499,
      },
      {
        name: 'Bookshelf Unit',
        category: 'shelf',
        defaultColor: '#D2B48C',
        dimensions: { width: 0.8, height: 1.8, depth: 0.3 },
        description: 'Five-tier open bookshelf in warm tan oak, perfect for displaying books and decorative items.',
        price: 180,
      },

      // ---- TV UNITS & EXTRAS (2) ----
      {
        name: 'TV Console Unit',
        category: 'tv-unit',
        defaultColor: '#3C3C3C',
        dimensions: { width: 1.6, height: 0.5, depth: 0.4 },
        description: 'Sleek low-profile floating TV console in matte black with concealed storage compartments.',
        price: 320,
      },
      {
        name: 'Coffee Table',
        category: 'table',
        defaultColor: '#8B6914',
        dimensions: { width: 1.0, height: 0.45, depth: 0.6 },
        description: 'Mid-century modern coffee table with a tempered glass top and solid brass-finished steel legs.',
        price: 150,
      },
      // ---- FUTURISTIC EXTENSIONS (10) ----
      {
        name: 'Aero Ergonomic Pod Chair',
        category: 'armchair',
        defaultColor: '#1A1A1A',
        dimensions: { width: 0.8, height: 1.1, depth: 0.8 },
        description: 'Enclosed aerodynamic relaxation pod chair with acoustic shielding and matte black finish.',
        price: 850,
      },
      {
        name: 'Cyberspace Tech Desk',
        category: 'desk',
        defaultColor: '#121212',
        dimensions: { width: 1.8, height: 0.8, depth: 0.8 },
        description: 'Advanced carbon-fiber smart desk with built-in wireless charging pads and neon underglow.',
        price: 980,
      },
      {
        name: 'Holo-Projection Coffee Table',
        category: 'coffee-table',
        defaultColor: '#00A86B',
        dimensions: { width: 1.1, height: 0.4, depth: 0.7 },
        description: 'Low-profile glass and brushed steel table featuring an integrated faint green LED ring.',
        price: 499,
      },
      {
        name: 'Smart Modular Sofa Array',
        category: 'sofa',
        defaultColor: '#252526',
        dimensions: { width: 2.8, height: 0.75, depth: 1.1 },
        description: 'Sectional magnetic dark-grey cloud sofa with adjustable reclining nodes and cooling fabric.',
        price: 1850,
      },
      {
        name: 'Neon Edge Bed Frame',
        category: 'bed',
        defaultColor: '#00E676',
        dimensions: { width: 1.7, height: 0.4, depth: 2.1 },
        description: 'Hover-effect platform bed emitting a soft futuristic green rim light around the base.',
        price: 1100,
      },
      {
        name: 'Omni-directional TV Console',
        category: 'tv-unit',
        defaultColor: '#1E1E1E',
        dimensions: { width: 2.0, height: 0.45, depth: 0.45 },
        description: 'Matte black minimal media console with automated sliding privacy doors.',
        price: 640,
      },
      {
        name: 'Quantum Storage Wardrobe',
        category: 'wardrobe',
        defaultColor: '#2D2D2D',
        dimensions: { width: 1.5, height: 2.2, depth: 0.65 },
        description: 'Towering charcoal-grey wardrobe system with touch-responsive sliding panels.',
        price: 890,
      },
      {
        name: 'Hexagonal Floating Shelves',
        category: 'shelf',
        defaultColor: '#FFFFFF',
        dimensions: { width: 1.2, height: 0.8, depth: 0.25 },
        description: 'Interlocking geometric wall shelves finished in high-gloss white for sharp contrast.',
        price: 195,
      },
      {
        name: 'Data-Core Dining Table',
        category: 'dining-table',
        defaultColor: '#121212',
        dimensions: { width: 2.0, height: 0.75, depth: 1.0 },
        description: 'Massive obsidian-black dining surface anchored by a central illuminated pedestal.',
        price: 1200,
      },
      {
        name: 'Zero-G Recliner',
        category: 'chair',
        defaultColor: '#34D399',
        dimensions: { width: 0.7, height: 1.0, depth: 0.9 },
        description: 'High-tech relaxation chair with emerald green stitching engineered to simulate weightlessness.',
        price: 520,
      },
      // ---- 20 ADDITIONAL ITEMS ----
      {
        name: 'Ergonomic Mesh Task Chair',
        category: 'chair',
        defaultColor: '#333333',
        dimensions: { width: 0.6, height: 1.0, depth: 0.6 },
        description: 'High-performance task chair with breathable mesh back and adjustable armrests.',
        price: 199,
      },
      {
        name: 'Minimalist Wood Dining Chair',
        category: 'chair',
        defaultColor: '#D2B48C',
        dimensions: { width: 0.45, height: 0.85, depth: 0.45 },
        description: 'Simple and elegant solid wood dining chair with a curved backrest.',
        price: 120,
      },
      {
        name: 'Leather Swivel Recliner',
        category: 'armchair',
        defaultColor: '#5C4033',
        dimensions: { width: 0.85, height: 1.05, depth: 0.9 },
        description: 'Plush full-grain leather reclining chair with 360-degree swivel base.',
        price: 850,
      },
      {
        name: 'Rustic Farmhouse Dining Table',
        category: 'dining-table',
        defaultColor: '#8B4513',
        dimensions: { width: 2.2, height: 0.78, depth: 1.0 },
        description: 'Sturdy reclaimed wood dining table with an antiqued finish, comfortably seating eight.',
        price: 950,
      },
      {
        name: 'Marble Top Coffee Table',
        category: 'coffee-table',
        defaultColor: '#FDFCF0',
        dimensions: { width: 1.2, height: 0.4, depth: 0.6 },
        description: 'Elegant living room centerpiece featuring a Carrera marble top and gold-finished frame.',
        price: 499,
      },
      {
        name: 'Glass End Table',
        category: 'side-table',
        defaultColor: '#A9A9A9',
        dimensions: { width: 0.5, height: 0.5, depth: 0.5 },
        description: 'Contemporary square end table with tempered glass top and polished chrome legs.',
        price: 150,
      },
      {
        name: 'Modular Sectional Sofa',
        category: 'sofa',
        defaultColor: '#708090',
        dimensions: { width: 3.0, height: 0.85, depth: 2.2 },
        description: 'Versatile multi-piece fabric sectional designed for large open living spaces.',
        price: 1400,
      },
      {
        name: 'Velvet Sleeper Sofa',
        category: 'sofa',
        defaultColor: '#000080',
        dimensions: { width: 2.0, height: 0.9, depth: 0.9 },
        description: 'Luxurious navy velvet couch that easily folds out into a full-size guest bed.',
        price: 1100,
      },
      {
        name: 'Asymmetrical Wall Shelf',
        category: 'shelf',
        defaultColor: '#2F4F4F',
        dimensions: { width: 1.5, height: 1.2, depth: 0.25 },
        description: 'Modern geometric floating shelf unit ideal for displaying art, plants, and books.',
        price: 240,
      },
      {
        name: 'Floating Oak Shelves (Set)',
        category: 'shelf',
        defaultColor: '#DAA520',
        dimensions: { width: 0.9, height: 0.1, depth: 0.2 },
        description: 'Minimalist solid oak floating wall shelves with invisible mounting hardware.',
        price: 135,
      },
      {
        name: 'Industrial Metal Cabinet',
        category: 'cabinet',
        defaultColor: '#4A4A4A',
        dimensions: { width: 0.8, height: 1.4, depth: 0.4 },
        description: 'Rugged steel accent cabinet with mesh doors and cast iron hardware.',
        price: 380,
      },
      {
        name: 'Antique Wood Cabinet',
        category: 'cabinet',
        defaultColor: '#654321',
        dimensions: { width: 1.0, height: 1.8, depth: 0.45 },
        description: 'Vintage-style carved mahogany cabinet featuring ample internal storage space.',
        price: 760,
      },
      {
        name: 'Shaker Style Cupboard',
        category: 'cupboard',
        defaultColor: '#F5F5DC',
        dimensions: { width: 0.9, height: 1.9, depth: 0.5 },
        description: 'Classic off-white painted kitchen cupboard with traditional shaker-style panel doors.',
        price: 450,
      },
      {
        name: 'King Size Canopy Bed',
        category: 'bed',
        defaultColor: '#1A1A1A',
        dimensions: { width: 2.0, height: 2.1, depth: 2.1 },
        description: 'Striking black metal canopy bed frame adding dramatic architectural height to the bedroom.',
        price: 890,
      },
      {
        name: 'Murphy Wall Bed',
        category: 'bed',
        defaultColor: '#D3D3D3',
        dimensions: { width: 1.5, height: 2.1, depth: 0.4 },
        description: 'Space-saving full-size fold-down bed seamlessly concealed within a modern wall cabinet.',
        price: 1350,
      },
      {
        name: 'L-Shaped Gaming Desk',
        category: 'desk',
        defaultColor: '#000000',
        dimensions: { width: 1.6, height: 0.75, depth: 1.2 },
        description: 'Expansive corner desk featuring a carbon fiber texture surface and integrated cable routing.',
        price: 340,
      },
      {
        name: 'Motorized Standing Desk',
        category: 'desk',
        defaultColor: '#FDF5E6',
        dimensions: { width: 1.4, height: 1.2, depth: 0.7 },
        description: 'Height-adjustable ergonomic workstation with a bamboo top and programmable memory settings.',
        price: 599,
      },
      {
        name: 'Mirrored Sliding Wardrobe',
        category: 'wardrobe',
        defaultColor: '#FFFFFF',
        dimensions: { width: 2.2, height: 2.3, depth: 0.6 },
        description: 'Massive contemporary closet system featuring full-length mirrored sliding doors.',
        price: 1250,
      },
      {
        name: 'Open Corner Wardrobe',
        category: 'wardrobe',
        defaultColor: '#8FBC8B',
        dimensions: { width: 1.2, height: 2.0, depth: 1.2 },
        description: 'Modular corner garment organizer with hanging rods and open cubic shelving.',
        price: 680,
      },
      {
        name: 'Modern Entertainment Center',
        category: 'tv-unit',
        defaultColor: '#808080',
        dimensions: { width: 2.4, height: 1.6, depth: 0.45 },
        description: 'Comprehensive media wall unit with integrated LED framing and push-to-open cabinets.',
        price: 920,
      },
      {
        name: 'Scandinavian Lounge Chair',
        category: 'chair',
        defaultColor: '#B38B6D',
        dimensions: { width: 0.58, height: 0.86, depth: 0.62 },
        description: 'Curved oak frame lounge chair with woven seat and soft neutral finish.',
        price: 210,
      },
      {
        name: 'Tufted Reading Armchair',
        category: 'armchair',
        defaultColor: '#6A5C4F',
        dimensions: { width: 0.82, height: 0.92, depth: 0.84 },
        description: 'Deep-cushion armchair with button tufting and a cozy reading profile.',
        price: 460,
      },
      {
        name: 'Compact Bistro Table',
        category: 'table',
        defaultColor: '#8F6A4A',
        dimensions: { width: 0.9, height: 0.74, depth: 0.9 },
        description: 'Round pedestal bistro table sized for compact dining corners.',
        price: 230,
      },
      {
        name: 'Nested Side Tables Set',
        category: 'side-table',
        defaultColor: '#A38B74',
        dimensions: { width: 0.55, height: 0.5, depth: 0.55 },
        description: 'Two nesting side tables with slim black legs and warm walnut tops.',
        price: 175,
      },
      {
        name: 'Ribbed Oak Coffee Table',
        category: 'coffee-table',
        defaultColor: '#9B7D5D',
        dimensions: { width: 1.15, height: 0.42, depth: 0.65 },
        description: 'Low modern coffee table with ribbed wooden base and soft-rounded top.',
        price: 320,
      },
      {
        name: 'Curved Boucle Sofa',
        category: 'sofa',
        defaultColor: '#D9CFC3',
        dimensions: { width: 2.2, height: 0.82, depth: 0.95 },
        description: 'Soft sculptural boucle sofa with rounded silhouette and deep seating.',
        price: 1340,
      },
      {
        name: 'Low Platform Bed',
        category: 'bed',
        defaultColor: '#C2A98A',
        dimensions: { width: 1.8, height: 0.95, depth: 2.1 },
        description: 'Minimal low-profile platform bed with broad timber rails and clean edges.',
        price: 780,
      },
      {
        name: 'Steel Frame Bookshelf',
        category: 'shelf',
        defaultColor: '#4F4F4F',
        dimensions: { width: 1.0, height: 2.0, depth: 0.35 },
        description: 'Industrial style shelf combining matte steel posts and wood planks.',
        price: 290,
      },
      {
        name: 'Tambour Door Cabinet',
        category: 'cabinet',
        defaultColor: '#7B654F',
        dimensions: { width: 1.1, height: 1.2, depth: 0.45 },
        description: 'Mid-century storage cabinet with sliding tambour doors and brass pulls.',
        price: 540,
      },
      {
        name: 'Pantry Tall Cupboard',
        category: 'cupboard',
        defaultColor: '#EFE8DD',
        dimensions: { width: 0.95, height: 2.05, depth: 0.55 },
        description: 'Tall pantry cupboard with five internal shelves and shaker styling.',
        price: 510,
      },
      {
        name: 'Dual Motor Work Desk',
        category: 'desk',
        defaultColor: '#2F2F2F',
        dimensions: { width: 1.6, height: 1.25, depth: 0.75 },
        description: 'Heavy-duty standing desk frame with programmable height adjustment.',
        price: 690,
      },
      {
        name: 'Mirror Panel Wardrobe',
        category: 'wardrobe',
        defaultColor: '#DCDCDC',
        dimensions: { width: 2.0, height: 2.25, depth: 0.62 },
        description: 'Three-panel wardrobe with mirrored center door and hanging rails.',
        price: 1160,
      },
      {
        name: 'Slatted Media Console',
        category: 'tv-unit',
        defaultColor: '#6F5A45',
        dimensions: { width: 1.9, height: 0.52, depth: 0.42 },
        description: 'Walnut media console with slatted fronts and hidden cable channels.',
        price: 480,
      },
      {
        name: 'Compact Guest Bed',
        category: 'bed',
        defaultColor: '#B8B0A8',
        dimensions: { width: 1.2, height: 0.88, depth: 2.0 },
        description: 'Slim guest bed frame designed for apartments and spare rooms.',
        price: 430,
      },
      {
        name: 'Wingback Accent Chair',
        category: 'chair',
        defaultColor: '#5A6B72',
        dimensions: { width: 0.68, height: 1.02, depth: 0.72 },
        description: 'High-back wing chair with tapered legs and supportive side panels.',
        price: 340,
      },
      {
        name: 'Linear Dining Bench',
        category: 'table',
        defaultColor: '#8A6C50',
        dimensions: { width: 1.6, height: 0.46, depth: 0.4 },
        description: 'Multipurpose bench for dining spaces, entryways, or window seating.',
        price: 260,
      },
      {
        name: 'Curio Display Shelf',
        category: 'shelf',
        defaultColor: '#BCA58A',
        dimensions: { width: 0.72, height: 1.85, depth: 0.32 },
        description: 'Narrow vertical display shelf with stepped compartments for decor.',
        price: 220,
      },
      {
        name: 'Corner Workstation Desk',
        category: 'desk',
        defaultColor: '#3D3D3D',
        dimensions: { width: 1.45, height: 0.76, depth: 1.05 },
        description: 'Space-efficient corner desk with raised monitor shelf and drawer.',
        price: 410,
      },
      {
        name: 'Soft Modular Loveseat',
        category: 'sofa',
        defaultColor: '#C9C1B7',
        dimensions: { width: 1.55, height: 0.8, depth: 0.9 },
        description: 'Compact modular loveseat with removable cushions and clean lines.',
        price: 760,
      },
      {
        name: 'Heritage Storage Cabinet',
        category: 'cabinet',
        defaultColor: '#6B4E3A',
        dimensions: { width: 0.95, height: 1.55, depth: 0.43 },
        description: 'Traditional wood cabinet with paneled doors and adjustable shelving.',
        price: 590,
      },
    ];

    const furniture = await Furniture.insertMany(furnitureData);
    console.log(`${furniture.length} furniture items created.`);

    // ===== CREATE 7 ROOM TEMPLATES =====
    const roomTemplates = [
      {
        name: 'Modern Living Room',
        width: 6,
        height: 3,
        depth: 5,
        shape: 'rectangular',
        wallColor: '#F5F5F0',
        floorColor: '#C4A882',
        ceilingColor: '#FFFFFF',
        isTemplate: true,
        templateCategory: 'living-room',
        createdBy: adminUser._id,
      },
      {
        name: 'Cozy Bedroom',
        width: 4.5,
        height: 2.8,
        depth: 4,
        shape: 'rectangular',
        wallColor: '#E8E0D8',
        floorColor: '#8B7355',
        ceilingColor: '#FFFFFF',
        isTemplate: true,
        templateCategory: 'bedroom',
        createdBy: adminUser._id,
      },
      {
        name: 'Elegant Dining Room',
        width: 5,
        height: 3,
        depth: 4.5,
        shape: 'rectangular',
        wallColor: '#FFF8E7',
        floorColor: '#A0522D',
        ceilingColor: '#FFFAF0',
        isTemplate: true,
        templateCategory: 'dining-room',
        createdBy: adminUser._id,
      },
      {
        name: 'Professional Office',
        width: 5.5,
        height: 2.7,
        depth: 4,
        shape: 'rectangular',
        wallColor: '#E8EDF2',
        floorColor: '#9E9E9E',
        ceilingColor: '#FFFFFF',
        isTemplate: true,
        templateCategory: 'office',
        createdBy: adminUser._id,
      },
      {
        name: 'Open Plan Kitchen',
        width: 6,
        height: 2.8,
        depth: 5.5,
        shape: 'open-plan',
        wallColor: '#F0EDE5',
        floorColor: '#D2B48C',
        ceilingColor: '#FFFFFF',
        isTemplate: true,
        templateCategory: 'kitchen',
        createdBy: adminUser._id,
      },
      {
        name: 'Creative Studio',
        width: 7,
        height: 3.5,
        depth: 6,
        shape: 'open-plan',
        wallColor: '#FFFFFF',
        floorColor: '#B0B0B0',
        ceilingColor: '#F0F0F0',
        isTemplate: true,
        templateCategory: 'studio',
        createdBy: adminUser._id,
      },
      {
        name: 'Compact L-Shaped Room',
        width: 5,
        height: 2.7,
        depth: 5,
        shape: 'l-shaped',
        wallColor: '#F0F4EF',
        floorColor: '#BDA68D',
        ceilingColor: '#FFFFFF',
        isTemplate: true,
        templateCategory: 'living-room',
        createdBy: adminUser._id,
      },
    ];

    const rooms = await Room.insertMany(roomTemplates);
    console.log(`${rooms.length} room templates created.`);

    // ===== CREATE A SAMPLE DESIGN =====
    const sampleDesign = await Design.create({
      name: 'Living Room Arrangement',
      room: rooms[0]._id,
      furnitureItems: [
        {
          furniture: furniture[6]._id, // L-Shaped Sofa
          x: 1,
          y: 0,
          z: 0.5,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          color: '#696969',
        },
        {
          furniture: furniture[5]._id, // Side Table
          x: 3.8,
          y: 0,
          z: 0.5,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          color: '#D2691E',
        },
        {
          furniture: furniture[15]._id, // Bookshelf
          x: 0.2,
          y: 0,
          z: 4.5,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          color: '#D2B48C',
        },
      ],
      createdBy: adminUser._id,
    });

    console.log('Sample design created.');

    console.log('\n===== SEED DATA COMPLETE =====');
    console.log('\nDefault Accounts:');
    console.log('  Admin: admin@designstudio.com / admin123');
    console.log('  User:  john@example.com / user123');
    console.log(`\n  Furniture items: ${furniture.length}`);
    console.log(`  Room templates: ${rooms.length}`);
    console.log(`  Sample designs: 1`);

    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
};

seedData();
