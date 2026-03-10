import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Today from "./pages/Today";
import Cars from "./pages/Cars";
import CarLanding from "./pages/CarLanding";
import Leads from "./pages/Leads";
import Tasks from "./pages/Tasks";
import TestDrives from "./pages/TestDrives";
import Ads from "./pages/Ads";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Banners from "./pages/Banners";
import Automation from "./pages/Automation";
import Showroom from "./pages/Showroom";
import AdminGuard from "./admin/AdminGuard";
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminDealers from "./admin/pages/AdminDealers";
import AdminDealerDetail from "./admin/pages/AdminDealerDetail";
import AdminSubscriptions from "./admin/pages/AdminSubscriptions";
import AdminActivity from "./admin/pages/AdminActivity";
import AdminSystem from "./admin/pages/AdminSystem";
import AdminInterestedDealers from "./admin/pages/AdminInterestedDealers";
import AdminApplications from "./admin/pages/AdminApplications";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";
import WebsiteHome from "./pages/website/WebsiteHome";
import WebsiteInventory from "./pages/website/WebsiteInventory";
import WebsiteCar from "./pages/website/WebsiteCar";
import WebsiteCarRedirect from "./pages/website/WebsiteCarRedirect";
import WebsiteAbout from "./pages/website/WebsiteAbout";
import WebsiteFinancing from "./pages/website/WebsiteFinancing";
import WebsiteFavoritesPage from "./pages/website/WebsiteFavoritesPage";
import WebsiteLayout from "./pages/website/WebsiteLayout";
import FrontDoor from "./pages/FrontDoor";
import DemoEntry from "./pages/DemoEntry";
import Affiliates from "./pages/Affiliates";
import AffiliateDashboard from "./pages/AffiliateDashboard";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="animate-pulse text-blue-500 text-xl">MotorIQ</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/car/:id" element={<CarLanding />} />
      <Route path="/showroom/:dealerId" element={<Showroom />} />
      <Route path="/s/:slug" element={<WebsiteLayout />}>
        <Route index element={<WebsiteHome />} />
        <Route path="inventory" element={<WebsiteInventory />} />
        <Route path="inventory/:carSlug" element={<WebsiteCar />} />
        <Route path="car/:carId" element={<WebsiteCarRedirect />} />
        <Route path="about" element={<WebsiteAbout />} />
        <Route path="financing" element={<WebsiteFinancing />} />
        <Route path="favorites" element={<WebsiteFavoritesPage />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <Layout><Today /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cars"
        element={
          <ProtectedRoute>
            <Layout><Cars /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <Layout><Leads /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Layout><Tasks /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-drives"
        element={
          <ProtectedRoute>
            <Layout><TestDrives /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ads"
        element={
          <ProtectedRoute>
            <Layout><Ads /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout><Analytics /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/affiliates"
        element={
          <ProtectedRoute>
            <Layout><Affiliates /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/banners"
        element={
          <ProtectedRoute>
            <Layout><Banners /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/automation"
        element={
          <ProtectedRoute>
            <Layout><Automation /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="interested-dealers" element={<AdminInterestedDealers />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="dealers" element={<AdminDealers />} />
        <Route path="dealers/:id" element={<AdminDealerDetail />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="system" element={<AdminSystem />} />
      </Route>
      <Route path="/demo" element={<DemoEntry />} />
      <Route path="/affiliate/:code" element={<AffiliateDashboard />} />
      <Route path="/" element={<FrontDoor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
