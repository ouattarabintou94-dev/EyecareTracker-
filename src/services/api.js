import axios from 'axios';
import { API_URL } from '../config';

// Token stocké en mémoire (évite les problèmes AsyncStorage)
let _token = null;
export const setToken = (t) => { _token = t; };
export const getToken = () => _token;
export const clearToken = () => { _token = null; };

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────
export const loginAPI = (phone, password) =>
  api.post('/auth/login', { phone, password });

export const registerAPI = (data) =>
  api.post('/auth/register', data);

// ── Patients ──────────────────────────────────────────────────────────────────
export const getPatientsAPI = () => api.get('/patients');
export const getPatientAPI = (id) => api.get(`/patients/${id}`);
export const addPatientAPI = (data) => api.post('/patients', data);

// ── Rendez-vous ───────────────────────────────────────────────────────────────
export const getAppointmentsAPI = () => api.get('/appointments');
export const addAppointmentAPI = (data) => api.post('/appointments', data);
export const updateAppointmentAPI = (id, data) => api.put(`/appointments/${id}`, data);

// ── Dépistages ────────────────────────────────────────────────────────────────
export const getScreeningsAPI = () => api.get('/screenings');
export const getMyScreeningsAPI = () => api.get('/screenings/mine');
export const saveScreeningAPI = (data) => api.post('/screenings', data);

// ── Symptômes ─────────────────────────────────────────────────────────────────
export const addSymptomsAPI = (data) => api.post('/symptoms', data);
export const getSymptomsAPI = () => api.get('/symptoms');

// ── Alertes ───────────────────────────────────────────────────────────────────
export const getAlertsAPI = () => api.get('/alerts');
export const markAlertReadAPI = (id) => api.put(`/alerts/${id}/read`);

export default api;
