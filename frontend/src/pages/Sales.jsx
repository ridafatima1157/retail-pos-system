
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Printer,
  CalendarDays,
  X,
  RefreshCw,
  Receipt,
  Package,
  CreditCard,
  Banknote,
  Layers3,
  Ban,
} from "lucide-react";

import api from "../services/api";

function Sales() {
  // =========================================================
  // STATE
  // =========================================================

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState(
    "All Payment Methods"
  );
  const [dateFilter, setDateFilter] = useState("All Dates");

  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");

  // Void Sale
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [saleToVoid, setSaleToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState("");

  // =========================================================
  // CURRENT USER
  // =========================================================

  const getCurrentUser = () => {
    try {
      const user = localStorage.getItem("user");

      if (!user) {
        return null;
      }

      return JSON.parse(user);
    } catch (err) {
      console.error("Unable to read current user:", err);
      return null;
    }
  };

  const isAdmin = () => {
    const user = getCurrentUser();

    return (
      String(user?.role || "").toUpperCase() === "ADMIN"
    );
  };

  // =========================================================
  // FETCH SALES
  // =========================================================

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/sales");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setSales(data);
    } catch (err) {
      console.error("Failed to load sales:", err);

      const message =
        err.response?.data?.detail ||
        "Unable to load sales from the server.";

      setError(message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // =========================================================
  // MONEY
  // =========================================================

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // SALE TOTAL
  // =========================================================

  const getSaleTotal = (sale) => {
    return Number(
      sale?.total ??
        sale?.grand_total ??
        0
    );
  };

  // =========================================================
  // SALE DATE
  // =========================================================

   // =========================================================
  // SALE DATE
  // =========================================================

  const getSaleDate = (sale) => {
    if (!sale?.created_at) {
      return null;
    }

    const date = new Date(sale.created_at);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  // =========================================================
  // DISPLAY DATE
  // =========================================================

  const getSaleDisplayDate = (sale) => {
    const date = getSaleDate(sale);

    if (!date) {
      return sale?.date || "";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // GET TODAY KEY
  // =========================================================

  const getTodayKey = () => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
  };

  // =========================================================
  // GET SALE DATE KEY
  // =========================================================

  const getSaleDateKey = (sale) => {
    const date = getSaleDate(sale);

    if (!date) {
      return null;
    }

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  };

  // =========================================================
  // IS TODAY
  // =========================================================

  const isToday = (sale) => {
    return getSaleDateKey(sale) === getTodayKey();
  };

  // =========================================================
  // DATE + TIME
  // =========================================================

  const formatDateTime = (sale) => {
    const date = getSaleDate(sale);

    if (!date) {
      return {
        date: sale?.date || "-",
        time: sale?.time || "-",
      };
    }

    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };


  // =========================================================
  // PAYMENT TYPE
  // =========================================================

  const getPaymentType = (sale) => {
    if (sale?.payment) {
      return sale.payment;
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

  // =========================================================
  // PAYMENT AMOUNT
  // =========================================================

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

  // =========================================================
  // FILTERED SALES
  // =========================================================

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const paymentType = getPaymentType(sale);

      const searchText = `
        ${sale.invoice || ""}
        ${sale.invoice_number || ""}
        ${sale.cashier || ""}
        ${sale.cashier_name || ""}
        ${paymentType}
      `.toLowerCase();

      const matchesSearch =
        searchText.includes(
          search.toLowerCase()
        );

      const matchesPayment =
        paymentFilter ===
          "All Payment Methods" ||
        paymentType === paymentFilter;

      const matchesDate =
        dateFilter === "All Dates" ||
        (dateFilter === "Today" &&
          isToday(sale));

      return (
        matchesSearch &&
        matchesPayment &&
        matchesDate
      );
    });
  }, [
    sales,
    search,
    paymentFilter,
    dateFilter,
  ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    const completedSales = sales.filter(
      (sale) =>
        String(
          sale.status || ""
        ).toUpperCase() === "COMPLETED"
    );

    const todaySales =
      completedSales.filter(
        (sale) => isToday(sale)
      );

    const todayTotal =
      todaySales.reduce(
        (sum, sale) =>
          sum + getSaleTotal(sale),
        0
      );

    const cashTotal =
      todaySales.reduce(
        (sum, sale) =>
          sum +
          getPaymentAmount(
            sale,
            "CASH"
          ),
        0
      );

    const cardTotal =
      todaySales.reduce(
        (sum, sale) =>
          sum +
          getPaymentAmount(
            sale,
            "CARD"
          ),
        0
      );

    const splitTotal =
      todaySales
        .filter(
          (sale) =>
            getPaymentType(sale) ===
            "Split"
        )
        .reduce(
          (sum, sale) =>
            sum + getSaleTotal(sale),
          0
        );

    return {
      todayTotal,
      transactions: todaySales.length,
      cashTotal,
      cardTotal,
      splitTotal,
    };
  }, [sales]);

  // =========================================================
  // FETCH SINGLE SALE
  // =========================================================

  const fetchSaleDetails = async (sale) => {
    try {
      setLoadingDetails(true);
      setDetailsError("");

      const response = await api.get(
        `/sales/${sale.id}`
      );

      setSelectedSale(response.data);
    } catch (err) {
      console.error(
        "Failed to load sale details:",
        err
      );

      setSelectedSale(sale);

      setDetailsError(
        err.response?.data?.detail ||
          "Unable to load complete sale details."
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  // =========================================================
  // OPEN VOID MODAL
  // =========================================================

  const openVoidModal = (sale) => {
    // Extra frontend protection
    if (!isAdmin()) {
      return;
    }

    const status = String(
      sale?.status || ""
    ).toUpperCase();

    // Only completed sales can be voided
    if (status !== "COMPLETED") {
      return;
    }

    setSaleToVoid(sale);
    setVoidReason("");
    setVoidError("");
    setShowVoidModal(true);
  };

  // =========================================================
  // CLOSE VOID MODAL
  // =========================================================

  const closeVoidModal = () => {
    if (voidLoading) {
      return;
    }

    setShowVoidModal(false);
    setSaleToVoid(null);
    setVoidReason("");
    setVoidError("");
  };

  // =========================================================
  // CONFIRM VOID SALE
  // =========================================================

  const confirmVoidSale = async () => {
    if (!saleToVoid) {
      return;
    }

    if (!isAdmin()) {
      setVoidError(
        "Only Admin users can void sales."
      );

      return;
    }

    const reason = voidReason.trim();

    if (!reason) {
      setVoidError(
        "Please enter a reason for voiding this sale."
      );

      return;
    }

    try {
      setVoidLoading(true);
      setVoidError("");

      await api.post(
        `/sales/${saleToVoid.id}/void`,
        {
          reason,
        }
      );

      // Close void modal
      setShowVoidModal(false);
      setSaleToVoid(null);
      setVoidReason("");

      // Close details modal
      setSelectedSale(null);

      // Refresh real database data
      await fetchSales();

    } catch (err) {
      console.error(
        "Void sale failed:",
        err
      );

      setVoidError(
        err.response?.data?.detail ||
          "Unable to void this sale."
      );
    } finally {
      setVoidLoading(false);
    }
  };

  // =========================================================
  // PRINT RECEIPT
  // =========================================================

  const printReceipt = async (sale) => {
    let receiptSale = sale;

    try {
      const response = await api.get(
        `/sales/${sale.id}`
      );

      receiptSale = response.data;
    } catch (err) {
      console.error(
        "Could not load complete receipt data:",
        err
      );
    }

    const dateTime =
      formatDateTime(receiptSale);

    const invoice =
      receiptSale.invoice_number ||
      receiptSale.invoice ||
      `SALE-${receiptSale.id}`;

    const total =
      getSaleTotal(receiptSale);

    const paymentRows =
      Array.isArray(
        receiptSale.payments
      )
        ? receiptSale.payments
            .map(
              (payment) => `
                <tr>
                  <td>
                    ${payment.payment_method}
                  </td>

                  <td style="text-align:right">
                    Rs.
                    ${formatMoney(
                      payment.amount
                    )}
                  </td>
                </tr>
              `
            )
            .join("")
        : "";

    const itemRows =
      Array.isArray(
        receiptSale.items
      )
        ? receiptSale.items
            .map(
              (item) => `
                <tr>

                  <td>
                    ${item.name || "Item"}

                    <br />

                    <small>
                      SKU:
                      ${item.sku || "-"}
                    </small>
                  </td>

                  <td style="text-align:center">
                    ${item.quantity || 0}
                  </td>

                  <td style="text-align:right">
                    Rs.
                    ${formatMoney(
                      item.unit_price
                    )}
                  </td>

                  <td style="text-align:right">
                    Rs.
                    ${formatMoney(
                      item.line_total
                    )}
                  </td>

                </tr>
              `
            )
            .join("")
        : "";

    const receiptWindow =
      window.open(
        "",
        "_blank",
        "width=650,height=800"
      );

    if (!receiptWindow) {
      alert(
        "Please allow pop-ups to print the receipt."
      );

      return;
    }

    receiptWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            ${invoice}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 25px;
              color: #1e293b;
              background: white;
            }

            .receipt {
              max-width: 560px;
              margin: auto;
            }

            h1 {
              text-align: center;
              margin: 0;
            }

            .center {
              text-align: center;
            }

            .muted {
              color: #64748b;
            }

            .line {
              border-top:
                1px dashed #94a3b8;

              margin: 18px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th {
              font-size: 12px;
              color: #64748b;
              text-align: left;
              border-bottom:
                1px solid #cbd5e1;
              padding: 8px 0;
            }

            td {
              padding: 8px 0;
              vertical-align: top;
            }

            small {
              color: #94a3b8;
            }

            .total {
              border-top:
                1px solid #cbd5e1;

              font-size: 18px;
              font-weight: bold;
            }

            @media print {

              body {
                padding: 0;
              }

            }

          </style>

        </head>

        <body>

          <div class="receipt">

            <h1>
              Retail POS
            </h1>

            <div class="center">

              <p class="muted">
                Sales Receipt
              </p>

              <strong>
                ${invoice}
              </strong>

            </div>

            <div class="line"></div>

            <p>
              <strong>
                Date:
              </strong>

              ${dateTime.date}
            </p>

            <p>
              <strong>
                Time:
              </strong>

              ${dateTime.time}
            </p>

            <p>
              <strong>
                Cashier:
              </strong>

              ${
                receiptSale.cashier_name ||
                receiptSale.cashier ||
                "Unknown"
              }
            </p>

            <div class="line"></div>

            ${
              itemRows
                ? `
                  <h3>
                    Items
                  </h3>

                  <table>

                    <thead>

                      <tr>

                        <th>
                          Item
                        </th>

                        <th
                          style="text-align:center"
                        >
                          Qty
                        </th>

                        <th
                          style="text-align:right"
                        >
                          Price
                        </th>

                        <th
                          style="text-align:right"
                        >
                          Total
                        </th>

                      </tr>

                    </thead>

                    <tbody>
                      ${itemRows}
                    </tbody>

                  </table>

                  <div class="line"></div>
                `
                : ""
            }

            <table>

              <tr>

                <td>
                  Subtotal
                </td>

                <td style="text-align:right">
                  Rs.
                  ${formatMoney(
                    receiptSale.subtotal
                  )}
                </td>

              </tr>

              <tr>

                <td>
                  Discount
                </td>

                <td style="text-align:right">
                  Rs.
                  ${formatMoney(
                    receiptSale.discount
                  )}
                </td>

              </tr>

              <tr>

                <td>
                  Tax
                </td>

                <td style="text-align:right">
                  Rs.
                  ${formatMoney(
                    receiptSale.tax
                  )}
                </td>

              </tr>

              <tr class="total">

                <td>
                  Grand Total
                </td>

                <td style="text-align:right">
                  Rs.
                  ${formatMoney(total)}
                </td>

              </tr>

            </table>

            <div class="line"></div>

            <h3>
              Payment
            </h3>

            <table>

              ${
                paymentRows ||
                `
                  <tr>

                    <td>
                      ${getPaymentType(
                        receiptSale
                      )}
                    </td>

                    <td style="text-align:right">
                      Rs.
                      ${formatMoney(total)}
                    </td>

                  </tr>
                `
              }

            </table>

            ${
              Number(
                receiptSale.change || 0
              ) > 0
                ? `
                  <p>

                    <strong>
                      Change:
                    </strong>

                    Rs.
                    ${formatMoney(
                      receiptSale.change
                    )}

                  </p>
                `
                : ""
            }

            <div class="line"></div>

            <p class="center">
              Thank you for your purchase.
            </p>

          </div>

        </body>

      </html>
    `);

    receiptWindow.document.close();

    receiptWindow.focus();

    setTimeout(() => {
      receiptWindow.print();
    }, 300);
  };

  // =========================================================
  // PAYMENT BADGE
  // =========================================================

  const PaymentBadge = ({ sale }) => {
    const payment =
      getPaymentType(sale);

    if (payment === "Cash") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
          <Banknote size={13} />
          Cash
        </span>
      );
    }

    if (payment === "Card") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
          <CreditCard size={13} />
          Card
        </span>
      );
    }

    if (payment === "Split") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          <Layers3 size={13} />
          Split
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        Unknown
      </span>
    );
  };

  // =========================================================
  // RETURN UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Sales
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage sales transactions from the database.
          </p>

        </div>

        <button
          onClick={fetchSales}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* TODAY SALES */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Today's Sales
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                Rs.{" "}
                {formatMoney(
                  summary.todayTotal
                )}
              </p>

            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Receipt size={20} />
            </div>

          </div>

        </div>

        {/* TRANSACTIONS */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Today's Transactions
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {summary.transactions}
              </p>

            </div>

            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <Package size={20} />
            </div>

          </div>

        </div>

        {/* CASH */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Cash Sales
              </p>

              <p className="mt-2 text-2xl font-bold text-orange-600">
                Rs.{" "}
                {formatMoney(
                  summary.cashTotal
                )}
              </p>

            </div>

            <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
              <Banknote size={20} />
            </div>

          </div>

        </div>

        {/* CARD */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Card Sales
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-600">
                Rs.{" "}
                {formatMoney(
                  summary.cardTotal
                )}
              </p>

            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <CreditCard size={20} />
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          SPLIT PAYMENT
      ===================================================== */}

      {summary.splitTotal > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-white p-2 text-blue-600">
                <Layers3 size={18} />
              </div>

              <div>

                <p className="text-sm font-semibold text-blue-800">
                  Today's Split Payments
                </p>

                <p className="text-xs text-blue-600">
                  Cash + Card transactions
                </p>

              </div>

            </div>

            <p className="text-lg font-bold text-blue-700">
              Rs.{" "}
              {formatMoney(
                summary.splitTotal
              )}
            </p>

          </div>

        </div>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

          {/* SEARCH */}

          <div className="relative md:col-span-2">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search invoice or cashier..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />

          </div>

          {/* DATE */}

          <div className="relative">

            <CalendarDays
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(
                  e.target.value
                )
              }
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none focus:border-blue-500"
            >

              <option>
                All Dates
              </option>

              <option>
                Today
              </option>

            </select>

          </div>

          {/* PAYMENT */}

          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500"
          >

            <option>
              All Payment Methods
            </option>

            <option>
              Cash
            </option>

            <option>
              Card
            </option>

            <option>
              Split
            </option>

          </select>

        </div>

        {/* FILTER INFO */}

        {(search ||
          paymentFilter !==
            "All Payment Methods" ||
          dateFilter !==
            "All Dates") && (

          <div className="mt-4 flex flex-col justify-between gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">

            <p className="text-sm text-slate-500">

              Showing{" "}

              <span className="font-semibold text-slate-700">
                {filteredSales.length}
              </span>

              {" "}of{" "}

              <span className="font-semibold text-slate-700">
                {sales.length}
              </span>

              {" "}transactions

            </p>

            <button
              onClick={() => {
                setSearch("");
                setPaymentFilter(
                  "All Payment Methods"
                );
                setDateFilter(
                  "All Dates"
                );
              }}
              className="text-left text-sm font-semibold text-blue-600 hover:text-blue-700 sm:text-right"
            >
              Clear Filters
            </button>

          </div>
        )}

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center">

          <span>
            {error}
          </span>

          <button
            onClick={fetchSales}
            className="font-semibold underline"
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          SALES TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">

          <div>

            <h2 className="font-semibold text-slate-800">
              Sales Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Real transactions fetched from PostgreSQL through the backend API.
            </p>

          </div>

          {!loading && (
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredSales.length} Records
            </span>
          )}

        </div>

        <div className="overflow-x-auto">

          {loading ? (

            <div className="flex flex-col items-center justify-center py-20">

              <RefreshCw
                size={30}
                className="animate-spin text-blue-500"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading sales from database...
              </p>

            </div>

          ) : filteredSales.length === 0 ? (

            <div className="flex flex-col items-center justify-center py-20">

              <div className="rounded-full bg-slate-100 p-4">

                <Receipt
                  size={40}
                  className="text-slate-300"
                />

              </div>

              <p className="mt-4 font-semibold text-slate-600">
                No sales found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing the filters or complete a sale from POS.
              </p>

            </div>

          ) : (

            <table className="w-full min-w-[1150px]">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date & Time
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cashier
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Items
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredSales.map(
                  (sale) => {

                    const dateTime =
                      formatDateTime(
                        sale
                      );

                    const total =
                      getSaleTotal(
                        sale
                      );

                    const status =
                      String(
                        sale.status ||
                          ""
                      ).toUpperCase();

                    return (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* INVOICE */}

                        <td className="px-6 py-4">

                          <span className="text-sm font-bold text-blue-600">
                            {sale.invoice ||
                              sale.invoice_number ||
                              `SALE-${sale.id}`}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="px-6 py-4">

                          <p className="text-sm font-medium text-slate-700">
                            {dateTime.date}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {dateTime.time}
                          </p>

                        </td>

                        {/* CASHIER */}

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {sale.cashier ||
                            sale.cashier_name ||
                            "Unknown"}
                        </td>

                        {/* ITEMS */}

                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {sale.items ??
                            sale.items_count ??
                            0}
                        </td>

                        {/* TOTAL */}

                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-800">
                          Rs.{" "}
                          {formatMoney(
                            total
                          )}
                        </td>

                        {/* PAYMENT */}

                        <td className="px-6 py-4 text-center">
                          <PaymentBadge
                            sale={sale}
                          />
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4 text-center">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              status ===
                              "COMPLETED"
                                ? "bg-emerald-50 text-emerald-600"
                                : status ===
                                  "VOIDED"
                                ? "bg-red-50 text-red-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {status ||
                              "UNKNOWN"}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-4 text-center">

                          <div className="flex items-center justify-center gap-1">

                            {/* VIEW */}

                            <button
                              onClick={() =>
                                fetchSaleDetails(
                                  sale
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                              title="View sale"
                            >

                              <Eye
                                size={17}
                              />

                            </button>

                            {/* PRINT */}

                            <button
                              onClick={() =>
                                printReceipt(
                                  sale
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Print receipt"
                            >

                              <Printer
                                size={17}
                              />

                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

      {/* =====================================================
          SALE DETAILS MODAL
      ===================================================== */}

      {selectedSale && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setSelectedSale(null);
            }
          }}
        >

          <div className="flex min-h-full items-start justify-center py-4 sm:items-center sm:py-8">

            <div
              role="dialog"
              aria-modal="true"
              className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-5">

                <div>

                  <h2 className="text-lg font-bold text-slate-800">
                    Sale Details
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-blue-600">
                    {selectedSale.invoice_number ||
                      selectedSale.invoice ||
                      `SALE-${selectedSale.id}`}
                  </p>

                </div>

                <button
                  onClick={() =>
                    setSelectedSale(
                      null
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >

                  <X size={20} />

                </button>

              </div>

              {/* BODY */}

              <div className="min-h-0 flex-1 overflow-y-auto">

                {loadingDetails ? (

                  <div className="flex flex-col items-center justify-center py-20">

                    <RefreshCw
                      size={28}
                      className="animate-spin text-blue-500"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading complete sale details...
                    </p>

                  </div>

                ) : (

                  <div className="space-y-5 p-5">

                    {/* ERROR */}

                    {detailsError && (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                        {detailsError}
                      </div>
                    )}

                    {/* BASIC INFO */}

                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">

                      <div>

                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {
                            formatDateTime(
                              selectedSale
                            ).date
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Time
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {
                            formatDateTime(
                              selectedSale
                            ).time
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Cashier
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {selectedSale.cashier_name ||
                            selectedSale.cashier ||
                            "Unknown"}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Payment
                        </p>

                        <div className="mt-1">
                          <PaymentBadge
                            sale={
                              selectedSale
                            }
                          />
                        </div>

                      </div>

                    </div>

                    {/* ITEMS */}

                    {Array.isArray(
                      selectedSale.items
                    ) &&
                      selectedSale.items
                        .length > 0 && (

                        <div className="overflow-hidden rounded-xl border border-slate-200">

                          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">

                            <h3 className="font-semibold text-slate-800">
                              Sold Items
                            </h3>

                          </div>

                          <div className="overflow-x-auto">

                            <table className="w-full min-w-[550px]">

                              <thead>

                                <tr className="border-b border-slate-100">

                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                                    Item
                                  </th>

                                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-400">
                                    Qty
                                  </th>

                                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">
                                    Unit Price
                                  </th>

                                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">
                                    Total
                                  </th>

                                </tr>

                              </thead>

                              <tbody>

                                {selectedSale.items.map(
                                  (
                                    item,
                                    index
                                  ) => (

                                    <tr
                                      key={
                                        item.item_id ||
                                        index
                                      }
                                      className="border-b border-slate-100 last:border-0"
                                    >

                                      <td className="px-4 py-3">

                                        <p className="text-sm font-medium text-slate-700">
                                          {item.name ||
                                            "Unknown Item"}
                                        </p>

                                        <p className="text-xs text-slate-400">
                                          SKU:{" "}
                                          {item.sku ||
                                            "-"}
                                        </p>

                                      </td>

                                      <td className="px-4 py-3 text-center text-sm text-slate-600">
                                        {item.quantity}
                                      </td>

                                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                                        Rs.{" "}
                                        {formatMoney(
                                          item.unit_price
                                        )}
                                      </td>

                                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                                        Rs.{" "}
                                        {formatMoney(
                                          item.line_total
                                        )}
                                      </td>

                                    </tr>

                                  )
                                )}

                              </tbody>

                            </table>

                          </div>

                        </div>

                      )}

                    {/* TOTALS */}

                    <div className="rounded-xl bg-slate-50 p-4">

                      <div className="flex justify-between py-2 text-sm">

                        <span className="text-slate-500">
                          Subtotal
                        </span>

                        <span className="font-medium text-slate-700">
                          Rs.{" "}
                          {formatMoney(
                            selectedSale.subtotal
                          )}
                        </span>

                      </div>

                      <div className="flex justify-between py-2 text-sm">

                        <span className="text-slate-500">
                          Discount
                        </span>

                        <span className="font-medium text-slate-700">
                          - Rs.{" "}
                          {formatMoney(
                            selectedSale.discount
                          )}
                        </span>

                      </div>

                      <div className="flex justify-between py-2 text-sm">

                        <span className="text-slate-500">
                          Tax
                        </span>

                        <span className="font-medium text-slate-700">
                          Rs.{" "}
                          {formatMoney(
                            selectedSale.tax
                          )}
                        </span>

                      </div>

                      <div className="mt-2 flex justify-between border-t border-slate-200 pt-3">

                        <span className="font-bold text-slate-800">
                          Grand Total
                        </span>

                        <span className="text-xl font-bold text-blue-600">
                          Rs.{" "}
                          {formatMoney(
                            getSaleTotal(
                              selectedSale
                            )
                          )}
                        </span>

                      </div>

                    </div>

                    {/* PAYMENT BREAKDOWN */}

                    {Array.isArray(
                      selectedSale.payments
                    ) &&
                      selectedSale.payments
                        .length > 0 && (

                        <div className="rounded-xl border border-slate-200 p-4">

                          <h3 className="mb-3 font-semibold text-slate-800">
                            Payment Breakdown
                          </h3>

                          {selectedSale.payments.map(
                            (
                              payment,
                              index
                            ) => (

                              <div
                                key={
                                  index
                                }
                                className="flex justify-between border-b border-slate-100 py-2.5 last:border-0"
                              >

                                <span className="text-sm text-slate-500">
                                  {payment.payment_method}
                                </span>

                                <span className="text-sm font-bold text-slate-700">
                                  Rs.{" "}
                                  {formatMoney(
                                    payment.amount
                                  )}
                                </span>

                              </div>

                            )
                          )}

                          {Number(
                            selectedSale.change ||
                              0
                          ) > 0 && (

                            <div className="mt-2 flex justify-between border-t border-slate-200 pt-3">

                              <span className="text-sm font-medium text-slate-600">
                                Change
                              </span>

                              <span className="text-sm font-bold text-emerald-600">
                                Rs.{" "}
                                {formatMoney(
                                  selectedSale.change
                                )}
                              </span>

                            </div>

                          )}

                        </div>

                      )}

                    {/* STATUS */}

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">

                      <span className="text-sm font-medium text-slate-500">
                        Sale Status
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          String(
                            selectedSale.status ||
                              ""
                          ).toUpperCase() ===
                          "COMPLETED"
                            ? "bg-emerald-50 text-emerald-600"
                            : String(
                                selectedSale.status ||
                                  ""
                              ).toUpperCase() ===
                              "VOIDED"
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selectedSale.status ||
                          "UNKNOWN"}
                      </span>

                    </div>

                  </div>

                )}

              </div>

              {/* =================================================
                  MODAL FOOTER
              ================================================= */}

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row">

                <button
                  onClick={() =>
                    setSelectedSale(
                      null
                    )
                  }
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>

                {/* ADMIN ONLY VOID */}

                {isAdmin() &&
                  String(
                    selectedSale?.status ||
                      ""
                  ).toUpperCase() ===
                    "COMPLETED" && (

                    <button
                      onClick={() =>
                        openVoidModal(
                          selectedSale
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >

                      <Ban size={17} />

                      Void Sale

                    </button>

                  )}

                {/* PRINT */}

                <button
                  onClick={() =>
                    printReceipt(
                      selectedSale
                    )
                  }
                  disabled={
                    loadingDetails
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Printer size={17} />

                  Print Receipt

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          VOID SALE MODAL
      ===================================================== */}

      {showVoidModal && saleToVoid && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
                e.currentTarget &&
              !voidLoading
            ) {
              closeVoidModal();
            }
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="void-sale-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>

                <h2
                  id="void-sale-title"
                  className="flex items-center gap-2 text-lg font-bold text-slate-800"
                >

                  <Ban
                    size={20}
                    className="text-red-600"
                  />

                  Void Transaction?

                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This action will restore the sold inventory.
                </p>

              </div>

              <button
                onClick={closeVoidModal}
                disabled={voidLoading}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >

                <X size={20} />

              </button>

            </div>

            {/* BODY */}

            <div className="space-y-5 p-5">

              {/* SALE INFORMATION */}

              <div className="rounded-xl bg-slate-50 p-4">

                <div className="flex justify-between">

                  <span className="text-sm text-slate-500">
                    Invoice
                  </span>

                  <span className="font-bold text-blue-600">
                    {saleToVoid.invoice_number ||
                      saleToVoid.invoice ||
                      `SALE-${saleToVoid.id}`}
                  </span>

                </div>

                <div className="mt-3 flex justify-between">

                  <span className="text-sm text-slate-500">
                    Amount
                  </span>

                  <span className="font-bold text-slate-800">
                    Rs.{" "}
                    {formatMoney(
                      getSaleTotal(
                        saleToVoid
                      )
                    )}
                  </span>

                </div>

              </div>

              {/* WARNING */}

              <div className="rounded-lg border border-red-200 bg-red-50 p-3">

                <p className="text-sm font-semibold text-red-700">
                  Warning
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  Voiding this transaction will mark the
                  sale as VOIDED and restore all sold
                  quantities back to inventory.
                </p>

              </div>

              {/* REASON */}

              <div>

                <label
                  htmlFor="void-reason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >

                  Reason

                  <span className="text-red-500">
                    {" "}*
                  </span>

                </label>

                <textarea
                  id="void-reason"
                  value={voidReason}
                  onChange={(e) =>
                    setVoidReason(
                      e.target.value
                    )
                  }
                  placeholder="Enter reason for voiding this transaction..."
                  rows={4}
                  maxLength={255}
                  disabled={voidLoading}
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
                />

                <div className="mt-1 text-right text-xs text-slate-400">
                  {voidReason.length}/255
                </div>

              </div>

              {/* ERROR */}

              {voidError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {voidError}
                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="flex gap-3 border-t border-slate-200 p-5">

              <button
                onClick={closeVoidModal}
                disabled={voidLoading}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmVoidSale}
                disabled={
                  voidLoading ||
                  !voidReason.trim()
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {voidLoading ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />

                    Voiding...
                  </>
                ) : (
                  <>
                    <Ban size={17} />

                    Confirm Void
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Sales;
