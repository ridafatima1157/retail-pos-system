import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  AlertTriangle,
  Plus,
  X,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

import api from "../services/api";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAdjustmentModal, setShowAdjustmentModal] =
    useState(false);

  const [showMovementHistory, setShowMovementHistory] =
    useState(false);

  const [adjusting, setAdjusting] = useState(false);

  const [adjustmentForm, setAdjustmentForm] = useState({
    item_id: "",
    adjustment_type: "ADD",
    quantity: "",
    reason: "",
  });

  // =========================================================
  // LOAD INVENTORY
  // =========================================================

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/inventory");

      setInventory(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD MOVEMENTS
  // =========================================================

  const loadMovements = async () => {
    try {
      setMovementLoading(true);

      const response = await api.get(
        "/inventory/movements"
      );

      setMovements(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load stock movements."
      );
    } finally {
      setMovementLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadInventory();
    loadMovements();
  }, []);

  // =========================================================
  // FILTER INVENTORY
  // =========================================================

  const filteredInventory = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return inventory;
    }

    return inventory.filter((item) =>
      `${item.name || ""} ${item.sku || ""} ${
        item.barcode || ""
      } ${item.category || ""}`
        .toLowerCase()
        .includes(value)
    );
  }, [inventory, search]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalItems = inventory.length;

  const totalStockUnits = inventory.reduce(
    (total, item) =>
      total + Number(item.current_stock || 0),
    0
  );

  const lowStockCount = inventory.filter(
    (item) =>
      item.is_active &&
      Number(item.current_stock || 0) <=
        Number(item.reorder_level || 0)
  ).length;

  // =========================================================
  // OPEN ADJUSTMENT MODAL
  // =========================================================

  const openAdjustmentModal = () => {
    setError("");
    setSuccess("");

    setAdjustmentForm({
      item_id: "",
      adjustment_type: "ADD",
      quantity: "",
      reason: "",
    });

    setShowAdjustmentModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeAdjustmentModal = () => {
    if (adjusting) {
      return;
    }

    setShowAdjustmentModal(false);
  };

  // =========================================================
  // SELECTED ITEM
  // =========================================================

  const selectedItem = inventory.find(
    (item) =>
      item.id === Number(adjustmentForm.item_id)
  );

  const adjustmentQuantity = Number(
    adjustmentForm.quantity || 0
  );

  const signedQuantity =
    adjustmentForm.adjustment_type === "ADD"
      ? adjustmentQuantity
      : -adjustmentQuantity;

  const newStock = selectedItem
    ? Number(selectedItem.current_stock || 0) +
      signedQuantity
    : 0;

  // =========================================================
  // STOCK ADJUSTMENT
  // =========================================================

  const handleAdjustment = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!adjustmentForm.item_id) {
      setError("Please select a product.");
      return;
    }

    if (
      !adjustmentForm.quantity ||
      adjustmentQuantity <= 0
    ) {
      setError(
        "Please enter a quantity greater than zero."
      );
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      setError("Please enter a reason.");
      return;
    }

    if (!selectedItem) {
      setError("Selected product was not found.");
      return;
    }

    if (newStock < 0) {
      setError(
        `Stock cannot become negative. Current stock is ${selectedItem.current_stock}.`
      );
      return;
    }

    try {
      setAdjusting(true);

      const oldStock = Number(
        selectedItem.current_stock || 0
      );

      const response = await api.post(
        "/inventory/adjust",
        {
          item_id: Number(
            adjustmentForm.item_id
          ),
          quantity: signedQuantity,
          reason:
            adjustmentForm.reason.trim(),
          movement_type: "ADJUSTMENT",
        }
      );

      setShowAdjustmentModal(false);

      setSuccess(
        response.data?.message ||
          `Stock updated successfully. Old Stock: ${oldStock}, New Stock: ${newStock}.`
      );

      await Promise.all([
        loadInventory(),
        loadMovements(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to update stock."
      );
    } finally {
      setAdjusting(false);
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    await Promise.all([
      loadInventory(),
      loadMovements(),
    ]);

    setSuccess(
      "Inventory refreshed successfully."
    );
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleString();
  };

  // =========================================================
  // MOVEMENT LABEL
  // =========================================================

  const movementLabel = (type) => {
    switch (type) {
      case "OPENING":
        return "Opening";

      case "ADJUSTMENT":
        return "Adjustment";

      case "SALE":
        return "Sale";

      case "VOID":
        return "Void";

      default:
        return type || "Unknown";
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage stock balances, adjustments and
            movement history.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            onClick={() =>
              setShowMovementHistory(
                !showMovementHistory
              )
            }
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <History size={17} />

            {showMovementHistory
              ? "Hide History"
              : "Movement History"}
          </button>

          <button
            onClick={openAdjustmentModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />

            Adjust Stock
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={17} />

            Refresh
          </button>

        </div>
      </div>

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

          <CheckCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{success}</span>

        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Total Items
            </p>

            <Package
              size={20}
              className="text-blue-500"
            />

          </div>

          <p className="mt-3 text-2xl font-bold text-slate-800">
            {loading ? "..." : totalItems}
          </p>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Total Stock Units
            </p>

            <ArrowDownToLine
              size={20}
              className="text-emerald-500"
            />

          </div>

          <p className="mt-3 text-2xl font-bold text-slate-800">
            {loading
              ? "..."
              : totalStockUnits.toLocaleString()}
          </p>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Low Stock
            </p>

            <AlertTriangle
              size={20}
              className="text-red-500"
            />

          </div>

          <p className="mt-3 text-2xl font-bold text-red-600">
            {loading ? "..." : lowStockCount}
          </p>

        </div>

      </div>

      {/* =====================================================
          STOCK BALANCE
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">

          <div>

            <h2 className="font-semibold text-slate-800">
              Stock Balance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Real-time stock balance from the database.
            </p>

          </div>

          <div className="relative w-full md:w-80">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search SKU, product or barcode..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50">

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  SKU
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current Stock
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Reorder Level
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Loading inventory...
                  </td>
                </tr>

              ) : filteredInventory.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No inventory items found.
                  </td>
                </tr>

              ) : (

                filteredInventory.map((item) => {

                  const currentStock =
                    Number(
                      item.current_stock || 0
                    );

                  const reorderLevel =
                    Number(
                      item.reorder_level || 0
                    );

                  const lowStock =
                    item.is_active &&
                    currentStock <=
                      reorderLevel;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">

                        <div>

                          <p className="text-sm font-semibold text-slate-700">
                            {item.sku}
                          </p>

                          <p className="text-xs text-slate-400">
                            {item.barcode ||
                              "No barcode"}
                          </p>

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">

                            <Package
                              size={18}
                              className="text-slate-500"
                            />

                          </div>

                          <div>

                            <p className="text-sm font-semibold text-slate-700">
                              {item.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              {item.category ||
                                "No category"}
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="px-6 py-4 text-center">

                        <span
                          className={`text-lg font-bold ${
                            lowStock
                              ? "text-red-600"
                              : "text-slate-800"
                          }`}
                        >
                          {currentStock}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-center text-sm text-slate-500">
                        {reorderLevel}
                      </td>

                      <td className="px-6 py-4 text-center">

                        {lowStock ? (

                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">

                            <AlertTriangle
                              size={13}
                            />

                            Low Stock

                          </span>

                        ) : (

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                            Normal
                          </span>

                        )}

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          MOVEMENT HISTORY
      ===================================================== */}

      {showMovementHistory && (

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">

            <h2 className="font-semibold text-slate-800">
              Stock Movement History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete inventory movement and audit history.
            </p>

          </div>

          {movementLoading ? (

            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading movement history...
            </div>

          ) : movements.length === 0 ? (

            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No stock movements yet.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Product
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Change
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Before
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      After
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      User
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Reason
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {movements.map((movement) => {

                    const quantity = Number(
                      movement.quantity ??
                        movement.quantity_change ??
                        0
                    );

                    const isPositive =
                      quantity > 0;

                    return (

                      <tr
                        key={movement.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatDate(
                            movement.created_at
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <p className="text-sm font-semibold text-slate-700">
                            {movement.item_name ||
                              "Unknown Item"}
                          </p>

                          {movement.sku && (
                            <p className="text-xs text-slate-400">
                              {movement.sku}
                            </p>
                          )}

                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {movementLabel(
                              movement.movement_type
                            )}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-center">

                          <span
                            className={`font-bold ${
                              isPositive
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {quantity}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-center text-sm text-slate-500">
                          {movement.stock_before ??
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                          {movement.stock_after ??
                            "-"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {movement.user_name ||
                            movement.created_by_name ||
                            "Unknown"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {movement.reason || "-"}
                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>
      )}

      {/* =====================================================
          RECENT MOVEMENTS
      ===================================================== */}

      {!showMovementHistory && (

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 p-5">

            <div>

              <h2 className="font-semibold text-slate-800">
                Recent Stock Movements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest inventory changes.
              </p>

            </div>

            <button
              onClick={() =>
                setShowMovementHistory(true)
              }
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </button>

          </div>

          {movementLoading ? (

            <div className="px-6 py-10 text-center text-sm text-slate-500">
              Loading movements...
            </div>

          ) : movements.length === 0 ? (

            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No stock movements yet.
            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {movements
                .slice(0, 5)
                .map((movement) => {

                  const quantity = Number(
                    movement.quantity ??
                      movement.quantity_change ??
                      0
                  );

                  const isPositive =
                    quantity > 0;

                  return (

                    <div
                      key={movement.id}
                      className="flex flex-col justify-between gap-3 px-6 py-4 sm:flex-row sm:items-center"
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            isPositive
                              ? "bg-emerald-50"
                              : "bg-red-50"
                          }`}
                        >

                          {isPositive ? (

                            <ArrowDownToLine
                              size={17}
                              className="text-emerald-600"
                            />

                          ) : (

                            <ArrowUpFromLine
                              size={17}
                              className="text-red-600"
                            />

                          )}

                        </div>

                        <div>

                          <p className="text-sm font-medium text-slate-700">
                            {movement.item_name ||
                              "Unknown Item"}
                          </p>

                          <p className="text-xs text-slate-400">

                            {movementLabel(
                              movement.movement_type
                            )}

                            {" • "}

                            {movement.user_name ||
                              movement.created_by_name ||
                              "Unknown"}

                          </p>

                          {movement.reason && (

                            <p className="mt-1 text-xs text-slate-400">
                              Reason:{" "}
                              {movement.reason}
                            </p>

                          )}

                        </div>

                      </div>

                      <div className="flex items-center gap-6">

                        <span
                          className={`font-semibold ${
                            isPositive
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {quantity}
                        </span>

                        <span className="text-xs text-slate-400">
                          {formatDate(
                            movement.created_at
                          )}
                        </span>

                      </div>

                    </div>

                  );
                })}

            </div>

          )}

        </div>

      )}

      {/* =====================================================
          ADJUST STOCK MODAL
          
          IMPORTANT FIX:
          - No fixed height
          - Overlay itself scrolls
          - Modal has max-height
          - Form area scrolls if needed
          - Header remains visible
          - Buttons remain accessible
      ===================================================== */}

      {showAdjustmentModal && (

        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAdjustmentModal();
            }
          }}
        >

          <div className="flex min-h-full items-center justify-center p-4">

            <div
              className="my-6 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >

              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

                <div>

                  <h2 className="text-lg font-semibold text-slate-800">
                    Adjust Stock
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add or remove stock with an audit reason.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeAdjustmentModal}
                  disabled={adjusting}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

              </div>

              {/* =================================================
                  MODAL FORM
              ================================================= */}

              <form
                onSubmit={handleAdjustment}
                className="max-h-[calc(100vh-180px)] overflow-y-auto"
              >

                <div className="space-y-5 p-6">

                  {/* PRODUCT */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Product
                    </label>

                    <select
                      value={
                        adjustmentForm.item_id
                      }
                      onChange={(e) =>
                        setAdjustmentForm({
                          ...adjustmentForm,
                          item_id: e.target.value,
                        })
                      }
                      disabled={adjusting}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 disabled:bg-slate-100"
                    >

                      <option value="">
                        Select Product
                      </option>

                      {inventory
                        .filter(
                          (item) =>
                            item.is_active
                        )
                        .map((item) => (

                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name} —{" "}
                            {item.sku}
                            {" "}
                            (Stock:{" "}
                            {item.current_stock})
                          </option>

                        ))}

                    </select>

                  </div>

                  {/* CURRENT STOCK */}

                  {selectedItem && (

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

                      <div className="flex items-center justify-between">

                        <div>

                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Selected Product
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {selectedItem.name}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs text-slate-500">
                            Current Stock
                          </p>

                          <p className="mt-1 text-2xl font-bold text-slate-800">
                            {selectedItem.current_stock}
                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                  {/* ADD / REMOVE */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Adjustment Type
                    </label>

                    <div className="grid grid-cols-2 gap-3">

                      <button
                        type="button"
                        disabled={adjusting}
                        onClick={() =>
                          setAdjustmentForm({
                            ...adjustmentForm,
                            adjustment_type:
                              "ADD",
                          })
                        }
                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                          adjustmentForm.adjustment_type ===
                          "ADD"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >

                        <ArrowDownToLine
                          size={18}
                        />

                        Add Stock

                      </button>

                      <button
                        type="button"
                        disabled={adjusting}
                        onClick={() =>
                          setAdjustmentForm({
                            ...adjustmentForm,
                            adjustment_type:
                              "REMOVE",
                          })
                        }
                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                          adjustmentForm.adjustment_type ===
                          "REMOVE"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >

                        <ArrowUpFromLine
                          size={18}
                        />

                        Remove Stock

                      </button>

                    </div>

                  </div>

                  {/* QUANTITY */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        adjustmentForm.quantity
                      }
                      onChange={(e) =>
                        setAdjustmentForm({
                          ...adjustmentForm,
                          quantity: e.target.value,
                        })
                      }
                      disabled={adjusting}
                      placeholder="Example: 20"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 disabled:bg-slate-100"
                    />

                  </div>

                  {/* PREVIEW */}

                  {selectedItem &&
                    adjustmentQuantity > 0 && (

                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">

                        <p className="text-sm font-semibold text-blue-800">
                          Stock Preview
                        </p>

                        <div className="mt-3 space-y-2">

                          <div className="flex items-center justify-between text-sm">

                            <span className="text-slate-600">
                              Old Stock
                            </span>

                            <strong>
                              {
                                selectedItem.current_stock
                              }
                            </strong>

                          </div>

                          <div className="flex items-center justify-between text-sm">

                            <span className="text-slate-600">
                              {adjustmentForm.adjustment_type ===
                              "ADD"
                                ? "Added"
                                : "Removed"}
                            </span>

                            <strong
                              className={
                                adjustmentForm.adjustment_type ===
                                "ADD"
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }
                            >
                              {adjustmentForm.adjustment_type ===
                              "ADD"
                                ? "+"
                                : "-"}
                              {
                                adjustmentQuantity
                              }
                            </strong>

                          </div>

                          <div className="flex items-center justify-between border-t border-blue-100 pt-3">

                            <span className="font-semibold text-slate-700">
                              New Stock
                            </span>

                            <strong
                              className={`text-xl ${
                                newStock < 0
                                  ? "text-red-600"
                                  : "text-slate-800"
                              }`}
                            >
                              {newStock}
                            </strong>

                          </div>

                        </div>

                      </div>

                    )}

                  {/* NEGATIVE STOCK WARNING */}

                  {selectedItem &&
                    adjustmentQuantity > 0 &&
                    newStock < 0 && (

                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        Stock cannot become negative.
                        Please reduce the quantity.
                      </div>

                    )}

                  {/* REASON */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Reason
                    </label>

                    <textarea
                      value={
                        adjustmentForm.reason
                      }
                      onChange={(e) =>
                        setAdjustmentForm({
                          ...adjustmentForm,
                          reason: e.target.value,
                        })
                      }
                      disabled={adjusting}
                      rows={4}
                      placeholder="Example: New stock received, damaged item, stock count correction..."
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 disabled:bg-slate-100"
                    />

                  </div>

                </div>

                {/* =================================================
                    MODAL FOOTER
                ================================================= */}

                <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">

                  <button
                    type="button"
                    onClick={closeAdjustmentModal}
                    disabled={adjusting}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      adjusting ||
                      !selectedItem ||
                      adjustmentQuantity <= 0 ||
                      newStock < 0
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {adjusting
                      ? "Saving..."
                      : "Confirm Adjustment"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Inventory;