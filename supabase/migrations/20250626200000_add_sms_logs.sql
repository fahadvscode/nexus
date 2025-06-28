-- Add SMS logs table for tracking SMS messages
-- Created: June 26, 2025

create table if not exists public.sms_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    to_number text not null,
    message text not null,
    twilio_sid text,
    status text,
    client_name text,
    client_id uuid references public.clients(id) on delete set null,
    is_bulk boolean default false,
    sent_at timestamptz default timezone('utc'::text, now()) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Add RLS policies for SMS logs
alter table public.sms_logs enable row level security;

-- Admin users can see all SMS logs
create policy "Admins can view all SMS logs" on public.sms_logs
    for select
    using (
        exists (
            select 1 from public.user_profiles
            where user_profiles.id = auth.uid()
            and user_profiles.role = 'admin'
        )
    );

-- Regular users can only see their own SMS logs
create policy "Users can view their own SMS logs" on public.sms_logs
    for select
    using (user_id = auth.uid());

-- Admin users can insert SMS logs
create policy "Admins can insert SMS logs" on public.sms_logs
    for insert
    with check (
        exists (
            select 1 from public.user_profiles
            where user_profiles.id = auth.uid()
            and user_profiles.role = 'admin'
        )
    );

-- Regular users can insert their own SMS logs
create policy "Users can insert their own SMS logs" on public.sms_logs
    for insert
    with check (user_id = auth.uid());

-- Add indexes for better performance
create index if not exists idx_sms_logs_user_id on public.sms_logs(user_id);
create index if not exists idx_sms_logs_client_id on public.sms_logs(client_id);
create index if not exists idx_sms_logs_sent_at on public.sms_logs(sent_at);
create index if not exists idx_sms_logs_twilio_sid on public.sms_logs(twilio_sid);

-- Add trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger sms_logs_updated_at
    before update on public.sms_logs
    for each row
    execute function public.handle_updated_at(); 