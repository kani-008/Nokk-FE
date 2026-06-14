import { create } from 'zustand';
import { mockAPI } from '../data/mockData';

export const useAuthStore = create((set, get) => ({
  user: (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nok_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  })(),
  isLoggedIn: (() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nok_isLoggedIn') === 'true';
    }
    return false;
  })(),
  error: null,

  login: (email, password) => {
    const users = mockAPI.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      set({ error: 'User not found' });
      return false;
    }

    if (foundUser.status === 'Blocked') {
      set({ error: 'This account has been blocked. Please contact support.' });
      return false;
    }

    // Mock validation (accepting admin123 or customer123, or any password for simplicity)
    const isPassValid = 
      (email === 'admin@nammaoor.com' && password === 'admin123') ||
      (email === 'customer@gmail.com' && password === 'customer123') ||
      password.length >= 6; // allow other signups

    if (!isPassValid) {
      set({ error: 'Invalid password. Try "admin123" or "customer123".' });
      return false;
    }

    const sessionUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      phone: foundUser.phone,
      role: foundUser.role || 'customer',
      joinedDate: foundUser.joinedDate,
      addresses: foundUser.addresses || []
    };

    localStorage.setItem('nok_user', JSON.stringify(sessionUser));
    localStorage.setItem('nok_isLoggedIn', 'true');
    set({ user: sessionUser, isLoggedIn: true, error: null });
    return true;
  },

  register: (userData) => {
    const users = mockAPI.getUsers();
    const exists = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());

    if (exists) {
      set({ error: 'Email already registered' });
      return false;
    }

    // Add to mock DB users list
    const newUser = {
      id: 'usr-' + Date.now(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      joinedDate: new Date().toISOString().split('T')[0],
      ordersCount: 0,
      status: 'Active',
      role: 'customer',
      addresses: []
    };

    const nokDB = JSON.parse(localStorage.getItem('nok_db') || '{}');
    nokDB.users.push(newUser);
    localStorage.setItem('nok_db', JSON.stringify(nokDB));

    // Log user in automatically
    localStorage.setItem('nok_user', JSON.stringify(newUser));
    localStorage.setItem('nok_isLoggedIn', 'true');
    set({ user: newUser, isLoggedIn: true, error: null });
    return true;
  },

  logout: () => {
    localStorage.removeItem('nok_user');
    localStorage.removeItem('nok_isLoggedIn');
    set({ user: null, isLoggedIn: false, error: null });
  },

  updateProfile: (updatedData) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    const updated = { ...currentUser, ...updatedData };
    
    // Update locally stored DB
    const nokDB = JSON.parse(localStorage.getItem('nok_db') || '{}');
    nokDB.users = nokDB.users.map(u => u.id === currentUser.id ? { ...u, ...updatedData } : u);
    localStorage.setItem('nok_db', JSON.stringify(nokDB));

    // Update session
    localStorage.setItem('nok_user', JSON.stringify(updated));
    set({ user: updated });
    return true;
  },

  addAddress: (address) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    const newAddress = {
      ...address,
      id: 'addr-' + Date.now(),
      isDefault: currentUser.addresses.length === 0
    };

    const updatedAddresses = [...currentUser.addresses, newAddress];
    get().updateProfile({ addresses: updatedAddresses });
    return true;
  },

  deleteAddress: (addressId) => {
    const currentUser = get().user;
    if (!currentUser) return false;

    const updatedAddresses = currentUser.addresses.filter(a => a.id !== addressId);
    get().updateProfile({ addresses: updatedAddresses });
    return true;
  },

  clearError: () => set({ error: null })
}));
