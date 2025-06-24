# Multi-Tenant CRM System

## Overview

The Shield CRM now supports a complete multi-tenant architecture where:
- **Admins** can create and manage multiple subaccounts
- **Subaccounts** have their own isolated data (clients, calls, etc.)
- Each subaccount belongs to an **Organization** with complete data isolation
- Role-based access control ensures proper security

## Architecture

### Database Schema

#### Core Tables
- `user_profiles` - Extended user information with roles
- `organizations` - Subaccount organizations for data isolation
- `clients` - Client data with organization_id for isolation
- `call_logs` - Call logs with organization_id for isolation

#### Key Features
- **Row Level Security (RLS)** - Database-level data isolation
- **Automatic user profile creation** - Trigger creates profile on signup
- **Cascade deletion** - Deleting users removes all associated data
- **Admin oversight** - Admins can view all data across organizations

### User Roles

#### Admin
- Create/manage subaccounts
- View all organizations and users
- Access user management interface
- Cannot directly add clients/calls (must specify organization)
- Full system oversight

#### Subaccount
- Manage their own organization's data
- Add/edit clients and call logs
- Bulk upload functionality
- Data isolated from other subaccounts
- Cannot see other organizations' data

## Getting Started

### Test Credentials

For development/testing, use these credentials:

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: Admin

**Test Subaccount:**
- Email: `user@example.com`
- Password: `admin123`
- Role: Subaccount
- Organization: "Test Organization"

### Admin Workflow

1. **Login as Admin** using admin credentials
2. **Access User Management** via Settings → User Management
3. **Create Subaccounts:**
   - Click "Create Subaccount"
   - Fill in user details (email, password, username)
   - Specify organization name and description
   - Submit to create both user and organization

4. **Manage Subaccounts:**
   - View all subaccounts and their organizations
   - Activate/deactivate users
   - Delete subaccounts (removes all data)
   - Monitor user statistics

### Subaccount Workflow

1. **Login** using subaccount credentials
2. **Manage Clients** - Add, edit, and organize clients
3. **Make Calls** - Log calls and track outcomes
4. **Bulk Upload** - Import client data via CSV
5. **View Reports** - Access call statistics and client analytics

## Data Isolation

### How It Works

Each subaccount's data is completely isolated through:

1. **Organization ID Filtering**: All queries filter by organization_id
2. **Row Level Security**: Database policies enforce isolation
3. **Application Logic**: Stores automatically add organization context
4. **Admin Override**: Admins can access all data when needed

### Security Features

- **Database-level isolation** - Even if application logic fails, RLS protects data
- **Automatic organization assignment** - New data automatically gets correct organization_id
- **User status control** - Admins can deactivate users instantly
- **Audit trail** - Track who created each user and organization

## API Changes

### Client Store Methods

```typescript
// Standard methods (auto-filter by organization)
clientStore.getAllClients()          // Returns only current org's clients
clientStore.addClient(client)        // Adds to current org
clientStore.addMultipleClients(clients) // Bulk add to current org

// Admin-only methods
clientStore.addClientToOrganization(client, orgId)
clientStore.getClientsForOrganization(orgId)
```

### Call Store Methods

```typescript
// Standard methods (auto-filter by organization)
callStore.getAllCalls()              // Returns only current org's calls
callStore.addCall(call)              // Adds to current org
callStore.getCallStats()             // Stats for current org

// Admin-only methods
callStore.addCallToOrganization(call, orgId)
callStore.getCallStatsForOrganization(orgId)
```

## User Management Hook

### useUserManagement()

```typescript
const {
  userProfile,           // Current user's profile
  userOrganization,      // Current user's organization
  allOrganizations,      // All orgs (admin only)
  allProfiles,          // All users (admin only)
  createSubaccount,     // Create new subaccount
  toggleUserStatus,     // Activate/deactivate users
  deleteSubaccount,     // Delete user and all data
  isAdmin,             // Check if current user is admin
  getCurrentOrganizationId // Get current org ID
} = useUserManagement();
```

## Migration Guide

### From Single-Tenant to Multi-Tenant

1. **Database Migration**: Run the migration to add new tables
2. **Existing Data**: Existing clients/calls need organization_id assignment
3. **User Profiles**: Existing users get profiles via trigger
4. **Admin Setup**: Designate initial admin users

### Production Deployment

1. **Create Admin User**: Use Supabase dashboard to create first admin
2. **Update User Profiles**: Set admin role in user_profiles table
3. **Migrate Existing Data**: Assign organization_id to existing records
4. **Test Isolation**: Verify data isolation works correctly

## Security Considerations

### Row Level Security Policies

All tables have RLS policies that:
- Allow users to see only their organization's data
- Allow admins to see all data
- Prevent unauthorized access even with direct database queries

### User Management

- **Admin Creation**: Only existing admins can create new users
- **Password Security**: Use strong passwords for all accounts
- **User Deactivation**: Inactive users cannot access the system
- **Data Deletion**: Deleting users removes all associated data

## Troubleshooting

### Common Issues

1. **No Organization Found**: New subaccounts need an organization created
2. **Data Not Visible**: Check user is active and has correct role
3. **Cannot Add Data**: Ensure user has organization_id
4. **Admin Access**: Verify user has 'admin' role in user_profiles

### Debug Steps

1. Check user profile role: `SELECT * FROM user_profiles WHERE user_id = 'user-id'`
2. Check organization ownership: `SELECT * FROM organizations WHERE owner_id = 'user-id'`
3. Verify RLS policies are enabled on all tables
4. Check data has organization_id assigned

## Development

### Local Testing

1. Start Supabase: `npx supabase start`
2. Reset database: `npx supabase db reset`
3. Test with provided credentials
4. Create additional test users as needed

### Adding New Features

When adding new tables/features:
1. Add organization_id column for isolation
2. Create RLS policies for admin/subaccount access
3. Update stores to filter by organization
4. Test data isolation thoroughly

## Support

For issues or questions about the multi-tenant system:
1. Check this documentation
2. Review RLS policies in the database
3. Test with provided credentials
4. Check console logs for organization ID issues 