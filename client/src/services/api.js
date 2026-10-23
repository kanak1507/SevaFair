const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_DEMO = import.meta.env.VITE_USE_DEMO === 'true';

import {
demoBookings,
demoWorkers,
allocationDemoData,
timelineDemoData
} from '../data/demoData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(endpoint, options = {}) {
const res = await fetch(`${API_URL}${endpoint}`, {
headers: { 'Content-Type': 'application/json' },
...options
});

const data = await res.json();

if (!res.ok) {
throw new Error(data.message || `Request failed: ${res.status}`);
}

return data;
}

const api = {
async getBookings() {
if (USE_DEMO) {
await delay(300);
return { success: true, data: demoBookings };
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
const res = await fetch(`${API_URL}/bookings`, {
signal: controller.signal
});

if (!res.ok) {
  throw new Error(`Bookings API error: ${res.status}`);
}

return await res.json();

} finally {
clearTimeout(timeout);
}
},


async getWorkers() {
if (USE_DEMO) {
await delay(300);
return { success: true, data: demoWorkers };
}


return request('/workers');


},

async createBooking(bookingData) {
if (USE_DEMO) {
await delay(500);
return {
success: true,
message: 'Demo: Booking created successfully!',
data: {
id: `B${Math.floor(Math.random() * 1000)}`,
allocated: true
}
};
}


return request('/bookings', {
  method: 'POST',
  body: JSON.stringify(bookingData)
});


},

async getAllocationDetails(bookingId) {
if (USE_DEMO) {
await delay(300);
return { success: true, data: allocationDemoData };
}


return request(`/bookings/${bookingId}`);

},

async getTimeline(bookingId) {
if (USE_DEMO) {
await delay(300);
return { success: true, data: timelineDemoData };
}


return request(`/bookings/${bookingId}/history`);


}
};

export default api;
