
import dayjs from 'dayjs';

export type Role = "Agent" | "Staff" | "Leader" | "Manager" | "Executive";

export type ServiceDesk = "CAC" | "Fleet" | "Premium" | "Manager" | "Executive";

export interface User {
  rfc: string;
  name: string;
  role: Role;
  client: "Stellantis" | "Pepsico";
  serviceDesk: ServiceDesk;
  team?: string[]; // For Leaders: RFCs of team members
}

export const MOCK_USERS: Record<string, User> = {
  // CAC DEPT
  "GHT920317ABC": { rfc: "GHT920317ABC", name: "Lucia Avellaneda", role: "Agent", client: "Stellantis", serviceDesk: "CAC" },
  "HJK922981BNM": { rfc: "HJK922981BNM", name: "Marco Torres", role: "Agent", client: "Stellantis", serviceDesk: "CAC" },
  "JKL780123MNO": { rfc: "JKL780123MNO", name: "Sarai Torres", role: "Agent", client: "Stellantis", serviceDesk: "CAC" },
  "MNB790139POI": { rfc: "MNB790139POI", name: "Marco Jimenez", role: "Agent", client: "Stellantis", serviceDesk: "CAC" },
  "TUV820327JKL": { rfc: "TUV820327JKL", name: "Laura Gomez", role: "Agent", client: "Stellantis", serviceDesk: "CAC" },
  "GARC780912KQ2": { rfc: "GARC780912KQ2", name: "Luz Salcedo", role: "Agent", client: "Stellantis", serviceDesk: "CAC" },
  "LOPE850623HGT": { rfc: "LOPE850623HGT", name: "Sandra Avellaneda", role: "Agent", client: "Stellantis", serviceDesk: "CAC" },
  "RAMI860812VY4": { 
    rfc: "RAMI860812VY4", 
    name: "Carlos Rodriguez", 
    role: "Leader", 
    client: "Stellantis", 
    serviceDesk: "CAC",
    team: ["GHT920317ABC", "HJK922981BNM", "JKL780123MNO", "MNB790139POI", "TUV820327JKL", "GARC780912KQ2", "LOPE850623HGT"]
  },

  // EXECUTIVE
  "VELA750430LKM": { rfc: "VELA750430LKM", name: "David Rojas", role: "Executive", client: "Stellantis", serviceDesk: "Executive" },

  // FLEET DEPT
  "ASD271209QAZ": { rfc: "ASD271209QAZ", name: "Yoana Jimenez", role: "Agent", client: "Stellantis", serviceDesk: "Fleet" },
  "BNV940327ASD": { rfc: "BNV940327ASD", name: "Bibiana Avellaneda", role: "Agent", client: "Stellantis", serviceDesk: "Fleet" },
  "CVB342987EDC": { rfc: "CVB342987EDC", name: "Jose Jimenez", role: "Agent", client: "Stellantis", serviceDesk: "Fleet" },
  "FGH924398WSX": { rfc: "FGH924398WSX", name: "Sandra Perez", role: "Agent", client: "Stellantis", serviceDesk: "Fleet" },
  "HERN910930WQ7": { rfc: "HERN910930WQ7", name: "Yoana Gomez", role: "Agent", client: "Stellantis", serviceDesk: "Fleet" },
  "MORA920415PL9": { rfc: "MORA920415PL9", name: "Marco Avellaneda", role: "Agent", client: "Stellantis", serviceDesk: "Fleet" },
  "PERE650728JH5": { rfc: "PERE650728JH5", name: "Sarai Avellaneda", role: "Agent", client: "Stellantis", serviceDesk: "Fleet" },
  "RODR830214MNB": { 
    rfc: "RODR830214MNB", 
    name: "Jose Rodriguez", 
    role: "Leader", 
    client: "Stellantis", 
    serviceDesk: "Fleet",
    team: ["ASD271209QAZ", "BNV940327ASD", "CVB342987EDC", "FGH924398WSX", "HERN910930WQ7", "MORA920415PL9", "PERE650728JH5"]
  },

  // MANAGER
  "TORR940621BDF": { rfc: "TORR940621BDF", name: "Roberto Sanchez", role: "Manager", client: "Pepsico", serviceDesk: "Manager" },

  // PREMIUM DEPT
  "PLM830412X9Z": { rfc: "PLM830412X9Z", name: "Bibiana Jimenez", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "QWE620328FGH": { rfc: "QWE620328FGH", name: "Nancy Torres", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "RST710928QWE": { rfc: "RST710928QWE", name: "Daniela Gomez", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "YTR210219LKM": { rfc: "YTR210219LKM", name: "Santiago Lopez", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "ZXC120928RTY": { rfc: "ZXC120928RTY", name: "Felipe Torres", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "CAST890917QWE": { rfc: "CAST890917QWE", name: "Lucio Perez", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "CRUZ700105ZXC": { rfc: "CRUZ700105ZXC", name: "Martin Gomez", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "FLOR960228RT8": { rfc: "FLOR960228RT8", name: "Martina Jimenez", role: "Agent", client: "Stellantis", serviceDesk: "Premium" },
  "SANC990301XTR": { 
    rfc: "SANC990301XTR", 
    name: "Marcela Rodriguez", 
    role: "Leader", 
    client: "Stellantis", 
    serviceDesk: "Premium",
    team: ["PLM830412X9Z", "QWE620328FGH", "RST710928QWE", "YTR210219LKM", "ZXC120928RTY", "CAST890917QWE", "CRUZ700105ZXC", "FLOR960228RT8"]
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
  productivity?: number;
}

export const METRICS_DATA: Record<string, any> = {
  "GHT920317ABC": {
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
    teamBacklog: 35,
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
    homeOffice: { workedHome: 15, workedOffice: 5, availableRemote: 5 },
    adherence: 98,
    productivity: 92
  },
  "ASD271209QAZ": {
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
    homeOffice: { workedHome: 20, workedOffice: 0, availableRemote: 0 },
    adherence: 99,
  },
  "PLM830412X9Z": {
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
    homeOffice: { workedHome: 10, workedOffice: 10, availableRemote: 5 },
    adherence: 94,
  },
  "TORR940621BDF": {
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
  const baseMetrics = METRICS_DATA[rfc] || METRICS_DATA["GHT920317ABC"];
  
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
  
  // For Metrics adjustment
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
