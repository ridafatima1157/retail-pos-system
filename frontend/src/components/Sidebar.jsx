import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  BarChart3,
  Users,
  ClipboardList,
  LogOut,
  Store,
  ChevronRight,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Items",
      path: "/items",
      icon: Package,
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: Boxes,
    },
    {
      name: "Sales",
      path: "/sales",
      icon: Receipt,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: BarChart3,
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
    },
    {
      name: "Audit Logs",
      path: "/audit",
      icon: ClipboardList,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl">
      {/* Brand */}
      <div className="border-b border-slate-800 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
            <Store size={23} className="text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              RetailPOS
            </h2>

            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Main Menu
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-white/15"
                            : "bg-slate-900 group-hover:bg-slate-800"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <span>{item.name}</span>
                    </div>

                    {isActive && (
                      <ChevronRight
                        size={16}
                        className="text-blue-100"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* System Status */}
  

      {/* Logout */}
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 group-hover:bg-red-500/10">
            <LogOut size={18} />
          </div>

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;