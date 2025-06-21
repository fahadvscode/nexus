import { Tables, TablesInsert } from '@/integrations/supabase/types';

// Re-export the Client type from Supabase
export type Client = Tables<'clients'>;
export type NewClient = TablesInsert<'clients'>;

// Client status options
export const clientStatuses = ['lead', 'potential', 'active', 'inactive'] as const;
export type ClientStatus = typeof clientStatuses[number];

// Client sources - common lead sources for CRM
export const clientSources = [
  'Website',
  'Referral',
  'Social Media',
  'Email Campaign',
  'Cold Call',
  'Trade Show',
  'Advertisement',
  'Partner',
  'Direct Mail',
  'Other'
] as const;

// Client tags - common tags for client categorization
export const clientTags = [
  'High Priority',
  'VIP',
  'New Client',
  'Returning Client',
  'Large Account',
  'Small Business',
  'Enterprise',
  'Needs Follow-up',
  'Hot Lead',
  'Warm Lead',
  'Cold Lead',
  'Decision Maker',
  'Influencer',
  'Budget Approved',
  'Price Sensitive',
  'Quick Decision',
  'Long Sales Cycle',
  'Technical',
  'Non-Technical',
  'Urgent'
] as const;

export type ClientSource = typeof clientSources[number];
export type ClientTag = typeof clientTags[number]; 