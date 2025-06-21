
import { useState, useMemo } from 'react';
import { CallLog, CallStats } from '@/types/call';
import { SupabaseCallStore } from '@/store/supabaseCallStore';
import { callStore } from '@/store/callStore'; // Fallback to localStorage
import { supabase } from '@/integrations/supabase/client';

// Hook to handle call operations with automatic fallback
export const useCallStore = () => {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(!!supabase);

  const supabaseCallStore = useMemo(() => {
    if (!supabase) return null;
    return new SupabaseCallStore(supabase);
  }, []);

  const getAllCalls = async (): Promise<CallLog[]> => {
    try {
      if (isSupabaseConnected && supabaseCallStore) {
        return await supabaseCallStore.getAllCalls();
      }
    } catch (error) {
      console.warn('Supabase call failed, falling back to localStorage:', error);
      setIsSupabaseConnected(false);
    }
    return callStore.getAllCalls();
  };

  const getCallsByClient = async (clientId: string): Promise<CallLog[]> => {
    try {
      if (isSupabaseConnected && supabaseCallStore) {
        return await supabaseCallStore.getCallsByClient(clientId);
      }
    } catch (error) {
      console.warn('Supabase call failed, falling back to localStorage:', error);
      setIsSupabaseConnected(false);
    }
    return callStore.getCallsByClient(clientId);
  };

  const addCall = async (call: Omit<CallLog, 'id'>): Promise<CallLog | null> => {
    try {
      if (isSupabaseConnected && supabaseCallStore) {
        const result = await supabaseCallStore.addCall(call);
        if (result) return result;
      }
    } catch (error) {
      console.warn('Supabase call failed, falling back to localStorage:', error);
      setIsSupabaseConnected(false);
    }
    return callStore.addCall(call);
  };

  const updateCall = async (callId: string, updates: Partial<CallLog>): Promise<void> => {
    try {
      if (isSupabaseConnected && supabaseCallStore) {
        await supabaseCallStore.updateCall(callId, updates);
        return;
      }
    } catch (error) {
      console.warn('Supabase call failed, falling back to localStorage:', error);
      setIsSupabaseConnected(false);
    }
    callStore.updateCall(callId, updates);
  };

  const getCallStats = async (): Promise<CallStats> => {
    try {
      if (isSupabaseConnected && supabaseCallStore) {
        return await supabaseCallStore.getCallStats();
      }
    } catch (error) {
      console.warn('Supabase call failed, falling back to localStorage:', error);
      setIsSupabaseConnected(false);
    }
    return callStore.getCallStats();
  };

  const subscribeToUpdates = (callback: () => void) => {
    try {
      if (isSupabaseConnected && supabaseCallStore) {
        return supabaseCallStore.subscribeToCallUpdates(callback);
      }
    } catch (error) {
      console.warn('Supabase subscription failed, falling back to localStorage events:', error);
      setIsSupabaseConnected(false);
    }
    
    // Fallback to storage events for localStorage
    const handleStorageChange = () => callback();
    window.addEventListener('callsUpdated', handleStorageChange);
    return () => window.removeEventListener('callsUpdated', handleStorageChange);
  };

  return {
    getAllCalls,
    getCallsByClient,
    addCall,
    updateCall,
    getCallStats,
    subscribeToUpdates,
    isSupabaseConnected,
  };
};
