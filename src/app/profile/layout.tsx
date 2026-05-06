import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
      <main className="flex-grow pt-[100px] pb-24 px-4 md:px-8 max-w-[1280px] mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">My Account</h1>
          <p className="text-base text-slate-500 mt-2">
            Manage your profile, orders, and preferences.
          </p>
        </div>

        <ProfileSidebar />
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
