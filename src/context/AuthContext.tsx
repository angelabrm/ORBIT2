
import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { User, MOCK_USERS } from '../data/mockData';

import dayjs, { Dayjs } from 'dayjs';

export type ManagementTab = "Operational" | "Administrative" | "Financial";

interface AuthContextType {
  user: User | null;
  login: (rfc: string) => boolean;
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
  const [selectedMember, setSelectedMemberRaw] = useState<User | null>(null);
  const [managementTab, setManagementTab] = useState<ManagementTab>("Operational");
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  const previousTabRef = useRef<ManagementTab | null>(null);

  // Wraps raw setter: switches to Operational when a member is selected,
  // and restores the previous tab when going back.
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

  const login = (rfc: string) => {
    const foundUser = MOCK_USERS[rfc.toUpperCase()];
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setSelectedMember(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
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
