import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminAccess = {
  userId: string;
  email: string | null;
  isSuperAdmin: boolean;
  isCategoryAdmin: boolean;
};

export async function requireAdminAccess(): Promise<AdminAccess> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isSuperAdmin, error: superAdminError } = await supabase.rpc("is_super_admin", {
    p_user_id: user.id,
  });

  if (superAdminError) {
    throw superAdminError;
  }

  if (isSuperAdmin) {
    return {
      userId: user.id,
      email: user.email ?? null,
      isSuperAdmin: true,
      isCategoryAdmin: false,
    };
  }

  const { data: categoryAccessRows, error: categoryAccessError } = await supabase
    .from("admin_category_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  if (categoryAccessError) {
    throw categoryAccessError;
  }

  const isCategoryAdmin = (categoryAccessRows ?? []).length > 0;

  if (!isCategoryAdmin) {
    redirect("/login?error=unauthorized");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    isSuperAdmin: false,
    isCategoryAdmin: true,
  };
}
