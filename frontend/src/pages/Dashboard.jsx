import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Banknote,
  CreditCard,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  MoreHorizontal,
  Package,
  Clock,
  TrendingUp,
  RefreshCw,
  Layers3,
  ChevronRight,
  Activity,
} from "lucide-react";

import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =====================================================
  // GET SALE DATE
  // =====================================================

  const getSaleDate = (saleOrDate) => {
    if (!saleOrDate) {
      return null;
    }

    // If a Date object is passed
    if (saleOrDate instanceof Date) {
      return Number.isNaN(saleOrDate.getTime())
        ? null
        : saleOrDate;
    }

    // If a date string is passed directly
    if (typeof saleOrDate === "string") {
      const date = new Date(saleOrDate);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }

      return null;
    }

    // If backend provides created_at
    if (saleOrDate.created_at) {
      const value = String(saleOrDate.created_at);

      let date;

      if (value.includes("T")) {
        date = new Date(value);
      } else {
        date = new Date(
          `${value.replace(" ", "T")}+05:00`
        );
      }

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    // Current /sales endpoint provides date + time
    if (saleOrDate.date && saleOrDate.time) {
      const value = `${saleOrDate.date} ${saleOrDate.time}`;

      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    // Fallback if only date exists
    if (saleOrDate.date) {
      const date = new Date(saleOrDate.date);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  };

  // =====================================================
  // SALE DATE KEY
  // =====================================================

  const getSaleDateKey = (sale) => {
    if (sale?.date) {
      return String(sale.date).trim();
    }

    const date = getSaleDate(sale);

    if (!date) {
      return "";
    }

    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Karachi",
    });
  };

  // =====================================================
  // TODAY DATE KEY
  // =====================================================

  const getTodayDateKey = () => {
    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Karachi",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).formatToParts(now);

    const day = parts.find(
      (part) => part.type === "day"
    )?.value;

    const month = parts.find(
      (part) => part.type === "month"
    )?.value;

    const year = parts.find(
      (part) => part.type === "year"
    )?.value;

    return `${day} ${month} ${year}`;
  };

  // =====================================================
  // FORMAT DATE + TIME
  // =====================================================

  const formatDateTime = (saleOrDate) => {
    const date = getSaleDate(saleOrDate);

    if (!date) {
      if (
        saleOrDate &&
        typeof saleOrDate === "object"
      ) {
        return {
          date: saleOrDate.date || "-",
          time: saleOrDate.time || "-",
        };
      }

      return {
        date: "-",
        time: "-",
      };
    }

    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Karachi",
      }),

      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Karachi",
      }),
    };
  };

  // =====================================================
  // SALE TOTAL
  // =====================================================

  const getSaleTotal = (sale) => {
    return Number(
      sale?.grand_total ??
        sale?.total ??
        0
    );
  };

  // =====================================================
  // PAYMENT TYPE
  // =====================================================

  const getPaymentType = (sale) => {
    if (sale?.payment) {
      return String(sale.payment);
    }

    if (!Array.isArray(sale?.payments)) {
      return "Unknown";
    }

    const methods = [
      ...new Set(
        sale.payments.map((payment) =>
          String(
            payment.payment_method || ""
          ).toUpperCase()
        )
      ),
    ];

    if (methods.length > 1) {
      return "Split";
    }

    if (methods[0] === "CASH") {
      return "Cash";
    }

    if (methods[0] === "CARD") {
      return "Card";
    }

    return "Unknown";
  };

  // =====================================================
  // PAYMENT AMOUNT
  // =====================================================

  const getPaymentAmount = (sale, method) => {
    if (!Array.isArray(sale?.payments)) {
      return 0;
    }

    return sale.payments
      .filter(
        (payment) =>
          String(
            payment.payment_method || ""
          ).toUpperCase() === method
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );
  };

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        salesResponse,
        inventoryResponse,
      ] = await Promise.all([
        api.get("/sales"),
        api.get("/inventory"),
      ]);

      setSales(
        Array.isArray(salesResponse.data)
          ? salesResponse.data
          : []
      );

      setInventory(
        Array.isArray(inventoryResponse.data)
          ? inventoryResponse.data
          : []
      );
    } catch (err) {
      console.error(
        "DASHBOARD API ERROR:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD WHEN DASHBOARD OPENS
  // =====================================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =====================================================
  // TODAY'S SALES
  // =====================================================

  const todaySales = useMemo(() => {
    const todayKey = getTodayDateKey();

    return sales.filter((sale) => {
      const status = String(
        sale.status || ""
      ).toUpperCase();

      if (status !== "COMPLETED") {
        return false;
      }

      return (
        getSaleDateKey(sale) ===
        todayKey
      );
    });
  }, [sales]);

  // =====================================================
  // TODAY SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const totalSales =
      todaySales.reduce(
        (sum, sale) =>
          sum + getSaleTotal(sale),
        0
      );

    const transactions =
      todaySales.length;

    const cashSales =
      todaySales.reduce(
        (sum, sale) =>
          sum +
          getPaymentAmount(
            sale,
            "CASH"
          ),
        0
      );

    const cardSales =
      todaySales.reduce(
        (sum, sale) =>
          sum +
          getPaymentAmount(
            sale,
            "CARD"
          ),
        0
      );

    const splitSales =
      todaySales
        .filter(
          (sale) =>
            getPaymentType(
              sale
            ).toLowerCase() ===
            "split"
        )
        .reduce(
          (sum, sale) =>
            sum + getSaleTotal(sale),
          0
        );

    return {
      totalSales,
      transactions,
      cashSales,
      cardSales,
      splitSales,
    };
  }, [todaySales]);

  // =====================================================
  // LOW STOCK
  // =====================================================

  const lowStockItems = useMemo(() => {
    return inventory
      .filter((item) => {
        const stock = Number(
          item.current_stock || 0
        );

        const reorder = Number(
          item.reorder_level || 0
        );

        return stock <= reorder;
      })
      .sort(
        (a, b) =>
          Number(
            a.current_stock || 0
          ) -
          Number(
            b.current_stock || 0
          )
      )
      .slice(0, 5);
  }, [inventory]);

  // =====================================================
  // LAST 7 DAYS
  // =====================================================

  const weeklySales = useMemo(() => {
    const result = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);

      date.setDate(
        now.getDate() - i
      );

      const parts =
        new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone:
              "Asia/Karachi",
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ).formatToParts(date);

      const day =
        parts.find(
          (part) =>
            part.type === "day"
        )?.value;

      const month =
        parts.find(
          (part) =>
            part.type === "month"
        )?.value;

      const year =
        parts.find(
          (part) =>
            part.type === "year"
        )?.value;

      const dayKey =
        `${day} ${month} ${year}`;

      const total = sales
        .filter((sale) => {
          const status = String(
            sale.status || ""
          ).toUpperCase();

          if (status !== "COMPLETED") {
            return false;
          }

          return (
            getSaleDateKey(sale) ===
            dayKey
          );
        })
        .reduce(
          (sum, sale) =>
            sum + getSaleTotal(sale),
          0
        );

      result.push({
        day: date.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
            timeZone:
              "Asia/Karachi",
          }
        ),
        sales: total,
      });
    }

    return result;
  }, [sales]);

  const maxWeeklySales = Math.max(
    ...weeklySales.map(
      (item) => item.sales
    ),
    1
  );

  const totalWeeklySales =
    weeklySales.reduce(
      (sum, item) =>
        sum + item.sales,
      0
    );

  // =====================================================
  // RECENT TRANSACTIONS
  // =====================================================

  const recentTransactions =
    useMemo(() => {
      return sales
        .filter(
          (sale) =>
            String(
              sale.status || ""
            ).toUpperCase() ===
            "COMPLETED"
        )
        .sort((a, b) => {
          const dateA =
            getSaleDate(a)?.getTime() ||
            0;

          const dateB =
            getSaleDate(b)?.getTime() ||
            0;

          return dateB - dateA;
        })
        .slice(0, 5);
    }, [sales]);

  // =====================================================
  // PAYMENT SUMMARY
  // =====================================================

  const paymentMethods = useMemo(() => {
    const total =
      summary.totalSales || 0;

    const cashPercentage =
      total > 0
        ? Math.round(
            (summary.cashSales /
              total) *
              100
          )
        : 0;

    const cardPercentage =
      total > 0
        ? Math.round(
            (summary.cardSales /
              total) *
              100
          )
        : 0;

    return [
      {
        name: "Cash",
        amount:
          summary.cashSales,
        percentage:
          cashPercentage,
        icon: Banknote,
        iconBg:
          "bg-orange-50",
        iconColor:
          "text-orange-600",
        bar:
          "bg-orange-500",
      },
      {
        name: "Card",
        amount:
          summary.cardSales,
        percentage:
          cardPercentage,
        icon: CreditCard,
        iconBg:
          "bg-purple-50",
        iconColor:
          "text-purple-600",
        bar:
          "bg-purple-500",
      },
    ];
  }, [summary]);

  // =====================================================
  // STATS
  // =====================================================

  const stats = [
    {
      title: "Today's Sales",
      value: `Rs. ${formatMoney(
        summary.totalSales
      )}`,
      description:
        "Completed sales today",
      icon: Banknote,
      iconBg:
        "bg-blue-50",
      iconColor:
        "text-blue-600",
      accent:
        "border-l-blue-500",
    },
    {
      title: "Transactions",
      value:
        summary.transactions,
      description:
        "Completed today",
      icon: Receipt,
      iconBg:
        "bg-emerald-50",
      iconColor:
        "text-emerald-600",
      accent:
        "border-l-emerald-500",
    },
    {
      title: "Cash Sales",
      value: `Rs. ${formatMoney(
        summary.cashSales
      )}`,
      description:
        "Cash payments today",
      icon: Banknote,
      iconBg:
        "bg-orange-50",
      iconColor:
        "text-orange-600",
      accent:
        "border-l-orange-500",
    },
    {
      title: "Card Sales",
      value: `Rs. ${formatMoney(
        summary.cardSales
      )}`,
      description:
        "Card payments today",
      icon: CreditCard,
      iconBg:
        "bg-purple-50",
      iconColor:
        "text-purple-600",
      accent:
        "border-l-purple-500",
    },
  ];

  // =====================================================
  // TODAY DISPLAY
  // =====================================================

  const todayDisplay =
    new Date().toLocaleDateString(
      "en-GB",
      {
        timeZone:
          "Asia/Karachi",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <RefreshCw
              size={24}
              className="animate-spin text-blue-600"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading dashboard...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching your latest store data
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle
              size={25}
              className="text-red-600"
            />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Unable to Load Dashboard
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={
              fetchDashboardData
            }
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <Activity size={14} />
            Store Overview
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            Monitor sales, payments and inventory activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
            <Clock
              size={16}
              className="text-slate-400"
            />

            <span>
              Today, {todayDisplay}
            </span>
          </div>

          <button
            onClick={
              fetchDashboardData
            }
            disabled={loading}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw
              size={18}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

        </div>
      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200 border-l-4 ${stat.accent} bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between">

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <h2 className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-800">
                    {stat.value}
                  </h2>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon
                    size={21}
                    className={
                      stat.iconColor
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-xs text-slate-400">
                  {stat.description}
                </span>
              </div>
            </div>
          );
        })}

      </div>

      {/* =================================================
          SPLIT + LOW STOCK
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* SPLIT */}

        <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-center justify-between">

            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-600">
                  Split-Payment Sales
                </p>

                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                  Today
                </span>
              </div>

              <h2 className="mt-2 text-2xl font-bold text-slate-800">
                Rs.{" "}
                {formatMoney(
                  summary.splitSales
                )}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Cash + card combined transactions
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-indigo-100">
              <Layers3
                size={22}
                className="text-indigo-600"
              />
            </div>

          </div>
        </div>

        {/* LOW STOCK */}

        <div
          onClick={() =>
            navigate(
              "/inventory"
            )
          }
          className="group cursor-pointer rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >

          <div className="flex items-center justify-between">

            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-600">
                  Low-Stock Items
                </p>

                {lowStockItems.length >
                  0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                    Attention
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-2xl font-bold text-red-600">
                {lowStockItems.length}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Items at or below reorder level
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-red-100">
              <AlertTriangle
                size={22}
                className="text-red-600"
              />
            </div>

          </div>
        </div>

      </div>

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* SALES OVERVIEW */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">

          <div className="flex items-start justify-between">

            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <TrendingUp
                    size={16}
                    className="text-blue-600"
                  />
                </div>

                <h2 className="text-lg font-bold text-slate-800">
                  Sales Overview
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Sales performance for the last 7 days
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
                  "/reports"
                )
              }
              className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-50 hover:text-blue-600"
            >
              <span className="hidden sm:block">
                Reports
              </span>

              <ArrowUpRight
                size={17}
              />
            </button>

          </div>

          {/* CHART */}

          <div className="mt-8">

            <div className="flex h-64 items-end gap-2 border-b border-slate-100 px-1 sm:gap-4">

              {weeklySales.map(
                (item, index) => {
                  const height =
                    item.sales === 0
                      ? 6
                      : Math.max(
                          (item.sales /
                            maxWeeklySales) *
                            190,
                          14
                        );

                  return (
                    <div
                      key={`${item.day}-${index}`}
                      className="group flex h-full flex-1 flex-col items-center justify-end"
                    >

                      <div className="relative flex h-full w-full items-end justify-center">

                        <div
                          className="absolute -top-1 hidden whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg group-hover:block"
                        >
                          Rs.{" "}
                          {formatMoney(
                            item.sales
                          )}
                        </div>

                        <div
                          className={`w-full max-w-[44px] rounded-t-lg transition-all duration-300 ${
                            item.sales > 0
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-slate-100"
                          }`}
                          style={{
                            height: `${height}px`,
                          }}
                        />
                      </div>

                      <span className="mt-3 text-xs font-semibold text-slate-400">
                        {item.day}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* CHART FOOTER */}

          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total weekly sales
              </p>

              <p className="mt-1 text-xl font-bold text-slate-800">
                Rs.{" "}
                {formatMoney(
                  totalWeeklySales
                )}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <TrendingUp
                size={15}
                className="text-emerald-500"
              />

              Last 7 days
            </div>

          </div>

        </div>

        {/* PAYMENT SUMMARY */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <CreditCard
                  size={16}
                  className="text-purple-600"
                />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                Payment Summary
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Today's payment methods
            </p>
          </div>

          <div className="mt-8 space-y-7">

            {paymentMethods.map(
              (payment) => {
                const Icon =
                  payment.icon;

                return (
                  <div
                    key={
                      payment.name
                    }
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${payment.iconBg}`}
                        >
                          <Icon
                            size={19}
                            className={
                              payment.iconColor
                            }
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {
                              payment.name
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {
                              payment.percentage
                            }
                            % of sales
                          </p>
                        </div>

                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-800">
                        Rs.{" "}
                        {formatMoney(
                          payment.amount
                        )}
                      </p>

                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${payment.bar}`}
                        style={{
                          width: `${payment.percentage}%`,
                        }}
                      />
                    </div>

                  </div>
                );
              }
            )}

          </div>

          <div className="mt-8 border-t border-slate-100 pt-5">

            <div className="flex items-center justify-between">

              <span className="text-sm font-medium text-slate-500">
                Total today's sales
              </span>

              <span className="text-lg font-bold text-slate-800">
                Rs.{" "}
                {formatMoney(
                  summary.totalSales
                )}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          RECENT TRANSACTIONS
      ================================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* TRANSACTIONS */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:px-6">

            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Receipt
                    size={16}
                    className="text-emerald-600"
                  />
                </div>

                <h2 className="text-lg font-bold text-slate-800">
                  Recent Transactions
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Latest completed sales
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
                  "/sales"
                )
              }
              className="group flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              View All

              <ChevronRight
                size={16}
                className="transition group-hover:translate-x-0.5"
              />
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px]">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">

                  <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Invoice
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Cashier
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Amount
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Payment
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Time
                  </th>

                  <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {recentTransactions.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-14 text-center"
                    >
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                        <Receipt
                          size={21}
                          className="text-slate-400"
                        />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-600">
                        No completed transactions yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Completed sales will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map(
                    (
                      transaction
                    ) => {
                      const dateTime =
                        formatDateTime(
                          transaction
                        );

                      const payment =
                        getPaymentType(
                          transaction
                        );

                      return (
                        <tr
                          key={
                            transaction.id
                          }
                          className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50"
                        >

                          <td className="px-6 py-4">
                            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                              #
                              {transaction.invoice ||
                                transaction.invoice_number ||
                                "-"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {transaction.cashier ||
                              transaction.cashier_name ||
                              "Unknown"}
                          </td>

                          <td className="px-6 py-4 text-sm font-bold text-slate-800">
                            Rs.{" "}
                            {formatMoney(
                              getSaleTotal(
                                transaction
                              )
                            )}
                          </td>

                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                payment ===
                                "Cash"
                                  ? "bg-orange-50 text-orange-600"
                                  : payment ===
                                    "Card"
                                  ? "bg-purple-50 text-purple-600"
                                  : payment ===
                                    "Split"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {payment}
                            </span>

                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {transaction.time ||
                              dateTime.time}
                          </td>

                          <td className="px-6 py-4">

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Completed
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            LOW STOCK
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Low Stock
                </h2>

                {lowStockItems.length >
                  0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {lowStockItems.length}
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-sm text-slate-500">
                Items requiring attention
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle
                size={18}
                className="text-red-500"
              />
            </div>

          </div>

          <div className="divide-y divide-slate-100">

            {lowStockItems.length ===
            0 ? (
              <div className="px-6 py-12 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <Package
                    size={21}
                    className="text-emerald-500"
                  />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Inventory looks good
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  No low-stock items.
                </p>

              </div>
            ) : (
              lowStockItems.map(
                (item) => {
                  const stock =
                    Number(
                      item.current_stock ||
                        0
                    );

                  const reorder =
                    Number(
                      item.reorder_level ||
                        0
                    );

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Package
                            size={17}
                            className="text-slate-500"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {item.name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {item.sku}
                          </p>
                        </div>

                      </div>

                      <div className="shrink-0 text-right">

                        <p className="text-sm font-bold text-red-600">
                          {stock} left
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Reorder:{" "}
                          {reorder}
                        </p>

                      </div>

                    </div>
                  );
                }
              )
            )}

          </div>

          <div className="border-t border-slate-100 p-4">

            <button
              onClick={() =>
                navigate(
                  "/inventory"
                )
              }
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
            >
              View Inventory

              <ArrowUpRight
                size={15}
                className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <ShoppingCart
                  size={16}
                  className="text-blue-600"
                />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                Quick Actions
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Frequently used POS actions
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* NEW SALE */}

          <button
            onClick={() =>
              navigate("/pos")
            }
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-100">
              <ShoppingCart
                size={20}
                className="text-blue-600"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700">
                New Sale
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Start a new transaction
              </p>
            </div>

            <ChevronRight
              size={17}
              className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500"
            />
          </button>

          {/* ADD ITEM */}

          <button
            onClick={() =>
              navigate("/items")
            }
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/60 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition group-hover:bg-emerald-100">
              <Package
                size={20}
                className="text-emerald-600"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700">
                Add Item
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Create a new product
              </p>
            </div>

            <ChevronRight
              size={17}
              className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500"
            />
          </button>

          {/* SALES HISTORY */}

          <button
            onClick={() =>
              navigate("/sales")
            }
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50/60 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 transition group-hover:bg-purple-100">
              <Receipt
                size={20}
                className="text-purple-600"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700">
                Sales History
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                View previous transactions
              </p>
            </div>

            <ChevronRight
              size={17}
              className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-purple-500"
            />
          </button>

          {/* REPORTS */}

          <button
            onClick={() =>
              navigate("/reports")
            }
            className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-orange-100">
              <TrendingUp
                size={20}
                className="text-orange-600"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700">
                Reports
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                View business reports
              </p>
            </div>

            <ChevronRight
              size={17}
              className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500"
            />
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;