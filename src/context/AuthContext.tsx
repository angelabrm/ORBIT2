
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { User } from '../data/mockData';

import dayjs, { Dayjs } from 'dayjs';

export type ManagementTab = "Operational" | "Administrative" | "Financial";

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
  const [managementTab, setManagementTab] = useState<ManagementTab>("Operational");
  // Default range: start of previous month → end of current month. Keeps the
  // window short and aligned to calendar months, so monthly buckets in the
  // line chart show two complete data points (last month + current month).
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(1, 'month').startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf('month'));
  const previousTabRef = useRef<ManagementTab | null>(null);

  useEffect(() => {
    fetch('/api/roster')
      .then(r => r.json())
      .then((roster: User[]) => {
        const map: Record<string, User> = {};
        roster.forEach(u => { map[u.rfc] = u; });
        setUsers(map);
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
      });
      if (res.ok) {
        const foundUser: User = await res.json();
        setUser(foundUser);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedMember(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      login,
      logout,
      selectedMember,
      setSelectedMember,
      managementTab,
      setManagementTab,
      startDate,
      setStartDate,
      endDate,
      setEndDate
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
