
import { SupabaseClient } from '@supabase/supabase-js';
import { CallLog, CallStats } from '@/types/call';

export class SupabaseCallStore {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    if (!supabaseClient) {
      throw new Error('Supabase client must be provided.');
    }
    this.supabase = supabaseClient;
  }

  async getAllCalls(): Promise<CallLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('call_logs')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error loading calls:', error);
        return [];
      }

      return data.map(call => ({
        id: call.id,
        clientId: call.client_id,
        clientName: call.client_name,
        phoneNumber: call.phone_number,
        startTime: new Date(call.start_time),
        endTime: call.end_time ? new Date(call.end_time) : undefined,
        duration: call.duration,
        outcome: call.outcome,
        notes: call.notes,
        followUpRequired: call.follow_up_required,
        followUpDate: call.follow_up_date ? new Date(call.follow_up_date) : undefined,
        createdBy: call.created_by,
        tags: call.tags || [],
      }));
    } catch (error) {
      console.error('Error loading calls:', error);
      throw error;
    }
  }

  async getCallsByClient(clientId: string): Promise<CallLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('call_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error loading client calls:', error);
        return [];
      }

      return data.map(call => ({
        id: call.id,
        clientId: call.client_id,
        clientName: call.client_name,
        phoneNumber: call.phone_number,
        startTime: new Date(call.start_time),
        endTime: call.end_time ? new Date(call.end_time) : undefined,
        duration: call.duration,
        outcome: call.outcome,
        notes: call.notes,
        followUpRequired: call.follow_up_required,
        followUpDate: call.follow_up_date ? new Date(call.follow_up_date) : undefined,
        createdBy: call.created_by,
        tags: call.tags || [],
      }));
    } catch (error) {
      console.error('Error loading client calls:', error);
      throw error;
    }
  }

  async addCall(call: Omit<CallLog, 'id'>): Promise<CallLog | null> {
    try {
      const { data, error } = await this.supabase
        .from('call_logs')
        .insert({
          client_id: call.clientId,
          client_name: call.clientName,
          phone_number: call.phoneNumber,
          start_time: call.startTime.toISOString(),
          end_time: call.endTime?.toISOString(),
          duration: call.duration,
          outcome: call.outcome,
          notes: call.notes,
          follow_up_required: call.followUpRequired,
          follow_up_date: call.followUpDate?.toISOString(),
          created_by: call.createdBy,
          tags: call.tags,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding call:', error);
        throw error;
      }

      return {
        id: data.id,
        clientId: data.client_id,
        clientName: data.client_name,
        phoneNumber: data.phone_number,
        startTime: new Date(data.start_time),
        endTime: data.end_time ? new Date(data.end_time) : undefined,
        duration: data.duration,
        outcome: data.outcome as CallLog['outcome'],
        notes: data.notes,
        followUpRequired: data.follow_up_required,
        followUpDate: data.follow_up_date ? new Date(data.follow_up_date) : undefined,
        createdBy: data.created_by,
        tags: data.tags || [],
      };
    } catch (error) {
      console.error('Error adding call:', error);
      throw error;
    }
  }

  async updateCall(callId: string, updates: Partial<CallLog>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.clientId) updateData.client_id = updates.clientId;
      if (updates.clientName) updateData.client_name = updates.clientName;
      if (updates.phoneNumber) updateData.phone_number = updates.phoneNumber;
      if (updates.startTime) updateData.start_time = updates.startTime.toISOString();
      if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.outcome) updateData.outcome = updates.outcome;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.followUpRequired !== undefined) updateData.follow_up_required = updates.followUpRequired;
      if (updates.followUpDate) updateData.follow_up_date = updates.followUpDate.toISOString();
      if (updates.createdBy) updateData.created_by = updates.createdBy;
      if (updates.tags) updateData.tags = updates.tags;

      const { error } = await this.supabase
        .from('call_logs')
        .update(updateData)
        .eq('id', callId);

      if (error) {
        console.error('Error updating call:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating call:', error);
      throw error;
    }
  }

  async getCallStats(): Promise<CallStats> {
    try {
      const calls = await this.getAllCalls();
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
    } catch (error) {
      console.error('Error getting call stats:', error);
      throw error;
    }
  }

  // Real-time subscription for call updates
  subscribeToCallUpdates(callback: () => void) {
    const subscription = this.supabase
      .channel('call_logs_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'call_logs' 
        }, 
        callback
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }
}
