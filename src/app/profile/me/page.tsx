import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userService } from "@/modules/users/user.service";
import ProfileInfoForm from "./ProfileInfoForm";

export default async function ProfileInfoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await userService.getUser(session.user.id);

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
        {/* Shipping Info */}
        <div className="md:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Shipping Information</h2>
            <button className="text-blue-600 text-xs font-semibold uppercase tracking-wider hover:underline">Edit</button>
          </div>
          {user.addresses && user.addresses.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">DEFAULT ADDRESS</span>
                <p className="text-sm text-slate-900 font-medium">{user.addresses[0].fullName}</p>
                <p className="text-sm text-slate-500 mt-1">{user.addresses[0].street}, {user.addresses[0].city}, {user.addresses[0].country}</p>
                <p className="text-sm text-slate-500">{user.addresses[0].phone}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No shipping addresses saved yet.</p>
          )}
        </div>

        {/* Payment Method */}
        <div className="md:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Payment Methods</h2>
            <button className="text-blue-600 text-xs font-semibold uppercase tracking-wider hover:underline">Add New</button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600">credit_card</span>
                <div>
                  <p className="text-sm text-slate-900 font-medium">Stripe / Credit Card</p>
                  <p className="text-sm text-slate-500">•••• •••• •••• 4242</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">DEFAULT</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#003087]">account_balance_wallet</span>
                <div>
                  <p className="text-sm text-slate-900 font-medium">PayPal</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
