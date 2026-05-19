import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import WardOverviewPage from './pages/WardOverviewPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AlertsPage from './pages/AlertsPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading MediSense...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<WardOverviewPage />} />
          <Route path="patient/:id" element={<PatientDetailPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="admin" element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute adminOnly>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
