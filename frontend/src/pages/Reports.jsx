import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Banknote,
  CreditCard,
  Package,
  Download,
  CalendarDays,
  RefreshCw,
  Boxes,
  History,
  FileText,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import api from "../services/api";

function Reports() {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("This Week");

  // =========================
  // FORMATTERS
  // =========================

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return `${date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const getSaleDate = (sale) => {
    if (sale?.created_at) {
      const date = new Date(sale.created_at);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    if (sale?.date) {
      const date = new Date(sale.date);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  };

  const getSaleTotal = (sale) => {
    return Number(sale?.grand_total ?? sale?.total ?? 0);
  };

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
          String(payment.payment_method || "").toUpperCase()
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

  const getPaymentAmount = (sale, method) => {
    if (!Array.isArray(sale?.payments)) {
      return 0;
    }

    return sale.payments
      .filter(
        (payment) =>
          String(payment.payment_method || "").toUpperCase() === method
      )
      .reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );
  };

  const getItemDetails = (sale) => {
    if (Array.isArray(sale?.sale_items)) {
      return sale.sale_items;
    }

    if (Array.isArray(sale?.items) && sale.items.length > 0) {
      if (typeof sale.items[0] === "object") {
        return sale.items;
      }
    }

    return [];
  };

  // =========================
  // LOAD DATA
  // =========================

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        salesResponse,
        inventoryResponse,
        movementsResponse,
      ] = await Promise.all([
        api.get("/sales"),
        api.get("/inventory"),
        api.get("/inventory/movements"),
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

      setMovements(
        Array.isArray(movementsResponse.data)
          ? movementsResponse.data
          : []
      );
    } catch (err) {
      console.error("Failed to load reports:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load report data from the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  // =========================
  // PERIOD FILTER
  // =========================

  const getStartDate = () => {
    const now = new Date();

    if (period === "Today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (period === "This Week") {
      const start = new Date(now);

      const day = start.getDay();

      const difference = day === 0 ? 6 : day - 1;

      start.setDate(start.getDate() - difference);
      start.setHours(0, 0, 0, 0);

      return start;
    }

    if (period === "This Month") {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
    }

    return null;
  };

  const filteredSales = useMemo(() => {
    const startDate = getStartDate();

    return sales.filter((sale) => {
      const status = String(
        sale.status || ""
      ).toUpperCase();

      if (status !== "COMPLETED") {
        return false;
      }

      if (!startDate) {
        return true;
      }

      const saleDate = getSaleDate(sale);

      if (!saleDate) {
        return false;
      }

      return saleDate >= startDate;
    });
  }, [sales, period]);

  // =========================
  // REPORT 1:
  // DAILY SALES
  // =========================

  const dailySummary = useMemo(() => {
    const transactionCount = filteredSales.length;

    const grossSales = filteredSales.reduce(
      (sum, sale) =>
        sum + getSaleTotal(sale),
      0
    );

    const netSales = filteredSales.reduce(
      (sum, sale) =>
        sum +
        Number(sale?.subtotal || 0) -
        Number(sale?.discount || 0),
      0
    );

    const cashTotal = filteredSales.reduce(
      (sum, sale) =>
        sum + getPaymentAmount(sale, "CASH"),
      0
    );

    const cardTotal = filteredSales.reduce(
      (sum, sale) =>
        sum + getPaymentAmount(sale, "CARD"),
      0
    );

    const splitTotal = filteredSales
      .filter(
        (sale) =>
          getPaymentType(sale).toLowerCase() === "split"
      )
      .reduce(
        (sum, sale) =>
          sum + getSaleTotal(sale),
        0
      );

    return {
      transactionCount,
      grossSales,
      netSales,
      cashTotal,
      cardTotal,
      splitTotal,
    };
  }, [filteredSales]);

  // =========================
  // DAILY CHART
  // =========================

  const dailySales = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);

      date.setDate(
        now.getDate() - i
      );

      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);

      nextDate.setDate(
        date.getDate() + 1
      );

      const total = filteredSales
        .filter((sale) => {
          const saleDate = getSaleDate(sale);

          if (!saleDate) {
            return false;
          }

          return (
            saleDate >= date &&
            saleDate < nextDate
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
          }
        ),
        sales: total,
      });
    }

    return result;
  }, [filteredSales]);

  const maxSales = Math.max(
    ...dailySales.map(
      (item) => item.sales
    ),
    1
  );

  // =========================
  // REPORT 2:
  // SALES DETAIL
  // =========================

  const salesDetailRows = useMemo(() => {
    const rows = [];

    filteredSales.forEach((sale) => {
      const details = getItemDetails(sale);

      if (details.length === 0) {
        rows.push({
          invoice:
            sale.invoice ||
            sale.invoice_number ||
            "-",

          date:
            sale.created_at ||
            sale.date,

          cashier:
            sale.cashier ||
            sale.cashier_name ||
            "-",

          item:
            typeof sale.items === "number"
              ? `${sale.items} item(s)`
              : "-",

          quantity:
            typeof sale.items === "number"
              ? sale.items
              : "-",

          subtotal:
            Number(sale.subtotal || 0),

          discount:
            Number(sale.discount || 0),

          tax:
            Number(sale.tax || 0),

          total:
            getSaleTotal(sale),

          payment:
            getPaymentType(sale),
        });

        return;
      }

      details.forEach((item) => {
        rows.push({
          invoice:
            sale.invoice ||
            sale.invoice_number ||
            "-",

          date:
            sale.created_at ||
            sale.date,

          cashier:
            sale.cashier ||
            sale.cashier_name ||
            "-",

          item:
            item.name ||
            item.item_name ||
            "Unknown Item",

          quantity:
            Number(item.quantity || 0),

          subtotal:
            Number(
              item.line_total ||
                item.total ||
                0
            ),

          discount:
            Number(sale.discount || 0),

          tax:
            Number(
              item.tax ||
                0
            ),

          total:
            Number(
              item.line_total ||
                item.total ||
                0
            ),

          payment:
            getPaymentType(sale),
        });
      });
    });

    return rows;
  }, [filteredSales]);

  // =========================
  // REPORT 3:
  // INVENTORY BALANCE
  // =========================

  const inventoryRows = useMemo(() => {
    return inventory.map((item) => {
      const currentStock = Number(
        item.current_stock || 0
      );

      const reorderLevel = Number(
        item.reorder_level || 0
      );

      let status = "IN STOCK";

      if (currentStock <= 0) {
        status = "OUT OF STOCK";
      } else if (currentStock <= reorderLevel) {
        status = "LOW STOCK";
      }

      return {
        ...item,
        currentStock,
        reorderLevel,
        status,
      };
    });
  }, [inventory]);

  // =========================
  // REPORT 4:
  // STOCK MOVEMENT
  // =========================

  const movementRows = useMemo(() => {
    return movements.map((movement) => {
      const type = String(
        movement.movement_type ||
          movement.type ||
          ""
      ).toUpperCase();

      return {
        ...movement,

        item:
          movement.item_name ||
          movement.item?.name ||
          "Unknown Item",

        sku:
          movement.item_sku ||
          movement.item?.sku ||
          "-",

        user:
          movement.user_name ||
          movement.user?.name ||
          movement.created_by_name ||
          "Unknown User",

        movementType:
          type || "UNKNOWN",

        quantity:
          Number(
            movement.quantity_change ??
              movement.quantity ??
              0
          ),

        reason:
          movement.reason ||
          "-",

        date:
          movement.created_at ||
          movement.date,
      };
    });
  }, [movements]);

  // =========================
  // CSV DOWNLOAD FUNCTION
  // =========================

  const downloadCSV = (
    filename,
    headers,
    rows
  ) => {
    if (!rows.length) {
      alert(
        "There is no data available for this report."
      );
      return;
    }

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const safeValue =
              value === null ||
              value === undefined
                ? ""
                : value;

            return `"${String(
              safeValue
            ).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================
  // DOWNLOAD REPORT 1
  // =========================

  const downloadDailySales = () => {
    const headers = [
      "Report Period",
      "Transaction Count",
      "Gross Sales",
      "Net Sales",
      "Cash Total",
      "Card Total",
      "Split Payment Total",
    ];

    const rows = [
      [
        period,
        dailySummary.transactionCount,
        dailySummary.grossSales.toFixed(2),
        dailySummary.netSales.toFixed(2),
        dailySummary.cashTotal.toFixed(2),
        dailySummary.cardTotal.toFixed(2),
        dailySummary.splitTotal.toFixed(2),
      ],
    ];

    downloadCSV(
      `daily-sales-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  // =========================
  // DOWNLOAD REPORT 2
  // =========================

  const downloadSalesDetail = () => {
    const headers = [
      "Invoice Number",
      "Date/Time",
      "Cashier",
      "Item",
      "Quantity",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
      "Payment",
    ];

    const rows = salesDetailRows.map(
      (row) => [
        row.invoice,
        formatDateTime(row.date),
        row.cashier,
        row.item,
        row.quantity,
        Number(row.subtotal).toFixed(2),
        Number(row.discount).toFixed(2),
        Number(row.tax).toFixed(2),
        Number(row.total).toFixed(2),
        row.payment,
      ]
    );

    downloadCSV(
      `sales-detail-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  // =========================
  // DOWNLOAD REPORT 3
  // =========================

  const downloadInventoryBalance = () => {
    const headers = [
      "Item",
      "SKU",
      "Barcode",
      "Current Stock",
      "Reorder Level",
      "Status",
    ];

    const rows = inventoryRows.map(
      (item) => [
        item.name || "-",
        item.sku || "-",
        item.barcode || "-",
        item.currentStock,
        item.reorderLevel,
        item.status,
      ]
    );

    downloadCSV(
      `inventory-balance-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  // =========================
  // DOWNLOAD REPORT 4
  // =========================

  const downloadStockMovement = () => {
    const headers = [
      "Item",
      "SKU",
      "Movement Type",
      "Quantity Change",
      "Stock Before",
      "Stock After",
      "User",
      "Date/Time",
      "Reason",
    ];

    const rows = movementRows.map(
      (movement) => [
        movement.item,
        movement.sku,
        movement.movementType,
        movement.quantity,
        movement.stock_before ??
          movement.stockBefore ??
          "",
        movement.stock_after ??
          movement.stockAfter ??
          "",
        movement.user,
        formatDateTime(
          movement.date
        ),
        movement.reason,
      ]
    );

    downloadCSV(
      `stock-movement-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw
            size={20}
            className="animate-spin"
          />
          Loading reports...
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-700">
          Unable to Load Reports
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={fetchReportsData}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-8">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and download detailed POS reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays
            size={18}
            className="text-slate-500"
          />

          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-500"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>All Time</option>
          </select>

          <button
            onClick={fetchReportsData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* REPORT 1 - DAILY SALES */}
      {/* ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <BarChart3
                size={22}
                className="text-slate-700"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                1. Daily Sales Report
              </h2>

              <p className="text-sm text-slate-500">
                Sales summary for {period.toLowerCase()}.
              </p>
            </div>
          </div>

          <button
            onClick={downloadDailySales}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Download size={17} />
            Download Daily Sales
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <ShoppingCart
                size={20}
                className="text-slate-600"
              />

              <span className="text-sm text-slate-500">
                Transaction Count
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {dailySummary.transactionCount}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <span className="text-sm text-slate-500">
              Gross Sales
            </span>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              Rs. {formatMoney(
                dailySummary.grossSales
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <span className="text-sm text-slate-500">
              Net Sales
            </span>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              Rs. {formatMoney(
                dailySummary.netSales
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <Banknote
                size={20}
                className="text-slate-600"
              />

              <span className="text-sm text-slate-500">
                Cash Total
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              Rs. {formatMoney(
                dailySummary.cashTotal
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <CreditCard
                size={20}
                className="text-slate-600"
              />

              <span className="text-sm text-slate-500">
                Card Total
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              Rs. {formatMoney(
                dailySummary.cardTotal
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <span className="text-sm text-slate-500">
              Split Payment Total
            </span>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              Rs. {formatMoney(
                dailySummary.splitTotal
              )}
            </p>
          </div>
        </div>

        {/* DAILY CHART */}

        <div className="border-t border-slate-200 p-6">
          <h3 className="mb-5 font-semibold text-slate-900">
            Last 7 Days
          </h3>

          <div className="flex h-64 items-end gap-3 overflow-x-auto">
            {dailySales.map(
              (item, index) => {
                const height =
                  item.sales === 0
                    ? 4
                    : Math.max(
                        (item.sales /
                          maxSales) *
                          200,
                        12
                      );

                return (
                  <div
                    key={index}
                    className="flex min-w-[60px] flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold text-slate-600">
                      Rs.{" "}
                      {formatMoney(
                        item.sales
                      )}
                    </span>

                    <div
                      className="w-full max-w-[55px] rounded-t-lg bg-slate-800 transition-all"
                      style={{
                        height: `${height}px`,
                      }}
                    />

                    <span className="text-xs text-slate-500">
                      {item.day}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* REPORT 2 - SALES DETAIL */}
      {/* ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <FileText
                size={22}
                className="text-slate-700"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                2. Sales Detail Report
              </h2>

              <p className="text-sm text-slate-500">
                Invoice, cashier, item and payment details.
              </p>
            </div>
          </div>

          <button
            onClick={downloadSalesDetail}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Download size={17} />
            Download Sales Detail
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">
                  Invoice
                </th>

                <th className="px-6 py-4">
                  Date/Time
                </th>

                <th className="px-6 py-4">
                  Cashier
                </th>

                <th className="px-6 py-4">
                  Item
                </th>

                <th className="px-6 py-4">
                  Qty
                </th>

                <th className="px-6 py-4">
                  Total
                </th>

                <th className="px-6 py-4">
                  Payment
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {salesDetailRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No sales detail available.
                  </td>
                </tr>
              ) : (
                salesDetailRows.map(
                  (row, index) => (
                    <tr
                      key={`${row.invoice}-${index}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {row.invoice}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDateTime(
                          row.date
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {row.cashier}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {row.item}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {row.quantity}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        Rs.{" "}
                        {formatMoney(
                          row.total
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {row.payment}
                        </span>
                      </td>
                    </tr>
                  )
                )
              )}

            </tbody>
          </table>
        </div>
      </section>

      {/* ===================================================== */}
      {/* REPORT 3 - INVENTORY BALANCE */}
      {/* ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <Boxes
                size={22}
                className="text-slate-700"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                3. Inventory Balance Report
              </h2>

              <p className="text-sm text-slate-500">
                Current stock and reorder levels.
              </p>
            </div>
          </div>

          <button
            onClick={downloadInventoryBalance}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Download size={17} />
            Download Inventory Balance
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <Package
                size={20}
                className="text-slate-600"
              />

              <span className="text-sm text-slate-500">
                Total Items
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {inventoryRows.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <span className="text-sm text-slate-500">
              Low Stock
            </span>

            <p className="mt-3 text-2xl font-bold text-amber-600">
              {
                inventoryRows.filter(
                  (item) =>
                    item.status ===
                    "LOW STOCK"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <span className="text-sm text-slate-500">
              Out of Stock
            </span>

            <p className="mt-3 text-2xl font-bold text-red-600">
              {
                inventoryRows.filter(
                  (item) =>
                    item.status ===
                    "OUT OF STOCK"
                ).length
              }
            </p>
          </div>

        </div>

        <div className="overflow-x-auto border-t border-slate-200">
          <table className="min-w-full text-left text-sm">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">
                  Item
                </th>

                <th className="px-6 py-4">
                  SKU
                </th>

                <th className="px-6 py-4">
                  Barcode
                </th>

                <th className="px-6 py-4">
                  Current Stock
                </th>

                <th className="px-6 py-4">
                  Reorder Level
                </th>

                <th className="px-6 py-4">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {inventoryRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No inventory data available.
                  </td>
                </tr>
              ) : (
                inventoryRows.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.name || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.sku || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.barcode || "-"}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.currentStock}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {item.reorderLevel}
                      </td>

                      <td className="px-6 py-4">

                        {item.status ===
                        "OUT OF STOCK" ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            OUT OF STOCK
                          </span>
                        ) : item.status ===
                          "LOW STOCK" ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            IN STOCK
                          </span>
                        )}

                      </td>
                    </tr>
                  )
                )
              )}

            </tbody>
          </table>
        </div>
      </section>

      {/* ===================================================== */}
      {/* REPORT 4 - STOCK MOVEMENT */}
      {/* ===================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <History
                size={22}
                className="text-slate-700"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                4. Stock Movement Report
              </h2>

              <p className="text-sm text-slate-500">
                Opening, adjustment, sale and void movements.
              </p>
            </div>
          </div>

          <button
            onClick={downloadStockMovement}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Download size={17} />
            Download Stock Movement
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">
                  Item
                </th>

                <th className="px-6 py-4">
                  SKU
                </th>

                <th className="px-6 py-4">
                  Movement
                </th>

                <th className="px-6 py-4">
                  Quantity
                </th>

                <th className="px-6 py-4">
                  Before
                </th>

                <th className="px-6 py-4">
                  After
                </th>

                <th className="px-6 py-4">
                  User
                </th>

                <th className="px-6 py-4">
                  Date/Time
                </th>

                <th className="px-6 py-4">
                  Reason
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {movementRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No stock movement data available.
                  </td>
                </tr>
              ) : (
                movementRows.map(
                  (movement, index) => (
                    <tr
                      key={
                        movement.id ||
                        index
                      }
                      className="hover:bg-slate-50"
                    >

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {movement.item}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {movement.sku}
                      </td>

                      <td className="px-6 py-4">

                        {movement.movementType ===
                          "SALE" ||
                        movement.movementType ===
                          "VOID" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {movement.movementType ===
                            "SALE" ? (
                              <ArrowDownRight
                                size={13}
                              />
                            ) : (
                              <ArrowUpRight
                                size={13}
                              />
                            )}

                            {
                              movement.movementType
                            }
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {
                              movement.movementType
                            }
                          </span>
                        )}

                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          movement.quantity < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {movement.quantity > 0
                          ? `+${movement.quantity}`
                          : movement.quantity}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {movement.stock_before ??
                          movement.stockBefore ??
                          "-"}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {movement.stock_after ??
                          movement.stockAfter ??
                          "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {movement.user}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {formatDateTime(
                          movement.date
                        )}
                      </td>

                      <td className="max-w-[250px] px-6 py-4 text-slate-600">
                        {movement.reason}
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export default Reports;