import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Store,
  Loader2,
  ArrowRight,
  BarChart3,
  Boxes,
  CreditCard,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  Menu,
  X,
  Package,
  Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        setError(
          error.response.data?.detail ||
            "Invalid email or password."
        );
      } else if (error.request) {
        setError(
          "Unable to connect to the server. Please make sure FastAPI is running."
        );
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const openLogin = () => {
    setShowLogin(true);
    setMobileMenu(false);
    setError("");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* =========================================
          BACKGROUND EFFECTS
      ========================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* =========================================
          NAVBAR
      ========================================= */}

      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}

          <button
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <Store size={21} />
            </div>

            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight">
                RetailPOS
              </h1>

              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Point of Sale
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Home
            </a>

            <a
              href="#features"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              About
            </a>
          </nav>

          {/* Desktop Login */}

          <button
            onClick={openLogin}
            className="hidden items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-5 py-2.5 text-sm font-semibold text-blue-300 transition hover:border-blue-400 hover:bg-blue-500/20 hover:text-white md:flex"
          >
            Sign In
            <ArrowRight size={16} />
          </button>

          {/* Mobile Menu */}

          <button
            onClick={() =>
              setMobileMenu((previous) => !previous)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 md:hidden"
          >
            {mobileMenu ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}

        {mobileMenu && (
          <div className="border-t border-slate-800 bg-slate-950 px-5 py-5 md:hidden">
            <div className="space-y-1">
              <a
                href="#home"
                onClick={() => setMobileMenu(false)}
                className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-900"
              >
                Home
              </a>

              <a
                href="#features"
                onClick={() => setMobileMenu(false)}
                className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-900"
              >
                Features
              </a>

              <a
                href="#about"
                onClick={() => setMobileMenu(false)}
                className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-900"
              >
                About
              </a>

              <button
                onClick={openLogin}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Sign In
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================
          HERO
      ========================================= */}

      <main
        id="home"
        className="relative z-10"
      >
        <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center justify-center px-5 py-20 lg:px-8 lg:py-24">
          <div className="w-full max-w-4xl text-center">
            {/* Badge */}

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              Smart Retail Management
            </div>

            {/* Main Heading */}

            <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
              Run your store
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                smarter & faster.
              </span>
            </h2>

            {/* Description */}

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              A modern point-of-sale platform for managing
              sales, products, inventory and business
              operations from one powerful system.
            </p>

            {/* Hero Buttons */}

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={openLogin}
                className="group flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Access POS Dashboard

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <a
                href="#features"
                className="flex min-w-[170px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
              >
                Explore Features
              </a>
            </div>

            {/* Trust Points */}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
              <TrustPoint text="Inventory Management" />
              <TrustPoint text="Sales Tracking" />
              <TrustPoint text="Secure Access" />
            </div>

            {/* Product Preview */}

            <div
              id="features"
              className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <PreviewStat
                icon={BarChart3}
                label="Sales"
                value="Real-time"
                iconClass="bg-blue-500/10 text-blue-400"
              />

              <PreviewStat
                icon={Boxes}
                label="Inventory"
                value="Tracked"
                iconClass="bg-cyan-500/10 text-cyan-400"
              />

              <PreviewStat
                icon={CreditCard}
                label="Payments"
                value="Secure"
                iconClass="bg-indigo-500/10 text-indigo-400"
              />

              <PreviewStat
                icon={TrendingUp}
                label="Business"
                value="Growing"
                iconClass="bg-emerald-500/10 text-emerald-400"
              />
            </div>
          </div>
        </section>

        {/* =========================================
            ABOUT / CTA
        ========================================= */}

        <section
          id="about"
          className="mx-auto max-w-7xl px-5 py-20 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl sm:p-12">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative grid items-center gap-8 text-center lg:grid-cols-2 lg:text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Built for modern retail
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  One system.
                  <span className="block text-slate-400">
                    Complete control.
                  </span>
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 lg:mx-0">
                  RetailPOS brings your daily sales, products,
                  inventory and operational data together in one
                  centralized platform.
                </p>

                <button
                  onClick={openLogin}
                  className="mx-auto mt-7 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 lg:mx-0"
                >
                  Get Started
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoCard
                  icon={Package}
                  title="Products"
                  value="Centralized"
                />

                <InfoCard
                  icon={Receipt}
                  title="Sales"
                  value="Real-time"
                />

                <InfoCard
                  icon={Boxes}
                  title="Inventory"
                  value="Tracked"
                />

                <InfoCard
                  icon={ShieldCheck}
                  title="Security"
                  value="Protected"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================
          FOOTER
      ========================================= */}

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-7 text-center sm:flex-row sm:justify-between sm:text-left lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Store size={16} />
            </div>

            <span className="text-sm font-semibold text-slate-300">
              RetailPOS
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Secure Point of Sale Management System
          </p>
        </div>
      </footer>

      {/* =========================================
          LOGIN MODAL
      ========================================= */}

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md">
            {/* Close */}

            <button
              onClick={() => setShowLogin(false)}
              className="absolute -right-1 -top-12 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white sm:-right-12 sm:top-0"
              aria-label="Close login"
            >
              <X size={19} />
            </button>

            {/* Login Card */}

            <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
              {/* Card Top */}

              <div className="border-b border-slate-800 bg-slate-950/70 px-7 py-7 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                  <Store size={27} />
                </div>

                <h2 className="mt-4 text-2xl font-bold text-white">
                  Welcome back
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Sign in to your RetailPOS dashboard.
                </p>
              </div>

              <div className="p-7">
                {/* Error */}

                {error && (
                  <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Email */}

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@retailpos.com"
                        autoComplete="email"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Password */}

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />

                      <input
                        id="password"
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-10 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (previous) => !previous
                          )
                        }
                        disabled={loading}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign In */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                {/* Security */}

                <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-800 pt-5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                  <ShieldCheck size={13} />
                  Secure authenticated access
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================
   TRUST POINT
========================================= */

function TrustPoint({ text }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <CheckCircle2
        size={14}
        className="text-emerald-400"
      />
      {text}
    </div>
  );
}

/* =========================================
   PREVIEW STAT
========================================= */

function PreviewStat({
  icon: Icon,
  label,
  value,
  iconClass,
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left">
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon size={15} />
      </div>

      <p className="text-[9px] text-slate-600">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}

/* =========================================
   PREVIEW BAR
========================================= */

function PreviewBar({ height }) {
  return (
    <div
      className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 opacity-80"
      style={{ height }}
    />
  );
}

/* =========================================
   FEATURE CARD
========================================= */

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconClass,
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={21} />
      </div>

      <h3 className="mt-5 text-base font-bold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================
   INFO CARD
========================================= */

function InfoCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <Icon
        size={19}
        className="text-blue-400"
      />

      <p className="mt-4 text-xs text-slate-600">
        {title}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}

export default Login;