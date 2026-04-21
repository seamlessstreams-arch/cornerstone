-- Phase 1 storage buckets and access policies

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('reports', 'reports', false),
  ('recruitment', 'recruitment', false),
  ('training', 'training', false),
  ('branding', 'branding', true)
on conflict (id) do nothing;

create policy if not exists "service role full access documents"
on storage.objects
for all to service_role
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

create policy if not exists "authenticated read documents"
on storage.objects
for select to authenticated
using (bucket_id = 'documents');

create policy if not exists "authenticated write documents"
on storage.objects
for insert to authenticated
with check (bucket_id = 'documents');

create policy if not exists "service role full access reports"
on storage.objects
for all to service_role
using (bucket_id = 'reports')
with check (bucket_id = 'reports');

create policy if not exists "authenticated read reports"
on storage.objects
for select to authenticated
using (bucket_id = 'reports');

create policy if not exists "authenticated write reports"
on storage.objects
for insert to authenticated
with check (bucket_id = 'reports');

create policy if not exists "service role full access recruitment"
on storage.objects
for all to service_role
using (bucket_id = 'recruitment')
with check (bucket_id = 'recruitment');

create policy if not exists "authenticated read recruitment"
on storage.objects
for select to authenticated
using (bucket_id = 'recruitment');

create policy if not exists "authenticated write recruitment"
on storage.objects
for insert to authenticated
with check (bucket_id = 'recruitment');

create policy if not exists "service role full access training"
on storage.objects
for all to service_role
using (bucket_id = 'training')
with check (bucket_id = 'training');

create policy if not exists "authenticated read training"
on storage.objects
for select to authenticated
using (bucket_id = 'training');

create policy if not exists "authenticated write training"
on storage.objects
for insert to authenticated
with check (bucket_id = 'training');

create policy if not exists "public read branding"
on storage.objects
for select to public
using (bucket_id = 'branding');

create policy if not exists "service role write branding"
on storage.objects
for all to service_role
using (bucket_id = 'branding')
with check (bucket_id = 'branding');
