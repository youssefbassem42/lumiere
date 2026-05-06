import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userService } from "@/modules/users/user.service";
import { redirect } from "next/navigation";
import ProfileInfoForm from "./ProfileInfoForm";
import AddressSection from "./AddressSection";
import PaymentMethodSection from "./PaymentMethodSection";

export default async function ProfileInfoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await userService.getUser(session.user.id);
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editable Profile Info Form */}
        <div className="md:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Personal Details</h2>
          </div>
          <ProfileInfoForm user={user} />
        </div>

        {/* Password Change Form */}
        <div className="md:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Security</h2>
          </div>
          {user.password ? (
            <ProfileInfoForm user={user} mode="password" />
          ) : (
            <p className="text-sm text-slate-500">You are logged in with a social account. Password changes are disabled.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AddressSection initialAddresses={user.addresses as any || []} />
        <PaymentMethodSection />
      </div>
    </div>
  );
}
