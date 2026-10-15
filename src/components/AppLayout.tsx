import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  Database,
  Gauge,
  Menu,
  RadioTower,
  Search,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge, Button } from "./ui";

const navigation = [
  { to: "/dashboard", label: "Overview", icon: Gauge },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/stations", label: "Stations", icon: RadioTower },
  { to: "/unstructured", label: "Unstructured & Graph", icon: Share2 },
  { to: "/data-management", label: "Data management", icon: Database },
  { to: "/methodology", label: "Methodology", icon: ShieldCheck },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const current = navigation.find((item) => location.pathname.startsWith(item.to))?.label ?? "AirScope";

  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={20} /></div>
          <div className="brand-copy">
            <strong>AirScope</strong>
            <span>Environmental intelligence</span>
          </div>
          <Button className="mobile-close" variant="ghost" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={19} />
          </Button>
        </div>
        <nav aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="source-card">
            <span className="source-icon" style={{ color: "#2dd4bf", background: "rgba(45, 212, 191, 0.1)" }}>
              <Database size={16} />
            </span>
            <div>
              <strong>Neo4j Aura</strong>
              <span>88.3k records</span>
            </div>
            <i style={{ background: "#2dd4bf" }} />
          </div>
          <Button variant="ghost" className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <ChevronLeft size={17} />
            <span>Collapse sidebar</span>
          </Button>
        </div>
      </aside>
      {mobileOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-title">
            <Button variant="ghost" className="menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </Button>
            <span>{current}</span>
          </div>
          <div className="topbar-tools">
            <div className="search-box">
              <Search size={16} />
              <input aria-label="Search" placeholder="Search stations or cities" />
              <kbd>⌘ K</kbd>
            </div>
            <Badge tone="success">Neo4j Live</Badge>
            <div className="avatar" aria-label="Project profile">AS</div>
          </div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
