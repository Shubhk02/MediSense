import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertBanner from './AlertBanner';
import AlertToast from './AlertToast';
import { useAlerts } from '../context/AlertContext';
import {
  LayoutGrid, Activity, Users, Settings, LogOut,
  Menu, X, HelpCircle, FileBarChart, Asterisk,
} from 'lucide-react';

export default function Layout() {
  const { profile, role, signOut } = useAuth();
  const { alerts } = useAlerts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const activeAlertCount = alerts.length;

  const navItems = [
    { name: 'Ward', path: '/', icon: LayoutGrid, exact: true },
    { name: 'Alerts', path: '/alerts', icon: Activity, badge: activeAlertCount || null },
  ];
  if (role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: Users });
    navItems.push({ name: 'Settings', path: '/settings', icon: Settings });
  }

  const secondaryNav = [
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Help', path: '/help', icon: HelpCircle },
  ];

  const initials = (profile?.name ?? role ?? 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const roleColors = {
    admin: 'bg-primary-500',
    nurse: 'bg-emerald-500',
    doctor: 'bg-accent-500',
  };
  const roleColor = roleColors[role] ?? 'bg-slate-400';

  return (
    <div className="min-h-screen flex bg-surface">
      {/* ══ DESKTOP SIDEBAR ══ */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-white border-r border-slate-100 sticky top-0 h-screen z-30 shadow-card">
        <SidebarContent
          navItems={navItems}
          secondaryNav={secondaryNav}
          initials={initials}
          roleColor={roleColor}
          role={role}
          profile={profile}
          signOut={signOut}
        />
      </aside>

      {/* ══ MOBILE: Top bar ══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 shadow-card flex items-center justify-between px-4 h-14 safe-top">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="MediSense" className="w-9 h-9 object-contain" />
          <span className="font-bold text-slate-900 tracking-tight text-[16px]">MediSense</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-surface-low transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ══ MOBILE: Drawer ══ */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-xl safe-top">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="MediSense" className="w-9 h-9 object-contain" />
                <span className="font-bold text-slate-900 tracking-tight text-[16px]">MediSense</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent
              navItems={navItems}
              secondaryNav={secondaryNav}
              initials={initials}
              roleColor={roleColor}
              role={role}
              profile={profile}
              signOut={signOut}
              onNav={() => setMobileMenuOpen(false)}
            />
          </aside>
        </>
      )}

      {/* ══ MAIN CONTENT ══ */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {!bannerDismissed && <AlertBanner onClose={() => setBannerDismissed(true)} />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-20 md:pt-6 pb-20 md:pb-8 page-enter">
          <Outlet />
        </main>

        {/* ══ MOBILE: Bottom tab bar ══ */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex safe-bottom z-30 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all relative ${
                    isActive ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600'
                  }`
                }
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-semibold">{item.name}</span>
              </NavLink>
            );
          })}
          <button
            onClick={signOut}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-slate-400 hover:text-red-500 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Sign Out</span>
          </button>
        </nav>
      </div>

      <AlertToast />
    </div>
  );
}

function SidebarContent({ navItems, secondaryNav, initials, roleColor, role, profile, signOut, onNav }) {
  const location = useLocation();

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="hidden md:flex items-center gap-3.5 px-5 py-6 border-b border-slate-100/60">
        <img src="/images/logo.png" alt="MediSense" className="w-11 h-11 object-contain flex-shrink-0" />
        <div>
          <p className="font-bold text-slate-900 text-[17px] tracking-tight leading-none">MediSense</p>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">IV Intelligence</p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        <p className="section-label">Menu</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.exact}
              onClick={onNav}
              className={() => active ? 'nav-item-active' : 'nav-item'}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge ? (
                <span className="ml-auto w-5 h-5 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full ${roleColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate leading-none">{profile?.name ?? 'User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 capitalize">{role}</span>
              {role === 'admin' && (
                <span className="text-[9px] font-bold bg-accent-500 text-white px-1.5 py-0.5 rounded-full leading-none">PRO</span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
