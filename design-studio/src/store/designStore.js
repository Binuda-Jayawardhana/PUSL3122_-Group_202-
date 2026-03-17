import { create } from 'zustand';
import api from '../api/client';

const useDesignStore = create((set, get) => ({
  designs: [],
  currentDesign: null,
  rooms: [],
  roomTemplates: [],
  furnitureCatalog: [],
  categories: [],
  selectedItemId: null,  // NEW: track selected furniture item
  isLoading: false,
  error: null,

  // --- Furniture Actions ---
  fetchFurniture: async () => {
    try {
      set({ isLoading: true, error: null });
      // Request a high page size so full catalog is visible in UI (default backend limit is 10)
      const res = await api.get('/furniture?limit=200&page=1');
      set({ furnitureCatalog: res.data.furniture, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch furniture', isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await api.get('/furniture/categories');
      set({ categories: res.data.categories });
    } catch (error) {
      console.error(error);
    }
  },

  // --- Room Actions ---
  fetchRooms: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get('/rooms');
      set({ rooms: res.data.rooms, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch rooms', isLoading: false });
    }
  },

  fetchRoomTemplates: async () => {
    try {
      const res = await api.get('/rooms/templates');
      set({ roomTemplates: res.data.rooms || res.data });
    } catch (error) {
      console.error(error);
    }
  },

  createRoom: async (roomData) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/rooms', roomData);
      set(state => ({ rooms: [res.data.room, ...state.rooms], isLoading: false }));
      return res.data.room;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create room', isLoading: false });
      return null;
    }
  },

  // --- Design Actions ---
  fetchDesigns: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get('/designs');
      set({ designs: res.data.designs, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch designs', isLoading: false });
    }
  },

  fetchDesignById: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get(`/designs/${id}`);
      set({ currentDesign: res.data.design, isLoading: false });
      return res.data.design;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch design', isLoading: false });
      return null;
    }
  },

  createDesign: async (name, roomId) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/designs', { name, room: roomId });
      set(state => ({
        designs: [res.data.design, ...state.designs],
        currentDesign: res.data.design,
        isLoading: false
      }));
      return res.data.design;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create design', isLoading: false });
      return null;
    }
  },

  updateDesignName: async (id, newName) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.put(`/designs/${id}`, { name: newName });
      set(state => ({
        designs: state.designs.map(d => d._id === id ? res.data.design : d),
        currentDesign: state.currentDesign?._id === id ? res.data.design : state.currentDesign,
        isLoading: false
      }));
      return res.data.design;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update design name', isLoading: false });
      return null;
    }
  },

  deleteDesign: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await api.delete(`/designs/${id}`);
      set(state => ({
        designs: state.designs.filter(d => d._id !== id),
        currentDesign: state.currentDesign?._id === id ? null : state.currentDesign,
        selectedItemId: state.currentDesign?._id === id ? null : state.selectedItemId,
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete design', isLoading: false });
      return false;
    }
  },

  // --- Selection ---
  selectItem: (itemId) => set({ selectedItemId: itemId }),
  deselectItem: () => set({ selectedItemId: null }),

  // --- Editor Actions (matching backend flat x,y,z schema) ---
  addFurnitureToDesign: async (designId, furnitureId, posX = 2, posZ = 2) => {
    try {
      const res = await api.post(`/designs/${designId}/furniture`, {
        furniture: furnitureId,
        x: posX,
        y: 0,
        z: posZ,
      });
      set({ currentDesign: res.data.design });
    } catch (error) {
      console.error('Error adding furniture', error);
      set({ error: error.response?.data?.message || 'Failed to add item' });
    }
  },

  updateFurnitureItem: async (designId, itemId, updates, saveToApi = true) => {
    try {
      // Optimistic update
      set(state => {
        if (!state.currentDesign) return state;
        const newItems = state.currentDesign.furnitureItems.map(item =>
          item._id === itemId ? { ...item, ...updates } : item
        );
        return { currentDesign: { ...state.currentDesign, furnitureItems: newItems } };
      });

      if (!saveToApi) return; // Skip API call for hover/drag updates

      // API call  (backend expects flat fields: x, y, z, color, rotation, etc.)
      const res = await api.put(`/designs/${designId}/furniture/${itemId}`, updates);
      set({ currentDesign: res.data.design });
    } catch (error) {
      console.error('Error updating item', error);
      get().fetchDesignById(designId);
    }
  },

  removeFurniture: async (designId, itemId) => {
    try {
      const res = await api.delete(`/designs/${designId}/furniture/${itemId}`);
      set({ currentDesign: res.data.design, selectedItemId: null });
    } catch (error) {
      console.error('Error removing item', error);
    }
  },

  scaleDesign: async (designId, factor) => {
    try {
      const res = await api.put(`/designs/${designId}/scale`, { scaleFactor: factor });
      set({ currentDesign: res.data.design });
    } catch (error) {
      console.error('Error scaling', error);
    }
  },

  shadeDesign: async (designId, intensity, type, targetItemIds = null) => {
    try {
      const payload = { intensity, type };
      if (targetItemIds) payload.itemIds = targetItemIds;

      const res = await api.put(`/designs/${designId}/shade`, payload);
      set({ currentDesign: res.data.design });
    } catch (error) {
      console.error('Error shading', error);
    }
  },

  colorDesign: async (designId, colorHex, targetItemIds = null) => {
    try {
      const payload = { color: colorHex };
      if (targetItemIds) payload.itemIds = targetItemIds;

      const res = await api.put(`/designs/${designId}/color`, payload);
      set({ currentDesign: res.data.design });
    } catch (error) {
      console.error('Error changing color', error);
    }
  },

  // Clear current design
  clearCurrentDesign: () => set({ currentDesign: null, selectedItemId: null }),

  clearError: () => set({ error: null })
}));

export default useDesignStore;
