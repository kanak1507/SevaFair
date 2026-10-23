import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreateBooking() {
const navigate = useNavigate();

const [formData, setFormData] = useState({
category: '',
description: '',
address: '',
area: 'Bengaluru',
date: '',
startTime: '',
endTime: ''
});

const [errors, setErrors] = useState({});
const [submitting, setSubmitting] = useState(false);

const validate = () => {
const newErrors = {};

if (!formData.category) newErrors.category = 'Please select a service';
if (!formData.description.trim()) newErrors.description = 'Please describe the problem';
if (!formData.address.trim()) newErrors.address = 'Please enter the service address';
if (!formData.area.trim()) newErrors.area = 'Please enter the service area';
if (!formData.date) newErrors.date = 'Please select a date';
if (!formData.startTime) newErrors.startTime = 'Please select a start time';
if (!formData.endTime) newErrors.endTime = 'Please select an end time';

if (formData.date && formData.date < new Date().toLocaleDateString('en-CA')) {
  newErrors.date = 'Date cannot be in the past';
}

if (
  formData.startTime &&
  formData.endTime &&
  formData.startTime >= formData.endTime
) {
  newErrors.endTime = 'End time must be later than start time';
}

setErrors(newErrors);
return Object.keys(newErrors).length === 0;


};

const handleChange = (e) => {
const { name, value } = e.target;
setFormData((previous) => ({ ...previous, [name]: value }));


if (errors[name]) {
  setErrors((previous) => ({ ...previous, [name]: '' }));
}


};

const handleSubmit = async (e) => {
e.preventDefault();


if (!validate()) return;

setSubmitting(true);

try {
  const bookingData = {
    customer_id: 1,
    service_type: formData.category,
    description: formData.description.trim(),
    service_address: `${formData.address.trim()}, ${formData.area.trim()}`,
    start_time: `${formData.date}T${formData.startTime}:00`,
    end_time: `${formData.date}T${formData.endTime}:00`
  };

  const res = await api.createBooking(bookingData);

  if (!res.success) {
    throw new Error(res.message || 'Could not create booking');
  }

  const booking = res.data || res;
  const allocated = booking.allocated;
  const workerName = booking.worker?.user_name || booking.worker?.name;

  if (allocated && workerName) {
    alert(`Booking created successfully!\nYour service provider is ${workerName}.`);
  } else if (allocated) {
    alert('Booking created successfully and a service provider has been assigned!');
  } else {
    alert(
      'Booking created successfully, but no suitable worker is currently available. Your booking may remain pending.'
    );
  }

  navigate('/customer');
} catch (err) {
  console.error('Booking creation error:', err);
  alert(`Failed to create booking: ${err.message}`);
} finally {
  setSubmitting(false);
}

};

return ( <div className="max-w-2xl mx-auto"> <h1 className="text-2xl font-bold text-slate-900 mb-6">
Book a New Service </h1>


  <form onSubmit={handleSubmit} className="card space-y-4">
    <div>
      <label className="label">Service Category</label>
      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        className="input-field"
      >
        <option value="">Select a service</option>
        <option value="Plumbing">Plumbing</option>
        <option value="Electrical">Electrical</option>
        <option value="Cleaning">Cleaning</option>
        <option value="Repair">Repair</option>
      </select>
      {errors.category && (
        <p className="text-red-500 text-xs mt-1">{errors.category}</p>
      )}
    </div>

    <div>
      <label className="label">Problem Description</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows="3"
        className="input-field"
        placeholder="Describe the issue..."
      />
      {errors.description && (
        <p className="text-red-500 text-xs mt-1">{errors.description}</p>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">Service Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="input-field"
          placeholder="Street address"
        />
        {errors.address && (
          <p className="text-red-500 text-xs mt-1">{errors.address}</p>
        )}
      </div>

      <div>
        <label className="label">Service Area</label>
        <input
          type="text"
          name="area"
          value={formData.area}
          onChange={handleChange}
          className="input-field"
          placeholder="City / Locality"
        />
        {errors.area && (
          <p className="text-red-500 text-xs mt-1">{errors.area}</p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="label">Date</label>
        <input
          type="date"
          name="date"
          min={new Date().toLocaleDateString('en-CA')}
          value={formData.date}
          onChange={handleChange}
          className="input-field"
        />
        {errors.date && (
          <p className="text-red-500 text-xs mt-1">{errors.date}</p>
        )}
      </div>

      <div>
        <label className="label">Start Time</label>
        <input
          type="time"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          className="input-field"
        />
        {errors.startTime && (
          <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
        )}
      </div>

      <div>
        <label className="label">End Time</label>
        <input
          type="time"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          className="input-field"
        />
        {errors.endTime && (
          <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
        )}
      </div>
    </div>

    <div className="pt-4 flex gap-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn-secondary flex-1"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary flex-1 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Booking'}
      </button>
    </div>
  </form>
</div>


);
}
