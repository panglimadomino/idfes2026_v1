import { redirect } from "next/navigation";

type AdminEventCategoriesPageProps = {
  searchParams: Promise<{ event_id?: string; saved?: string; deleted?: string; error?: string }>;
};

export default async function AdminEventCategoriesPage({ searchParams }: AdminEventCategoriesPageProps) {
  const params = await searchParams;
  const search = new URLSearchParams();

  if (params.event_id) search.set("manage_event_id", params.event_id);
  if (params.saved) search.set("saved", params.saved);
  if (params.deleted) search.set("deleted", params.deleted);
  if (params.error) search.set("error", params.error);

  const suffix = search.toString();
  redirect(suffix ? `/admin/events/schedule?${suffix}` : "/admin/events/schedule");
}

