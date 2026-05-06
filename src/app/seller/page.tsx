import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sellerService } from "@/modules/seller/seller.service";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await sellerService.getProfile(session.user.id);

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-xl mx-auto mt-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to Seller Dashboard!</h2>
        <p className="text-slate-600 mb-6">
          To start selling your products, please setup your seller profile first.
        </p>
        <Link href="/seller/settings" className="btn btn-primary inline-flex items-center gap-2">
          Setup Seller Profile
        </Link>
      </div>
    );
  }

  const stats = await sellerService.getAnalytics(profile.id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">inventory_2</span>
          <h3 className="text-lg font-semibold text-slate-700">Total Products</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalProducts}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">shopping_bag</span>
          <h3 className="text-lg font-semibold text-slate-700">Total Orders</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalOrders}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-purple-500 mb-2">payments</span>
          <h3 className="text-lg font-semibold text-slate-700">Total Earnings</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">${stats.totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Monthly Earnings Trend</h3>
          <div className="flex h-48 items-end gap-3 overflow-x-auto pb-2">
            {stats.monthlyEarnings.length > 0 ? stats.monthlyEarnings.map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-1 min-w-[50px]">
                <div 
                  className="w-full bg-emerald-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" 
                  style={{ height: `${Math.max(10, Math.min(100, (item.earnings / (stats.totalEarnings || 1)) * 300))}%` }}
                ></div>
                <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase">{item.month}</span>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">No data yet</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Low Stock Warnings</h3>
          <div className="space-y-3">
            {stats.lowStock.length > 0 ? stats.lowStock.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                <span className="text-sm font-medium text-red-900 truncate max-w-[200px]">{product.name}</span>
                <span className="text-xs font-bold text-red-700 bg-white px-2 py-1 rounded border border-red-200">{product.stock} units</span>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic py-4 text-center">Your stock is healthy!</p>
            )}
            <Link href="/seller/products" className="block text-center text-xs text-blue-600 font-semibold mt-2 hover:underline">Manage Inventory</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-blue-700">Top Products</h3>
          <div className="space-y-4">
            {stats.topProducts.length > 0 ? stats.topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{i+1}</span>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{product.sales} sold</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">${product.revenue.toFixed(2)} revenue</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic py-4 text-center">No sales yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/seller/products/new" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500">add_circle</span>
                <span className="font-medium text-slate-700 group-hover:text-blue-700">Add New Product</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
            <Link href="/seller/orders" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500">pending_actions</span>
                <span className="font-medium text-slate-700 group-hover:text-emerald-700">Manage Orders</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
            <Link href="/seller/settings" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-500">store</span>
                <span className="font-medium text-slate-700 group-hover:text-purple-700">Shop Settings</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
