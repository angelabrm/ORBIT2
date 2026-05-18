import dayjs from 'dayjs';

export interface OpenedCase {
  case_owner: string;
  datetime_opened: string;
  [key: string]: any;
}

export const fetchOpenedCases = async (caseOwner?: string, startDate?: any, endDate?: any): Promise<OpenedCase[]> => {
  try {
    const params = new URLSearchParams();
    if (caseOwner) params.append('case_owner', caseOwner);
    if (startDate) params.append('startDate', dayjs(startDate).toISOString());
    if (endDate) params.append('endDate', dayjs(endDate).toISOString());

    const response = await fetch(`/api/opened-cases?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch from API');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching opened cases:', error);
    return [];
  }
};

export interface IncomingCallRow {
  user: string;
  source: string;        // original "Actividad_2026_03_15.csv"
  dateStr: string;       // parsed "YYYY-MM-DD" — use this for bucketing (TZ-safe)
  dateMs: number;        // UTC ms — kept for legacy callers, but `dayjs(dateMs)` will shift by TZ
  answeredCalls: number;
}

export const fetchIncomingCalls = async (
  callPickers?: string[],
  startDate?: any,
  endDate?: any,
  genesysIds?: string[],
): Promise<IncomingCallRow[]> => {
  try {
    const params = new URLSearchParams();
    if (callPickers && callPickers.length > 0) params.append('user', callPickers.join(','));
    if (genesysIds && genesysIds.length > 0)   params.append('genesys', genesysIds.join(','));
    if (startDate) params.append('startDate', dayjs(startDate).toISOString());
    if (endDate)   params.append('endDate',   dayjs(endDate).toISOString());

    const response = await fetch(`/api/incoming-calls?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch from API');
    return await response.json();
  } catch (error) {
    console.error('Error fetching incoming calls:', error);
    return [];
  }
};

export interface QARow {
  agente: string;
  dateStr: string;   // "YYYY-MM-DD" (TZ-safe bucketing key)
  dateMs: number;    // UTC ms for legacy callers
  score: number;     // 0-100 per-evaluation score (see QA scoring spec in api/index.ts)
}

export const fetchQA = async (agentes?: string[], startDate?: any, endDate?: any): Promise<QARow[]> => {
  try {
    const params = new URLSearchParams();
    if (agentes && agentes.length > 0) params.append('user', agentes.join(','));
    if (startDate) params.append('startDate', dayjs(startDate).toISOString());
    if (endDate)   params.append('endDate',   dayjs(endDate).toISOString());

    const response = await fetch(`/api/qa?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch from API');
    return await response.json();
  } catch (error) {
    console.error('Error fetching QA:', error);
    return [];
  }
};

export interface NSATRow {
  caseOwner: string;
  dateStr: string;
  dateMs: number;
  q1: number | null;   // agent_satisfaction_score
  q2: number | null;   // effort_score
  q3: number | null;   // overall_satisfaction_score
}

export const fetchNSAT = async (compassIds?: string[], startDate?: any, endDate?: any): Promise<NSATRow[]> => {
  try {
    const params = new URLSearchParams();
    if (compassIds && compassIds.length > 0) params.append('user', compassIds.join(','));
    if (startDate) params.append('startDate', dayjs(startDate).toISOString());
    if (endDate)   params.append('endDate',   dayjs(endDate).toISOString());

    const response = await fetch(`/api/nsat?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch from API');
    return await response.json();
  } catch (error) {
    console.error('Error fetching NSAT:', error);
    return [];
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await fetch('/api/health');
    return await response.json();
  } catch (error) {
    return { status: 'error', error: String(error) };
  }
};
