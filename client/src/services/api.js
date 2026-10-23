const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_DEMO = import.meta.env.VITE_USE_DEMO === 'true';

import { demoBookings, demoWorkers, allocationDemoData, timelineDemoData } from '../data/demoData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const api = {
  async getBookings() {
    if (USE_DEMO) { await delay(500); return demoBookings; }
    const res = await fetch(`${API_URL}/bookings`);
    return res.json();
  },
  async getWorkers() {
    if (USE_DEMO) { await delay(500); return demoWorkers; }
    const res = await fetch(`${API_URL}/workers`);
    return res.json();
  },
  async createBooking(bookingData) {
    if (USE_DEMO) { 
      await delay(800); 
      return { success: true, message: 'Demo: Booking created successfully!', id: `B${Math.floor(Math.random()*1000)}` }; 
    }
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return res.json();
  },
  async getAllocationDetails(bookingId) {
    if (USE_DEMO) { await delay(600); return allocationDemoData; }
    const res = await fetch(`${API_URL}/allocation/${bookingId}`);
    return res.json();
  },
  async getTimeline(bookingId) {
    if (USE_DEMO) { await delay(600); return timelineDemoData; }
    const res = await fetch(`${API_URL}/timeline/${bookingId}`);
    return res.json();
  }
};

export default api;