import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";

import POS from "./pages/POS";
import Items from "./pages/Items";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================
            DEFAULT ROUTE
        ========================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =========================
            PROTECTED ROUTES
        ========================== */}

        <Route element={<ProtectedRoute />}>

          <Route element={<DashboardLayout />}>

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* POS */}
            <Route
              path="/pos"
              element={<POS />}
            />

            {/* Items */}
            <Route
              path="/items"
              element={<Items />}
            />

            {/* Inventory */}
            <Route
              path="/inventory"
              element={<Inventory />}
            />

            {/* Sales */}
            <Route
              path="/sales"
              element={<Sales />}
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={<Reports />}
            />

            {/* Users */}
            <Route
              path="/users"
              element={<Users />}
            />

            {/* Audit Logs */}
            <Route
              path="/audit"
              element={<AuditLogs />}
            />

          </Route>

        </Route>

        {/* =========================
            UNKNOWN ROUTES
        ========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;