-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  email text unique,
  partner_id uuid references auth.users(id),
  last_celebration_milestone timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  creator_id uuid references auth.users(id) not null default auth.uid(),
  assignee_id uuid references auth.users(id),
  visibility text check (visibility in ('private', 'shared')) default 'private' not null,
  title text not null,
  description text,
  status text check (status in ('active', 'completed', 'past_due')) default 'active' not null,
  priority text check (priority in ('low', 'medium', 'high')) default 'low' not null,
  due_at timestamp with time zone,
  image_url text,
  tags text[] default '{}',
  checklist jsonb default '[]'::jsonb
);

-- RLS for Tasks
alter table tasks enable row level security;

-- Policy: Private tasks are only visible to the creator
create policy "Private tasks are visible to creator only" on tasks
  for all using (
    visibility = 'private' and auth.uid() = creator_id
  );

-- Policy: Shared tasks are visible to creator and their partner
create policy "Shared tasks are visible to creator and partner" on tasks
  for all using (
    visibility = 'shared' and (
      auth.uid() = creator_id or 
      auth.uid() = assignee_id or
      auth.uid() in (select partner_id from profiles where id = creator_id) or
      auth.uid() in (select id from profiles where partner_id = auth.uid())
    )
  );

-- Function to handle new user profiles
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC Function to link partners
create or replace function link_partner_by_email(partner_email text)
returns json as $$
declare
    partner_record record;
    current_user_id uuid;
begin
    current_user_id := auth.uid();
    
    -- 1. Find the partner by email
    select * into partner_record from profiles where email = partner_email;
    
    if partner_record is null then
        return json_build_object('success', false, 'message', 'Partner not found. Make sure they have signed up first!');
    end if;
    
    if partner_record.id = current_user_id then
        return json_build_object('success', false, 'message', 'You cannot link with yourself!');
    end if;
    
    -- 2. Update both profiles (Atomic)
    update profiles set partner_id = partner_record.id where id = current_user_id;
    update profiles set partner_id = current_user_id where id = partner_record.id;
    
    return json_build_object('success', true, 'message', 'Successfully linked with ' || partner_record.full_name);
end;
$$ language plpgsql security definer;

-- RPC Function to unlink partners
create or replace function unlink_partner()
returns json as $$
declare
    current_user_id uuid;
    partner_id_to_remove uuid;
begin
    current_user_id := auth.uid();
    
    -- 1. Get the partner_id before we null it
    select partner_id into partner_id_to_remove from profiles where id = current_user_id;
    
    if partner_id_to_remove is null then
        return json_build_object('success', false, 'message', 'You are not linked to anyone');
    end if;
    
    -- 2. Update both profiles (Atomic)
    update profiles set partner_id = null where id = current_user_id;
    update profiles set partner_id = null where id = partner_id_to_remove;
    
    return json_build_object('success', true, 'message', 'Successfully unlinked');
end;
$$ language plpgsql security definer;
