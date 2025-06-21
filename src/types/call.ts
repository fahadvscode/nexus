
export interface CallLog {
  id: string;
  clientId: string;
  clientName: string;
  phoneNumber: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  outcome: 'connected' | 'voicemail' | 'no-answer' | 'busy' | 'declined' | 'failed' | 'initiated';
  notes: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  createdBy: string;
  tags?: string[];
  twilioCallSid?: string;
}

export interface CallStats {
  totalCalls: number;
  connectedCalls: number;
  averageDuration: number;
  connectionRate: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
}
