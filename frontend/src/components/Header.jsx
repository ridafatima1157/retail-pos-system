import {
  Bell,
  UserCircle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

function Header({ title = "Dashboard" }) {
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Admin",
    role: "Admin",
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 shadow-xl backdrop-blur-md lg:px-7">
      {/* Left */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          RetailPOS
        </p>

        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white">
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          title="Notifications"
        >
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-slate-950" />
        </button>

        {/* User */}
        <div className="hidden h-10 items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
            <UserCircle size={21} className="text-white" />
          </div>

          <div className="min-w-0">
            <p className="max-w-[130px] truncate text-xs font-semibold text-slate-200">
              {user.name}
            </p>

            <div className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-400" />

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {user.role}
              </p>
            </div>
          </div>

          <ChevronDown size={14} className="text-slate-600" />
        </div>
      </div>
    </header>
  );
}

export default Header;