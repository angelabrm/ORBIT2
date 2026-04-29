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

export const checkApiHealth = async () => {
  try {
    const response = await fetch('/api/health');
    return await response.json();
  } catch (error) {
    return { status: 'error', error: String(error) };
  }
};
