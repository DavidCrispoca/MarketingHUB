alter table public.brand_logos add column asset_id uuid references public.media_assets(id) on delete set null;
alter table public.brand_logos add constraint brand_logos_asset_brand_fk
  foreign key (asset_id, brand_id) references public.media_assets(id, brand_id) on delete set null (asset_id);
create index brand_logos_asset_id_idx on public.brand_logos(asset_id) where asset_id is not null;
