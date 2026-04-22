
import dayjs from 'dayjs';

export type Role = "Agent" | "Staff" | "Leader" | "Manager" | "Executive" | "Project Manager";

export type ServiceDesk = "CAC" | "Fleet" | "Premium" | "Warranty" | "PDC" | "PMO";

export interface User {
  rfc: string;
  name: string;
  role: Role;
  client: "Stellantis" | "Pepsico";
  serviceDesk: ServiceDesk;
  team?: string[]; // For Leaders: RFCs of team members
}

export const MOCK_USERS: Record<string, User> = {
  "AGENT01": {
    rfc: "AGENT01",
    name: "Juan Perez",
    role: "Agent",
    client: "Stellantis",
    serviceDesk: "CAC"
  },
  "WARRANTY01": {
    rfc: "WARRANTY01",
    name: "Maria Garcia",
    role: "Agent",
    client: "Stellantis",
    serviceDesk: "Warranty"
  },
  "LEADER01": {
    rfc: "LEADER01",
    name: "Carlos Rodriguez",
    role: "Leader",
    client: "Stellantis",
    serviceDesk: "CAC",
    team: ["AGENT01", "AGENT02", "AGENT03"]
  },
  "AGENT02": {
    rfc: "AGENT02",
    name: "Ana Martinez",
    role: "Agent",
    client: "Stellantis",
    serviceDesk: "CAC"
  },
  "AGENT03": {
    rfc: "AGENT03",
    name: "Luis Lopez",
    role: "Agent",
    client: "Stellantis",
    serviceDesk: "CAC"
  },
  "PM01": {
    rfc: "PM01",
    name: "Roberto Sanchez",
    role: "Project Manager",
    client: "Pepsico",
    serviceDesk: "PMO"
  },
  "EXEC01": {
    rfc: "EXEC01",
    name: "General Director",
    role: "Executive",
    client: "Stellantis",
    serviceDesk: "PDC"
  }
};

export interface UserMetrics {
  qa: number;
  openedCases: number;
  closedCases: number;
  nsatInfo: number;
  nsatClaims: number;
  slaCompliance: number;
  callsPerHour: number;
  closedCasesPerHour: number;
  fcr: number;
  closedCasesRate: number;
  teamBacklog: number;
  empathyPenalty: number;
  surveyPenalty: number;
  followUp: number;
  callsTime: number;
  incomingCalls: number;
  outgoingCalls: number;
  tenure: string;
  vacationDays: number;
  absences: number;
  tardiness: number;
  homeOffice: {
    workedHome: number;
    workedOffice: number;
    availableRemote: number;
  };
  adherence: number;
}

export const METRICS_DATA: Record<string, any> = {
  "AGENT01": {
    qa: 95.5,
    openedCases: 120,
    closedCases: 110,
    nsatInfo: 92, 
    nsatClaims: 88,
    slaCompliance: 94,
    callsPerHour: 5.5,
    closedCasesPerHour: 0.85,
    fcr: 78,
    closedCasesRate: 91.6,
    teamBacklog: 35, // 0-45% as requested
    empathyPenalty: 0,
    surveyPenalty: 5,
    followUp: 45,
    callsTime: 120,
    incomingCalls: 150,
    outgoingCalls: 80,
    tenure: "2 years",
    vacationDays: 12,
    absences: 1,
    tardiness: 2,
    homeOffice: {
      workedHome: 15,
      workedOffice: 5,
      availableRemote: 5
    },
    adherence: 98,
    productivity: 92
  },
  "AGENT02": {
    qa: 88,
    openedCases: 140,
    closedCases: 135,
    nsatInfo: 85,
    nsatClaims: 90,
    slaCompliance: 96,
    callsPerHour: 6.2,
    closedCasesPerHour: 1.1,
    fcr: 82,
    closedCasesRate: 96.4,
    teamBacklog: 42,
    empathyPenalty: 5,
    surveyPenalty: 0,
    incomingCalls: 180,
    outgoingCalls: 95,
    tenure: "3 years",
    vacationDays: 15,
    absences: 0,
    tardiness: 0,
    homeOffice: {
      workedHome: 20,
      workedOffice: 0,
      availableRemote: 0
    },
    adherence: 99,
  },
  "AGENT03": {
    qa: 92,
    openedCases: 100,
    closedCases: 95,
    nsatInfo: 78,
    nsatClaims: 82,
    slaCompliance: 90,
    callsPerHour: 4.8,
    closedCasesPerHour: 0.75,
    fcr: 70,
    closedCasesRate: 95,
    teamBacklog: 30,
    empathyPenalty: 0,
    surveyPenalty: 0,
    incomingCalls: 130,
    outgoingCalls: 70,
    tenure: "1 year",
    vacationDays: 10,
    absences: 2,
    tardiness: 1,
    homeOffice: {
      workedHome: 10,
      workedOffice: 10,
      availableRemote: 5
    },
    adherence: 94,
  },
  "WARRANTY01": {
    actionsTaken: 450,
    tenure: "1 year",
    vacationDays: 8,
    absences: 0,
    tardiness: 1,
    homeOffice: {
      workedHome: 10,
      workedOffice: 10,
      availableRemote: 2
    },
    adherence: 95,
    productivity: 88
  },
  "PM01": {
    assignedCampaigns: 10,
    activeCampaigns: 4,
    qa: 92,
    closedCampaigns: 6
  }
};

/**
 * Simulates metric changes based on a date range.
 * This ensures that changing the dates in the UI actually results in different numbers.
 */
export const getFilteredMetrics = (rfc: string, startDate: any, endDate: any) => {
  const baseMetrics = METRICS_DATA[rfc] || METRICS_DATA["AGENT01"];
  
  // Create a seed based on the RFC and the dates
  const dateSeed = startDate.unix() + endDate.unix();
  const rfcSeed = rfc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = dateSeed + rfcSeed;
  
  // Simple pseudo-random generator
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  // Clone and fluctuate numbers
  const fluctuated: any = JSON.parse(JSON.stringify(baseMetrics));
  
  const fluctuate = (val: number, multiplier: number = 0.1, isPercentage: boolean = false) => {
    if (typeof val !== 'number') return val;
    const variation = (random(seed + val) - 0.5) * 2 * multiplier;
    let newValue = val + (val * variation);
    if (isPercentage) {
      newValue = Math.min(100, Math.max(0, newValue));
    }
    return newValue;
  };

  // Apply to common fields
  if (fluctuated.qa) fluctuated.qa = fluctuate(fluctuated.qa, 0.05, true);
  if (fluctuated.openedCases) fluctuated.openedCases = Math.floor(fluctuate(fluctuated.openedCases, 0.2));
  if (fluctuated.closedCases) fluctuated.closedCases = Math.floor(fluctuate(fluctuated.closedCases, 0.2));
  if (fluctuated.productivity) fluctuated.productivity = fluctuate(fluctuated.productivity, 0.05, true);
  if (fluctuated.adherence) fluctuated.adherence = fluctuate(fluctuated.adherence, 0.02, true);
  if (fluctuated.nsatInfo) fluctuated.nsatInfo = fluctuate(fluctuated.nsatInfo, 0.1, true);
  
  // For PMO
  if (fluctuated.assignedCampaigns) fluctuated.assignedCampaigns = Math.floor(fluctuate(fluctuated.assignedCampaigns, 0.1));
  if (fluctuated.activeCampaigns) fluctuated.activeCampaigns = Math.floor(fluctuate(fluctuated.activeCampaigns, 0.1));
  
  return fluctuated;
};

/**
 * Generates synthetic daily historical data from Jan 1, 2024 to present.
 */
export const generateHistoricalData = (rfc: string) => {
  const data = [];
  const start = dayjs('2024-01-01');
  const end = dayjs();
  const diffDays = end.diff(start, 'day');
  
  // Seed based on RFC
  const rfcSeed = rfc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const indicators = [
    'Performance', 'Productivity', 'Ranking', 'Bonus', 
    'Opened Cases', 'Closed Cases', 'Closed Cases Rate', 
    'NSAT Information', 'NSAT Claims', 'Incoming Calls', 
    'Outgoing Calls', '% First Contact Resolution', 'Backlog Team'
  ];

  for (let i = 0; i <= diffDays; i++) {
    const currentDate = start.add(i, 'day');
    const daySeed = rfcSeed + i;
    const entry: any = { date: currentDate.format('YYYY-MM-DD') };
    
    indicators.forEach((indicator, idx) => {
      // Base values and trends
      let base = 70 + (random(rfcSeed + idx) * 20);
      // Add a slight upward trend over time
      base += (i / diffDays) * 10;
      // Daily noise
      const noise = (random(daySeed + idx) - 0.5) * 10;
      entry[indicator] = Number(Math.max(0, Math.min(100, base + noise)).toFixed(1));
    });
    
    data.push(entry);
  }
  return data;
};
