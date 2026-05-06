import { adminService } from "@/modules/admin/admin.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const stats = await adminService.getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-blue-500 mb-2">group</span>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Users</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">storefront</span>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Vendors</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalVendors}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-purple-500 mb-2">inventory_2</span>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Products</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalProducts}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">receipt_long</span>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Orders</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">payments</span>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Revenue Trend</h3>
          <div className="flex h-48 items-end gap-2 overflow-x-auto pb-2">
            {stats.orders.slice().reverse().map((order, i) => (
              <div key={i} className="flex flex-col items-center flex-1 min-w-[30px]">
                <div 
                  className="w-full bg-blue-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" 
                  style={{ height: `${Math.max(10, Math.min(100, (order.totalAmount / (stats.totalRevenue || 1)) * 500))}%` }}
                ></div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center mt-4">Last 50 orders revenue distribution</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Low Stock Alerts</h3>
          <div className="space-y-3">
            {stats.lowStockAlerts.length > 0 ? stats.lowStockAlerts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-100">
                <span className="text-sm font-medium text-red-900 truncate max-w-[200px]">{product.name}</span>
                <span className="text-xs font-bold text-red-700 bg-white px-2 py-1 rounded border border-red-200">{product.stock} left</span>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No low stock alerts.</p>
            )}
            <a href="/admin/products" className="block text-center text-xs text-blue-600 font-semibold mt-2 hover:underline">View All Products</a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-emerald-700">Top Sellers</h3>
          <div className="space-y-4">
            {stats.topSellers.map((seller, i) => (
              <div key={seller.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{i+1}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{seller.shopName}</p>
                    <p className="text-xs text-slate-500">{seller.owner}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">${seller.revenue.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">{seller.productCount} products</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-purple-700">Top Selling Products</h3>
          <div className="space-y-4">
            {stats.topSellingProducts.map((product, i) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{i+1}</span>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{product._count.orderItems} sold</p>
                  <p className={`text-[10px] font-bold uppercase ${product.stock <= 5 ? 'text-red-500' : 'text-slate-500'}`}>Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
