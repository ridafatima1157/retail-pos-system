import { useMemo, useState } from "react";
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Banknote,
  CreditCard,
  Split,
  X,
  Package,
  CheckCircle2,
} from "lucide-react";

function POS() {
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [cashReceived, setCashReceived] = useState("");

  const [products] = useState([
    {
      id: 1,
      name: "Coca Cola 1.5L",
      sku: "SKU-00124",
      barcode: "8964000012345",
      category: "Beverages",
      price: 180,
      stock: 25,
    },
    {
      id: 2,
      name: "Nestle Milk 1L",
      sku: "SKU-00342",
      barcode: "8964000034211",
      category: "Dairy",
      price: 280,
      stock: 12,
    },
    {
      id: 3,
      name: "Lays Masala",
      sku: "SKU-00521",
      barcode: "8964000052145",
      category: "Snacks",
      price: 100,
      stock: 8,
    },
    {
      id: 4,
      name: "Surf Excel 1kg",
      sku: "SKU-00784",
      barcode: "8964000078412",
      category: "Household",
      price: 520,
      stock: 15,
    },
    {
      id: 5,
      name: "Pepsi 1.5L",
      sku: "SKU-00812",
      barcode: "8964000081244",
      category: "Beverages",
      price: 170,
      stock: 20,
    },
    {
      id: 6,
      name: "Bread Large",
      sku: "SKU-00931",
      barcode: "8964000093122",
      category: "Bakery",
      price: 160,
      stock: 10,
    },
  ]);

  const [cart, setCart] = useState([]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) {
      return products;
    }

    const value = search.toLowerCase();

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(value) ||
        product.sku.toLowerCase().includes(value) ||
        product.barcode.includes(value) ||
        product.category.toLowerCase().includes(value)
    );
  }, [search, products]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (item.quantity >= item.stock) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  };

  const decreaseQuantity = (id) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id)
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashReceived("");
  };

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const tax = subtotal * 0.05;

  const discountAmount = Math.min(
    Number(discount) || 0,
    subtotal + tax
  );

  const grandTotal = subtotal + tax - discountAmount;

  const change =
    paymentMethod === "cash"
      ? Math.max((Number(cashReceived) || 0) - grandTotal, 0)
      : 0;

  const canCheckout =
    cart.length > 0 &&
    (paymentMethod !== "cash" ||
      Number(cashReceived) >= grandTotal);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Point of Sale
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new sale and process customer payment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            Invoice:{" "}
            <span className="font-semibold text-slate-800">
              #INV-NEW
            </span>
          </div>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={17} />
            Clear Sale
          </button>
        </div>
      </div>

      {/* Main POS Layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Products Section */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          {/* Search */}
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product name, SKU, barcode or category..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                <ScanBarcode size={19} />
                Scan Barcode
              </button>
            </div>
          </div>

          {/* Products */}
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Products
                </h2>
                <p className="text-sm text-slate-500">
                  Select an item to add it to the cart.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                {filteredProducts.length} Products
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                      <Package
                        size={21}
                        className="text-blue-600"
                      />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.stock <= 5
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {product.stock} in stock
                    </span>
                  </div>

                  <h3 className="mt-4 line-clamp-1 text-sm font-semibold text-slate-800">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {product.sku}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-800">
                      Rs. {product.price.toLocaleString()}
                    </span>

                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition group-hover:bg-blue-700">
                      <Plus size={17} />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-16 text-center">
                <Package
                  size={42}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 text-sm font-semibold text-slate-700">
                  No products found
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Try another product name, SKU or barcode.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cart + Payment */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <ShoppingCart
                  size={19}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h2 className="font-semibold text-slate-800">
                  Current Sale
                </h2>

                <p className="text-xs text-slate-400">
                  {cart.length} item(s)
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-medium text-red-500 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="max-h-[390px] flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <ShoppingCart
                    size={28}
                    className="text-slate-400"
                  />
                </div>

                <h3 className="mt-4 font-semibold text-slate-700">
                  Your cart is empty
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Select products from the list to start a sale.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Package
                          size={18}
                          className="text-slate-500"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-semibold text-slate-700">
                              {item.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Rs. {item.price.toLocaleString()} each
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              removeFromCart(item.id)
                            }
                            className="text-slate-400 transition hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-slate-200">
                            <button
                              onClick={() =>
                                decreaseQuantity(item.id)
                              }
                              className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="w-8 text-center text-sm font-semibold text-slate-700">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(item.id)
                              }
                              className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-slate-800">
                            Rs.{" "}
                            {(
                              item.price * item.quantity
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t border-slate-200 p-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Subtotal
                </span>

                <span className="font-medium text-slate-700">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Discount
                </span>

                <div className="flex items-center">
                  <span className="mr-2 text-sm text-slate-400">
                    Rs.
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(e.target.value)
                    }
                    className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Tax (5%)
                </span>

                <span className="font-medium text-slate-700">
                  Rs. {tax.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Grand Total
                  </span>

                  <span className="text-2xl font-bold text-blue-600">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Payment Method
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    setPaymentMethod("cash")
                  }
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition ${
                    paymentMethod === "cash"
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Banknote size={19} />
                  Cash
                </button>

                <button
                  onClick={() =>
                    setPaymentMethod("card")
                  }
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard size={19} />
                  Card
                </button>

                <button
                  onClick={() =>
                    setPaymentMethod("split")
                  }
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition ${
                    paymentMethod === "split"
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Split size={19} />
                  Split
                </button>
              </div>
            </div>

            {/* Cash Payment */}
            {paymentMethod === "cash" && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Cash Received
                </label>

                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) =>
                    setCashReceived(e.target.value)
                  }
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-3 flex justify-between">
                  <span className="text-sm text-slate-500">
                    Change
                  </span>

                  <span
                    className={`text-sm font-bold ${
                      Number(cashReceived) >= grandTotal
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    Rs. {change.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Card Payment */}
            {paymentMethod === "card" && (
              <div className="mt-4 rounded-lg bg-purple-50 p-4">
                <div className="flex gap-3">
                  <CreditCard
                    size={20}
                    className="mt-0.5 text-purple-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-purple-800">
                      Card Payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-purple-600">
                      Complete the payment on the card
                      terminal, then confirm successful
                      payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Split Payment */}
            {paymentMethod === "split" && (
              <div className="mt-4 rounded-lg bg-orange-50 p-4">
                <p className="text-sm font-semibold text-orange-800">
                  Split Payment
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-orange-700">
                      Cash
                    </label>

                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-orange-700">
                      Card
                    </label>

                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-orange-600">
                  Payment amounts must exactly equal the
                  grand total.
                </p>
              </div>
            )}

            {/* Checkout */}
            <button
              disabled={!canCheckout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CheckCircle2 size={19} />
              Complete Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POS;