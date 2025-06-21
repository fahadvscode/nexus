import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Client = Tables<'clients'>;
export type NewClient = TablesInsert<'clients'>;

// Centralized client store using Supabase for persistence with organization-based isolation
class ClientStore {
  // Dispatch custom event to notify components of changes
  private notifyClientsUpdated(): void {
    window.dispatchEvent(new CustomEvent('clientsUpdated'));
  }

  // Get current user's organization ID
  private async getCurrentOrganizationId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // First check if user is admin - admins can see all data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role === 'admin') {
      return 'admin'; // Special case for admin access
    }

    // For subaccount users, get their organization ID
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    return organization?.id || null;
  }

  async getAllClients(): Promise<Client[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, cannot fetch clients.');
      return [];
    }

    const organizationId = await this.getCurrentOrganizationId();
    
    // If admin, return all clients
    if (organizationId === 'admin') {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all clients (admin):', error);
        return [];
      }
      return data;
    }

    // If no organization, return empty array
    if (!organizationId) {
      console.log('No organization found for user, cannot fetch clients.');
      return [];
    }

    // For subaccount users, filter by organization
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data;
  }

  async addClient(client: NewClient): Promise<Client | null> {
    const organizationId = await this.getCurrentOrganizationId();
    
    // Admins cannot directly add clients - they need to specify an organization
    if (organizationId === 'admin') {
      console.error('Admin users must specify an organization when adding clients');
      return null;
    }

    if (!organizationId) {
      console.error('No organization found, cannot add client');
      return null;
    }

    // Add organization_id to the client data
    const clientWithOrg = {
      ...client,
      organization_id: organizationId,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(clientWithOrg)
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
    const organizationId = await this.getCurrentOrganizationId();
    
    // Admins cannot directly add clients - they need to specify an organization
    if (organizationId === 'admin') {
      console.error('Admin users must specify an organization when adding clients');
      return [];
    }

    if (!organizationId) {
      console.error('No organization found, cannot add clients');
      return [];
    }

    // Add organization_id to all client data
    const clientsWithOrg = clients.map(client => ({
      ...client,
      organization_id: organizationId,
    }));

    const { data, error } = await supabase
      .from('clients')
      .insert(clientsWithOrg)
      .select();

    if (error) {
      console.error('Error adding multiple clients:', error);
      return [];
    }

    this.notifyClientsUpdated();
    console.log('Multiple clients added to Supabase:', data);
    return data;
  }

  // Admin-specific method to add clients to a specific organization
  async addClientToOrganization(client: NewClient, organizationId: string): Promise<Client | null> {
    const currentOrgId = await this.getCurrentOrganizationId();
    
    // Only admins can use this method
    if (currentOrgId !== 'admin') {
      console.error('Only admin users can add clients to specific organizations');
      return null;
    }

    const clientWithOrg = {
      ...client,
      organization_id: organizationId,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(clientWithOrg)
      .select()
      .single();

    if (error) {
      console.error('Error adding client to organization:', error);
      return null;
    }

    this.notifyClientsUpdated();
    console.log('Client added to organization:', data);
    return data;
  }

  // Admin-specific method to get clients for a specific organization
  async getClientsForOrganization(organizationId: string): Promise<Client[]> {
    const currentOrgId = await this.getCurrentOrganizationId();
    
    // Only admins can use this method
    if (currentOrgId !== 'admin') {
      console.error('Only admin users can fetch clients for specific organizations');
      return [];
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients for organization:', error);
      return [];
    }
    return data;
  }
}

export const clientStore = new ClientStore();

