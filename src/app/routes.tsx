import { Navigate, createBrowserRouter } from "react-router";
import AppLayout from "../components/AppLayout";
import Dashboard from "../pages/Dashboard";
import Analytics from "../pages/Analytics";
import Stations from "../pages/Stations";
import UnstructuredAnalysis from "../pages/UnstructuredAnalysis";
import DataManagement from "../pages/DataManagement";
import Methodology from "../pages/Methodology";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", Component: Dashboard },
      { path: "analytics", Component: Analytics },
      { path: "stations", Component: Stations },
      { path: "unstructured", Component: UnstructuredAnalysis },
      { path: "data-management", Component: DataManagement },
      { path: "methodology", Component: Methodology },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
