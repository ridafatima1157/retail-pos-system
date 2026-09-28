import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function DashboardLayout() {
  const location = useLocation();

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/pos": "Point of Sale",
    "/items": "Items Management",
    "/inventory": "Inventory",
    "/sales": "Sales",
    "/reports": "Reports",
    "/users": "User Management",
    "/audit": "Audit Logs",
  };

  const title = pageTitles[location.pathname] || "RetailPOS";

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ================= SIDEBAR ================= */}
      <Sidebar />

      {/* ================= MAIN AREA ================= */}
      <div className="ml-64 flex min-h-screen flex-col">

        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-40">
          <Header title={title} />
        </div>

        {/* ================= CONTENT ================= */}
        <main className="flex-1 overflow-y-auto">

          <div className="min-h-[calc(100vh-64px)] px-6 py-6 sm:px-8 lg:px-10">

            <div className="mx-auto w-full max-w-[1600px]">

              {/* Page Content Card */}
              <div className="min-h-[calc(100vh-112px)] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:p-8">

                <Outlet />

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;