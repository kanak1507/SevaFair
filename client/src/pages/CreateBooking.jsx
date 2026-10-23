import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreateBooking() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '', description: '', address: '', area: '', date: '', startTime: '', endTime: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.category) newErrors.category = 'Required';
    if (!formData.description) newErrors.description = 'Required';
    if (!formData.address) newErrors.address = 'Required';
    if (!formData.date) newErrors.date = 'Required';
    if (!formData.startTime) newErrors.startTime = 'Required';
    if (!formData.endTime) newErrors.endTime = 'Required';
    
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be later than start time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const res = await api.createBooking(formData);
      if (res.success) {
        alert(res.message);
        navigate('/customer');
      }
    } catch (err) {
      alert('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Book a New Service</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Service Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className="input-field">
            <option value="">Select a service</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Appliance Repair">Appliance Repair</option>
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="label">Problem Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="input-field" placeholder="Describe the issue..." />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Service Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" placeholder="Street address" />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="label">Service Area</label>
            <input type="text" name="area" value={formData.area} onChange={handleChange} className="input-field" placeholder="City / Locality" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="label">Start Time</label>
            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="input-field" />
            {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
          </div>
          <div>
            <label className="label">End Time</label>
            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="input-field" />
            {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}