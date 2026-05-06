import { adminService } from "@/modules/admin/admin.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { AutoSubmitSelect, ConfirmButton } from "@/components/admin/AdminClientHelpers";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: Role; page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page || "1");
  const { data: users, meta } = await adminService.getUsers({ 
    search: resolvedSearchParams.search, 
    role: resolvedSearchParams.role,
    page
  });

  async function promoteUser(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as Role;
    await adminService.updateUserRole(userId, role);
    revalidatePath("/admin/users");
  }

  async function toggleRestriction(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const isRestricted = formData.get("isRestricted") === "true";
    await adminService.toggleUserRestriction(userId, isRestricted);
    revalidatePath("/admin/users");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    await adminService.softDeleteUser(userId);
    revalidatePath("/admin/users");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        
        <form className="flex gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            name="search" 
            defaultValue={resolvedSearchParams.search} 
            placeholder="Search users..." 
            className="input py-2 text-sm max-w-xs"
          />
          <select name="role" defaultValue={resolvedSearchParams.role || ""} className="input py-2 text-sm bg-white">
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="btn btn-secondary py-2 text-sm">Filter</button>
        </form>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50">
              <th className="py-3 px-4 font-medium rounded-tl-lg">User</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Joined</th>
              <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-slate-900">{user.name || "Unknown"}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'SELLER' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.isRestricted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {user.isRestricted ? "Restricted" : "Active"}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-right space-x-2">
                  <form action={promoteUser} className="inline-block">
                    <input type="hidden" name="userId" value={user.id} />
                    <AutoSubmitSelect 
                      name="role" 
                      defaultValue={user.role}
                      className="text-xs border border-slate-200 rounded p-1 bg-white cursor-pointer hover:border-blue-300"
                      options={[
                        { label: "Make USER", value: "USER" },
                        { label: "Make SELLER", value: "SELLER" },
                        { label: "Make ADMIN", value: "ADMIN" }
                      ]}
                    />
                  </form>

                  <form action={toggleRestriction} className="inline-block">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="isRestricted" value={(!user.isRestricted).toString()} />
                    <button type="submit" title={user.isRestricted ? "Unrestrict" : "Restrict"} className={`p-1.5 rounded transition-colors ${user.isRestricted ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {user.isRestricted ? "lock_open" : "lock"}
                      </span>
                    </button>
                  </form>

                  <form action={deleteUser} className="inline-block">
                    <input type="hidden" name="userId" value={user.id} />
                    <ConfirmButton 
                      confirmMessage="Are you sure you want to delete this user?"
                      title="Soft Delete" 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <a 
              href={`/admin/users?page=${meta.page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}${resolvedSearchParams.role ? `&role=${resolvedSearchParams.role}` : ''}`}
              className={`btn btn-secondary py-1 px-3 text-sm ${meta.page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Previous
            </a>
            <a 
              href={`/admin/users?page=${meta.page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}${resolvedSearchParams.role ? `&role=${resolvedSearchParams.role}` : ''}`}
              className={`btn btn-secondary py-1 px-3 text-sm ${meta.page >= meta.totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              Next
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
