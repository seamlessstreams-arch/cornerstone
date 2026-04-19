-- Phase 1 storage buckets and policies for Cornerstone

insert into storage.buckets (id, name, public)
values
  ('young-people-documents', 'young-people-documents', false),
  ('body-maps', 'body-maps', false),
  ('health-documents', 'health-documents', false),
  ('education-documents', 'education-documents', false),
  ('recruitment-evidence', 'recruitment-evidence', false),
  ('reports', 'reports', false),
  ('training-certificates', 'training-certificates', false),
  ('temp-generated-files', 'temp-generated-files', false)
on conflict (id) do nothing;

drop policy if exists p_storage_select on storage.objects;
drop policy if exists p_storage_insert on storage.objects;
drop policy if exists p_storage_update on storage.objects;
drop policy if exists p_storage_delete on storage.objects;

create policy p_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id in (
    'young-people-documents',
    'body-maps',
    'health-documents',
    'education-documents',
    'recruitment-evidence',
    'reports',
    'training-certificates',
    'temp-generated-files'
  )
);

create policy p_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id in (
    'young-people-documents',
    'body-maps',
    'health-documents',
    'education-documents',
    'recruitment-evidence',
    'reports',
    'training-certificates',
    'temp-generated-files'
  )
  and owner = auth.uid()
);

create policy p_storage_update
on storage.objects
for update
to authenticated
using (owner = auth.uid() or public.is_platform_admin())
with check (bucket_id in (
  'young-people-documents',
  'body-maps',
  'health-documents',
  'education-documents',
  'recruitment-evidence',
  'reports',
  'training-certificates',
  'temp-generated-files'
));

create policy p_storage_delete
on storage.objects
for delete
to authenticated
using (owner = auth.uid() or public.is_platform_admin());
