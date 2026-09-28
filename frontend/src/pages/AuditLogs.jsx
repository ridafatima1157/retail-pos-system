import { useEffect, useState } from "react";
import {
  Search,
  ShieldCheck,
  Package,
  Ban,
  UserPlus,
  Edit,
  Clock,
  Filter,
  RefreshCw,
  Receipt,
  LogIn,
  UserCog,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);

  const [summary, setSummary] = useState({
    total_activities: 0,
    stock_activities: 0,
    voided_transactions: 0,
  });

  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("All Activities");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAuditLogs = async () => {
    try {
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (activity !== "All Activities") {
        params.action = activity;
      }

      const response = await api.get("/audit-logs/", {
        params,
      });

      setLogs(response.data.logs || []);
    } catch (err) {
      console.error("Audit logs error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load audit logs."
      );
    }
  };

  const loadSummary = async () => {
    try {
      const response = await api.get(
        "/audit-logs/summary"
      );

      setSummary(response.data);
    } catch (err) {
      console.error("Audit summary error:", err);
    }
  };

  const loadData = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadAuditLogs(),
        loadSummary(),
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = () => {
    loadAuditLogs();
  };

  const handleRefresh = () => {
    loadData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getLogConfig = (action) => {
    if (action === "Sale Completed") {
      return {
        icon: ShieldCheck,
        bg: "bg-emerald-50",
        color: "text-emerald-600",
      };
    }

    if (action === "Sale Voided") {
      return {
        icon: Ban,
        bg: "bg-red-50",
        color: "text-red-600",
      };
    }

    if (action === "Stock Adjustment") {
      return {
        icon: Package,
        bg: "bg-blue-50",
        color: "text-blue-600",
      };
    }

    if (action === "User Created") {
      return {
        icon: UserPlus,
        bg: "bg-purple-50",
        color: "text-purple-600",
      };
    }

    if (
      action === "User Updated" ||
      action === "Item Updated"
    ) {
      return {
        icon: Edit,
        bg: "bg-orange-50",
        color: "text-orange-600",
      };
    }

    if (action === "User Deleted") {
      return {
        icon: Trash2,
        bg: "bg-red-50",
        color: "text-red-600",
      };
    }

    if (action === "Item Created") {
      return {
        icon: Plus,
        bg: "bg-emerald-50",
        color: "text-emerald-600",
      };
    }

    if (action === "User Login") {
      return {
        icon: LogIn,
        bg: "bg-cyan-50",
        color: "text-cyan-600",
      };
    }

    return {
      icon: Receipt,
      bg: "bg-slate-100",
      color: "text-slate-600",
    };
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Audit Logs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track important system activities and user actions.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>


      {/* Security Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

        {/* Total */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-100 p-2.5">
              <ShieldCheck
                size={20}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Total Activities
              </p>

              <p className="text-xl font-bold text-slate-800">
                {summary.total_activities}
              </p>
            </div>

          </div>
        </div>


        {/* Stock */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-orange-100 p-2.5">
              <Package
                size={20}
                className="text-orange-600"
              />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Stock Activities
              </p>

              <p className="text-xl font-bold text-slate-800">
                {summary.stock_activities}
              </p>
            </div>

          </div>
        </div>


        {/* Voids */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-red-100 p-2.5">
              <Ban
                size={20}
                className="text-red-600"
              />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Voided Transactions
              </p>

              <p className="text-xl font-bold text-slate-800">
                {summary.voided_transactions}
              </p>
            </div>

          </div>
        </div>

      </div>


      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto]">

          {/* Search */}
          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFilter();
                }
              }}
              placeholder="Search audit logs..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>


          {/* Activity */}
          <select
            value={activity}
            onChange={(e) =>
              setActivity(e.target.value)
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Activities</option>
            <option>Sale Completed</option>
            <option>Sale Voided</option>
            <option>Stock Adjustment</option>
            <option>User Created</option>
            <option>User Updated</option>
            <option>User Deleted</option>
            <option>Item Created</option>
            <option>Item Updated</option>
            <option>Item Deleted</option>
            <option>User Login</option>
          </select>


          {/* Filter */}
          <button
            onClick={handleFilter}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Filter size={17} />
            Apply Filters
          </button>

        </div>
      </div>


      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <AlertCircle size={18} />

          <span>{error}</span>

        </div>
      )}


      {/* Logs */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 p-5">

          <div>
            <h2 className="font-semibold text-slate-800">
              Activity History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent administrative and transactional activities.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:flex">
            <Clock size={14} />
            Live Records
          </div>

        </div>


        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">

            <RefreshCw
              size={28}
              className="animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading audit logs...
            </p>

          </div>
        )}


        {/* Empty */}
        {!loading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">

            <div className="rounded-full bg-slate-100 p-4">
              <ShieldCheck
                size={28}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-700">
              No audit logs found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filter.
            </p>

          </div>
        )}


        {/* Records */}
        {!loading && logs.length > 0 && (
          <div className="divide-y divide-slate-100">

            {logs.map((log) => {

              const config =
                getLogConfig(log.action);

              const Icon = config.icon;

              return (
                <div
                  key={log.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                >

                  {/* Icon */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
                  >
                    <Icon
                      size={20}
                      className={config.color}
                    />
                  </div>


                  {/* Content */}
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="text-sm font-semibold text-slate-800">
                        {log.action}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          log.user_role === "Admin"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {log.user_role}
                      </span>

                    </div>


                    {/* Description */}
                    <p className="mt-1 text-sm text-slate-500">

                      {log.invoice_number
                        ? `Transaction ${log.invoice_number}`
                        : log.reason ||
                          "System activity recorded."}

                    </p>


                    {/* Metadata */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">

                      <span>
                        By {log.user_name}
                      </span>

                      <span>•</span>

                      <Clock size={13} />

                      <span>
                        {formatDate(
                          log.created_at
                        )}
                      </span>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}

export default AuditLogs;