import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { User } from '../data/mockData';
import dayjs, { Dayjs } from 'dayjs';

export type ManagementTab = 'Operational' | 'Administrative' | 'Financial';

interface AuthContextType {
  user: User | null;
  users: Record<string, User>;
  login: (rfc: string) => Promise<boolean>;
  logout: () => void;
  selectedMember: User | null;
  setSelectedMember: (user: User | null) => void;
  managementTab: ManagementTab;
  setManagementTab: (tab: ManagementTab) => void;
  startDate: Dayjs;
  setStartDate: (date: Dayjs) => void;
  endDate: Dayjs;
  setEndDate: (date: Dayjs) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [selectedMember, setSelectedMemberRaw] = useState<User | null>(null);
  const [managementTab, setManagementTab] = useState<ManagementTab>('Operational');
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(1, 'month').startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf('month'));
  const previousTabRef = useRef<ManagementTab | null>(null);

  // Fetch the scoped roster (requires an active session cookie).
  // Builds the RFC→User map used everywhere in the UI.
  const fetchScopedRoster = async (): Promise<void> => {
    try {
      const r = await fetch('/api/roster', { credentials: 'include' });
      if (!r.ok) return;
      const roster: User[] = await r.json();
      const map: Record<string, User> = {};
      roster.forEach(u => { map[u.rfc] = u; });
      setUsers(map);
    } catch {
      // Non-fatal — UI will work with empty users map for non-management roles
    }
  };

  // On mount: try to restore an existing session via the httpOnly cookie.
  // If the cookie is valid, /api/me returns the user payload without re-login.
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(async (u: User | null) => {
        if (u) {
          setUser(u);
          await fetchScopedRoster();
        }
      })
      .catch(() => {});
  }, []);

  const setSelectedMember = (member: User | null) => {
    if (member !== null) {
      previousTabRef.current = managementTab;
      setManagementTab('Operational');
    } else if (previousTabRef.current !== null) {
      setManagementTab(previousTabRef.current);
      previousTabRef.current = null;
    }
    setSelectedMemberRaw(member);
  };

  const login = async (rfc: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc: rfc.toUpperCase().trim() }),
        credentials: 'include', // receives the httpOnly session cookie
      });
      if (res.ok) {
        const foundUser: User = await res.json();
        setUser(foundUser);
        await fetchScopedRoster();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    // Clear UI state immediately so login screen appears at once
    setUser(null);
    setUsers({});
    setSelectedMemberRaw(null);
    previousTabRef.current = null;
    // Clear server-side session cookie (fire and forget)
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      user, users, login, logout,
      selectedMember, setSelectedMember,
      managementTab, setManagementTab,
      startDate, setStartDate,
      endDate, setEndDate,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
