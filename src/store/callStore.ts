
import { CallLog, CallStats } from '@/types/call';

class CallStore {
  private storageKey = 'nexus-crm-calls';

  getAllCalls(): CallLog[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      const calls = JSON.parse(stored);
      return calls.map((call: any) => ({
        ...call,
        startTime: new Date(call.startTime),
        endTime: call.endTime ? new Date(call.endTime) : undefined,
        followUpDate: call.followUpDate ? new Date(call.followUpDate) : undefined,
      }));
    } catch (error) {
      console.error('Error loading calls:', error);
      return [];
    }
  }

  getCallsByClient(clientId: string): CallLog[] {
    return this.getAllCalls().filter(call => call.clientId === clientId);
  }

  addCall(call: Omit<CallLog, 'id'>): CallLog {
    const calls = this.getAllCalls();
    const newCall: CallLog = {
      ...call,
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    calls.push(newCall);
    this.saveCalls(calls);
    return newCall;
  }

  updateCall(callId: string, updates: Partial<CallLog>): void {
    const calls = this.getAllCalls();
    const index = calls.findIndex(call => call.id === callId);
    if (index !== -1) {
      calls[index] = { ...calls[index], ...updates };
      this.saveCalls(calls);
    }
  }

  getCallStats(): CallStats {
    const calls = this.getAllCalls();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const connectedCalls = calls.filter(call => call.outcome === 'connected');
    const totalDuration = connectedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);

    return {
      totalCalls: calls.length,
      connectedCalls: connectedCalls.length,
      averageDuration: connectedCalls.length > 0 ? totalDuration / connectedCalls.length : 0,
      connectionRate: calls.length > 0 ? (connectedCalls.length / calls.length) * 100 : 0,
      callsToday: calls.filter(call => call.startTime >= today).length,
      callsThisWeek: calls.filter(call => call.startTime >= weekStart).length,
      callsThisMonth: calls.filter(call => call.startTime >= monthStart).length,
    };
  }

  private saveCalls(calls: CallLog[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(calls));
      window.dispatchEvent(new Event('callsUpdated'));
    } catch (error) {
      console.error('Error saving calls:', error);
    }
  }
}

export const callStore = new CallStore();
