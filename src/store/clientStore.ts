import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Client = Tables<'clients'>;
export type NewClient = TablesInsert<'clients'>;

// Centralized client store using Supabase for persistence
class ClientStore {
  // Dispatch custom event to notify components of changes
  private notifyClientsUpdated(): void {
    window.dispatchEvent(new CustomEvent('clientsUpdated'));
  }

  async getAllClients(): Promise<Client[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, cannot fetch clients.');
      return [];
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data;
  }

  async addClient(client: NewClient): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) {
      console.error('Error adding client:', error);
      return null;
    }

    this.notifyClientsUpdated();
    console.log('Client added to Supabase:', data);
    return data;
  }

  async updateClient(clientId: string, updates: Partial<Client>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return null;
    }

    this.notifyClientsUpdated();
    console.log('Client updated in Supabase:', data);
    return data;
  }

  async addMultipleClients(clients: NewClient[]): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .insert(clients)
      .select();

    if (error) {
      console.error('Error adding multiple clients:', error);
      return [];
    }

    this.notifyClientsUpdated();
    console.log('Multiple clients added to Supabase:', data);
    return data;
  }
}

export const clientStore = new ClientStore();

