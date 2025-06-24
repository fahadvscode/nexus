import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Client = Tables<'clients'>;
export type NewClient = TablesInsert<'clients'>;

// Centralized client store using Supabase for persistence with organization-based isolation
class ClientStore {
  // Dispatch custom event to notify components of changes
  notifyClientsUpdated(): void {
    window.dispatchEvent(new CustomEvent('clientsUpdated'));
  }

  // CRITICAL: Validate user role matches email for security
  private async validateUserRole(): Promise<{ isValid: boolean; role: 'admin' | 'subaccount' | null; email: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No user logged in');
      return { isValid: false, role: null, email: null };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      console.error('🚨 No profile found for user');
      return { isValid: false, role: null, email: null };
    }

    const sessionEmail = user.email;
    const profileEmail = profile.email;

    console.log('🔐 Role validation:', { sessionEmail, profileEmail, role: profile.role });

    // STRICT validation - session email must match profile email
    if (sessionEmail !== profileEmail) {
      console.error('🚨 EMAIL MISMATCH in client store - session/profile mismatch!');
      return { isValid: false, role: null, email: sessionEmail };
    }

    // Validate role matches expected email
    if (sessionEmail === 'info@fahadsold.com' && profile.role !== 'admin') {
      console.error('🚨 ROLE MISMATCH: info@fahadsold.com should be admin but is', profile.role);
      return { isValid: false, role: profile.role as 'admin' | 'subaccount', email: sessionEmail };
    }

    if (sessionEmail === 'nav@fahadsold.com' && profile.role !== 'subaccount') {
      console.error('🚨 ROLE MISMATCH: nav@fahadsold.com should be subaccount but is', profile.role);
      return { isValid: false, role: profile.role as 'admin' | 'subaccount', email: sessionEmail };
    }

    console.log('✅ Role validation passed');
    return { isValid: true, role: profile.role as 'admin' | 'subaccount', email: sessionEmail };
  }

  // Get current user's organization ID
  private async getCurrentOrganizationId(): Promise<string | null> {
    const validation = await this.validateUserRole();
    if (!validation.isValid) {
      console.error('🚨 User role validation failed - cannot get organization ID');
      return null;
    }

    // Admin users have special access to all data
    if (validation.role === 'admin') {
      console.log('👑 Admin user confirmed - returning admin access');
      return 'admin';
    }

    // For subaccount users, get their organization ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    const orgId = organization?.id || null;
    console.log('🏢 Subaccount organization ID:', orgId);
    return orgId;
  }

  async getAllClients(): Promise<Client[]> {
    const validation = await this.validateUserRole();
    if (!validation.isValid) {
      console.error('🚨 Role validation failed - cannot fetch clients');
      return [];
    }

    const organizationId = await this.getCurrentOrganizationId();
    console.log('🔍 Organization ID for current user:', organizationId);
    console.log('📧 Validated user email:', validation.email);
    console.log('🎭 Validated user role:', validation.role);
    
    // If admin, return all clients
    if (organizationId === 'admin') {
      console.log('👑 Admin user detected - fetching ALL clients');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all clients (admin):', error);
        return [];
      }
      console.log('📊 Admin fetched clients:', data?.length || 0, 'total clients');
      console.log('📋 Client data preview:', data?.slice(0, 3));
      return data || [];
    }

    // If no organization, return empty array
    if (!organizationId) {
      console.log('⚠️ No organization found for user, cannot fetch clients.');
      return [];
    }

    // For subaccount users, filter by organization
    console.log('🏢 Subaccount user - filtering by organization:', organizationId);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching clients:', error);
      return [];
    }
    console.log('📊 Subaccount fetched clients:', data?.length || 0, 'clients');
    return data || [];
  }

  async addClient(client: NewClient): Promise<Client | null> {
    const validation = await this.validateUserRole();
    if (!validation.isValid) {
      console.error('🚨 Role validation failed - cannot add client');
      return null;
    }

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
    const validation = await this.validateUserRole();
    if (!validation.isValid) {
      console.error('🚨 Role validation failed - cannot update client');
      return null;
    }

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
    const validation = await this.validateUserRole();
    if (!validation.isValid) {
      console.error('🚨 Role validation failed - cannot add multiple clients');
      return [];
    }

    const organizationId = await this.getCurrentOrganizationId();
    
    // Admins should not use this method - they should use direct insertion or admin-specific methods
    if (organizationId === 'admin') {
      console.error('❌ Admin users must specify an organization when adding clients');
      console.error('💡 Admin users should use direct database insertion or admin-specific methods');
      console.error('🔧 This suggests the bulk upload is not using the correct admin path');
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
    const validation = await this.validateUserRole();
    if (!validation.isValid || validation.role !== 'admin') {
      console.error('🚨 Only validated admin users can add clients to specific organizations');
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
    const validation = await this.validateUserRole();
    if (!validation.isValid || validation.role !== 'admin') {
      console.error('🚨 Only validated admin users can fetch clients for specific organizations');
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

  // Admin-specific method for bulk client assignment
  async bulkAssignClients(clientIds: string[], organizationId: string): Promise<boolean> {
    const validation = await this.validateUserRole();
    if (!validation.isValid || validation.role !== 'admin') {
      console.error('🚨 Only validated admin users can bulk assign clients');
      return false;
    }

    try {
      // Determine the target organization_id (null for admin pool, actual UUID for subaccounts)
      const targetOrgId = organizationId === 'admin' ? null : organizationId;
      
      console.log('🔧 Bulk assignment started:', {
        clientCount: clientIds.length,
        targetOrganization: targetOrgId ? `Subaccount (${targetOrgId})` : 'Admin Pool (unassigned)',
        adminEmail: validation.email
      });

      const { error } = await supabase
        .from('clients')
        .update({ organization_id: targetOrgId })
        .in('id', clientIds);

      if (error) {
        console.error('❌ Error bulk assigning clients:', error);
        return false;
      }

      this.notifyClientsUpdated();
      console.log('✅ Bulk assignment completed:', clientIds.length, 'clients assigned to', targetOrgId ? `organization ${targetOrgId}` : 'admin pool');
      return true;
    } catch (error) {
      console.error('❌ Error in bulk assignment:', error);
      return false;
    }
  }

  // Admin-specific method to get unassigned clients
  async getUnassignedClients(): Promise<Client[]> {
    const validation = await this.validateUserRole();
    if (!validation.isValid || validation.role !== 'admin') {
      console.error('🚨 Only validated admin users can fetch unassigned clients');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('organization_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching unassigned clients:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUnassignedClients:', error);
      return [];
    }
  }

  // Admin-specific method for bulk client upload
  async addMultipleClientsAsAdmin(clients: NewClient[], userId: string, organizationId?: string): Promise<Client[]> {
    const validation = await this.validateUserRole();
    if (!validation.isValid || validation.role !== 'admin') {
      console.error('🚨 Only validated admin users can use addMultipleClientsAsAdmin');
      return [];
    }

    console.log('🔧 Admin bulk upload started:', { 
      clientCount: clients.length, 
      organizationId: organizationId || 'admin (unassigned)',
      adminEmail: validation.email
    });

    // Determine the organization_id to use
    const targetOrgId = organizationId === 'admin' || !organizationId ? null : organizationId;
    console.log('🎯 Target organization:', targetOrgId ? `Subaccount (${targetOrgId})` : 'Admin Pool (unassigned)');

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(clients.map(client => ({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address || '',
          status: client.status || 'lead',
          source: client.source || 'Import',
          tags: client.tags || [],
          last_contact: client.last_contact,
          user_id: userId,
          organization_id: targetOrgId, // Use selected organization or null for admin
        })))
        .select();

      if (error) {
        console.error('❌ Error in admin bulk upload:', error);
        return [];
      }
      
      console.log('✅ Admin bulk upload successful:', data?.length, 'clients imported');
      
      // Notify store to refresh client list
      this.notifyClientsUpdated();
      console.log('🔄 Client list refreshed');
      
      return data || [];
    } catch (error) {
      console.error('❌ Exception in admin bulk upload:', error);
      return [];
    }
  }
}

export const clientStore = new ClientStore();

