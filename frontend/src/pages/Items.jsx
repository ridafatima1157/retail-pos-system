import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Eye,
  Power,
  X,
  Package,
  AlertCircle,
  Filter,
  Tag,
  Barcode,
  DollarSign,
  Boxes,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

import api from "../services/api";

function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  const [saving, setSaving] = useState(false);

  const emptyForm = {
    sku: "",
    barcode: "",
    name: "",
    category_id: "",
    cost_price: "",
    selling_price: "",
    tax_rate: "0",
    current_stock: "0",
    reorder_level: "5",
  };

  const [form, setForm] = useState(emptyForm);

  // ---------------------------------------
  // Load categories
  // ---------------------------------------

  const loadCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Category loading error:", err);
    }
  };

  // ---------------------------------------
  // Load items
  // ---------------------------------------

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (categoryFilter) {
        params.category_id = categoryFilter;
      }

      if (statusFilter === "active") {
        params.active_only = true;
      }

      const response = await api.get("/items", {
        params,
      });

      let data = response.data;

      if (statusFilter === "inactive") {
        data = data.filter(
          (item) => item.is_active === false
        );
      }

      setItems(data);
    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to load items.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // Initial loading
  // ---------------------------------------

  useEffect(() => {
    loadCategories();
    loadItems();
  }, []);

  // ---------------------------------------
  // Search/filter
  // ---------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter]);

  // ---------------------------------------
  // Form input
  // ---------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ---------------------------------------
  // Open Add modal
  // ---------------------------------------

  const openAddModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  // ---------------------------------------
  // Open Edit modal
  // ---------------------------------------

  const openEditModal = (item) => {
    setEditingItem(item);

    setForm({
      sku: item.sku || "",
      barcode: item.barcode || "",
      name: item.name || "",
      category_id: item.category_id || "",
      cost_price: item.cost_price || "",
      selling_price: item.selling_price || "",
      tax_rate: item.tax_rate || "0",
      current_stock: item.current_stock ?? "0",
      reorder_level: item.reorder_level ?? "5",
    });

    setError("");
    setShowModal(true);
  };

  // ---------------------------------------
  // View item
  // ---------------------------------------

  const openViewModal = (item) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  // ---------------------------------------
  // Save item
  // ---------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.sku.trim()) {
      setError("SKU is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (Number(form.cost_price) < 0) {
      setError("Cost price cannot be negative.");
      return;
    }

    if (Number(form.selling_price) < 0) {
      setError("Selling price cannot be negative.");
      return;
    }

    if (Number(form.current_stock) < 0) {
      setError("Current stock cannot be negative.");
      return;
    }

    if (Number(form.reorder_level) < 0) {
      setError("Reorder level cannot be negative.");
      return;
    }

    const payload = {
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      name: form.name.trim(),
      category_id: Number(form.category_id),
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      tax_rate: Number(form.tax_rate || 0),
      current_stock: Number(form.current_stock || 0),
      reorder_level: Number(form.reorder_level || 0),
    };

    try {
      setSaving(true);

      if (editingItem) {
        await api.put(
          `/items/${editingItem.id}`,
          payload
        );
      } else {
        await api.post("/items", payload);
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingItem(null);

      await loadItems();
    } catch (err) {
      console.error(err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Unable to save item.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------
  // Activate / Deactivate
  // ---------------------------------------

  const toggleStatus = async (item) => {
    const action = item.is_active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${item.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/items/${item.id}/status`,
        null,
        {
          params: {
            is_active: !item.is_active,
          },
        }
      );

      await loadItems();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "Unable to update item status."
      );
    }
  };

  // ---------------------------------------
  // Category name
  // ---------------------------------------

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (category) => category.id === categoryId
    );

    return category?.name || "—";
  };

  // ---------------------------------------
  // Statistics
  // ---------------------------------------

  const activeCount = items.filter(
    (item) => item.is_active
  ).length;

  const inactiveCount = items.filter(
    (item) => !item.is_active
  ).length;

  const lowStockCount = items.filter(
    (item) =>
      Number(item.current_stock || 0) <=
      Number(item.reorder_level || 0)
  ).length;

  return (
    <div className="min-h-full space-y-6 bg-slate-100/80 p-1">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Inventory</span>
            <ChevronRight size={13} />
            <span className="text-blue-600">
              Items
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Items Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage products, pricing, stock levels and availability.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600"
        >
          <Plus
            size={18}
            className="transition-transform group-hover:rotate-90"
          />
          Add New Item
        </button>
      </div>

      {/* =====================================
          SUMMARY CARDS
      ===================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Items"
          value={items.length}
          description="Products in current view"
          icon={Package}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active Items"
          value={activeCount}
          description="Currently available"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          title="Inactive Items"
          value={inactiveCount}
          description="Currently disabled"
          icon={XCircle}
          iconClass="bg-slate-100 text-slate-500"
        />

        <SummaryCard
          title="Low Stock"
          value={lowStockCount}
          description="At or below reorder level"
          icon={AlertCircle}
          iconClass="bg-red-50 text-red-600"
        />
      </div>

      {/* =====================================
          FILTER PANEL
      ===================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Filter
              size={17}
              className="text-blue-600"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Search & Filters
            </h3>

            <p className="text-xs text-slate-400">
              Find products quickly
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search SKU, barcode or item..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <Tag
              size={17}
              className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
            />

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="relative">
            <Power
              size={17}
              className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-0.5 text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================
          TABLE
      ===================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Product Catalog
            </h3>

            <p className="mt-0.5 text-xs text-slate-400">
              {items.length} item
              {items.length !== 1 ? "s" : ""} displayed
            </p>
          </div>

          <button
            onClick={loadItems}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  SKU
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Item
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Category
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Barcode
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Price
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Stock
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <RefreshCw
                        size={26}
                        className="animate-spin text-blue-500"
                      />

                      <p className="mt-3 text-sm font-medium text-slate-600">
                        Loading products...
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Fetching inventory data
                      </p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-16 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <Package
                        size={30}
                        className="text-slate-400"
                      />
                    </div>

                    <p className="mt-4 font-semibold text-slate-700">
                      No items found
                    </p>

                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
                      No products match the current search or filter criteria.
                    </p>

                    <button
                      onClick={openAddModal}
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLowStock =
                    Number(item.current_stock || 0) <=
                    Number(item.reorder_level || 0);

                  return (
                    <tr
                      key={item.id}
                      className="group transition hover:bg-slate-50/80"
                    >
                      {/* SKU */}
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600">
                          {item.sku}
                        </span>
                      </td>

                      {/* Item */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Package
                              size={18}
                              className="text-blue-600"
                            />
                          </div>

                          <div>
                            <div className="font-semibold text-slate-800">
                              {item.name}
                            </div>

                            <div className="mt-0.5 text-[11px] text-slate-400">
                              Tax: {item.tax_rate}%
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600">
                          {getCategoryName(
                            item.category_id
                          )}
                        </span>
                      </td>

                      {/* Barcode */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Barcode
                            size={16}
                            className="text-slate-400"
                          />

                          <span>
                            {item.barcode || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                          <span className="text-xs text-slate-400">
                            Rs.
                          </span>

                          {Number(
                            item.selling_price
                          ).toFixed(2)}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        <div>
                          <span
                            className={`text-sm font-bold ${
                              isLowStock
                                ? "text-red-600"
                                : "text-slate-700"
                            }`}
                          >
                            {item.current_stock}
                          </span>

                          {isLowStock && (
                            <div className="mt-1 flex items-center gap-1">
                              <AlertCircle
                                size={11}
                                className="text-red-500"
                              />

                              <span className="text-[10px] font-semibold text-red-500">
                                Low stock
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            item.is_active
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                              : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.is_active
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />

                          {item.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <ActionButton
                            title="View"
                            onClick={() =>
                              openViewModal(item)
                            }
                            icon={Eye}
                            className="text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          />

                          <ActionButton
                            title="Edit"
                            onClick={() =>
                              openEditModal(item)
                            }
                            icon={Pencil}
                            className="text-blue-600 hover:bg-blue-50"
                          />

                          <ActionButton
                            title={
                              item.is_active
                                ? "Deactivate"
                                : "Activate"
                            }
                            onClick={() =>
                              toggleStatus(item)
                            }
                            icon={Power}
                            className={
                              item.is_active
                                ? "text-red-500 hover:bg-red-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================
          ADD / EDIT MODAL
      ===================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  {editingItem ? (
                    <Pencil
                      size={20}
                      className="text-blue-600"
                    />
                  ) : (
                    <Package
                      size={20}
                      className="text-blue-600"
                    />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingItem
                      ? "Edit Item"
                      : "Add New Item"}
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {editingItem
                      ? "Update product information"
                      : "Create a new product in your catalog"}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{error}</span>
                </div>
              )}

              {/* Basic Information */}
              <FormSection
                title="Basic Information"
                description="Product identification and classification"
                icon={Package}
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormInput
                    label="Item Code / SKU"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="e.g. SKU-001"
                    required
                  />

                  <FormInput
                    label="Barcode"
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    placeholder="e.g. 8901234567890"
                  />

                  <FormInput
                    label="Item Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Product name"
                    required
                  />

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category *
                    </label>

                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </FormSection>

              {/* Pricing */}
              <FormSection
                title="Pricing & Tax"
                description="Set product cost, selling price and tax"
                icon={DollarSign}
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <FormInput
                    label="Cost Price"
                    name="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Selling Price"
                    name="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.selling_price}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Tax Rate (%)"
                    name="tax_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tax_rate}
                    onChange={handleChange}
                  />
                </div>
              </FormSection>

              {/* Inventory */}
              <FormSection
                title="Inventory Control"
                description="Manage available stock and reorder threshold"
                icon={Boxes}
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormInput
                    label="Current Stock"
                    name="current_stock"
                    type="number"
                    min="0"
                    value={form.current_stock}
                    onChange={handleChange}
                  />

                  <FormInput
                    label="Reorder Level"
                    name="reorder_level"
                    type="number"
                    min="0"
                    value={form.reorder_level}
                    onChange={handleChange}
                  />
                </div>
              </FormSection>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingItem
                        ? "Update Item"
                        : "Save Item"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================
          VIEW MODAL
      ===================================== */}

      {showViewModal && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <Package
                    size={20}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Item Details
                  </h3>

                  <p className="text-xs text-slate-400">
                    Product information
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setShowViewModal(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* Product identity */}
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <Package
                    size={25}
                    className="text-blue-600"
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="truncate text-lg font-bold text-slate-900">
                    {viewingItem.name}
                  </h4>

                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {viewingItem.sku}
                  </p>
                </div>

                <span
                  className={`ml-auto shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    viewingItem.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {viewingItem.is_active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
              <Detail
                label="SKU"
                value={viewingItem.sku}
              />

              <Detail
                label="Barcode"
                value={
                  viewingItem.barcode || "—"
                }
              />

              <Detail
                label="Item Name"
                value={viewingItem.name}
              />

              <Detail
                label="Category"
                value={getCategoryName(
                  viewingItem.category_id
                )}
              />

              <Detail
                label="Cost Price"
                value={`Rs. ${Number(
                  viewingItem.cost_price
                ).toFixed(2)}`}
              />

              <Detail
                label="Selling Price"
                value={`Rs. ${Number(
                  viewingItem.selling_price
                ).toFixed(2)}`}
              />

              <Detail
                label="Tax"
                value={`${viewingItem.tax_rate}%`}
              />

              <Detail
                label="Current Stock"
                value={viewingItem.current_stock}
              />

              <Detail
                label="Reorder Level"
                value={viewingItem.reorder_level}
              />

              <Detail
                label="Status"
                value={
                  viewingItem.is_active
                    ? "Active"
                    : "Inactive"
                }
              />
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={() =>
                  setShowViewModal(false)
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================
// Summary Card
// =========================================

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// =========================================
// Form Section
// =========================================

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <Icon
            size={17}
            className="text-blue-600"
          />
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800">
            {title}
          </h4>

          <p className="mt-0.5 text-xs text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

// =========================================
// Form Input
// =========================================

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && (
          <span className="ml-1 text-blue-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        min={min}
        step={step}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}

// =========================================
// Action Button
// =========================================

function ActionButton({
  title,
  onClick,
  icon: Icon,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}

// =========================================
// Detail
// =========================================

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default Items;