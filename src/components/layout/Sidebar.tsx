"use client";

import { useState } from "react";
import Link from "next/link";
  import { usePathname } from "next/navigation";
  import { useTheme } from "next-themes";
  import {
    LayoutDashboard,
    Wallet,
    TrendingUp,
    Settings,
    LogOut,
    Menu,
    X,
    Receipt,
    PieChart,
    Target,
    Download,
    Bell,
    User,
    ChevronDown,
    CreditCard,
    Sun,
    Moon,
  } from "lucide-react";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  onLogout?: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Overview & summary",
    },
    {
      name: "M-PESA",
      icon: Wallet,
      description: "Transaction management",
      children: [
        { name: "Transactions", href: "/dashboard/mpesa", icon: Receipt },
        { name: "Analytics", href: "/dashboard/mpesa/analytics", icon: PieChart },
        { name: "Budgets", href: "/dashboard/mpesa/budgets", icon: Target },
        { name: "Export", href: "/dashboard/mpesa/export", icon: Download },
      ],
    },
    {
      name: "Investments",
      href: "/dashboard/investments",
      icon: TrendingUp,
      description: "Track your investments",
    },
    {
      name: "Cards",
      href: "/dashboard/cards",
      icon: CreditCard,
      description: "Manage your cards",
    },
  ];

  const bottomNavigation = [
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: 3 },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-72"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nexus
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Financial Hub
                  </p>
                </div>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {collapsed ? <ChevronDown className="w-5 h-5 rotate-90" /> : <X className="w-5 h-5" />}
            </button>
          </div>

          {/* User Profile */}
          {!collapsed && user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <NavItemWithChildren
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive}
                  />
                ) : (
                  <NavItem
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive(item.href || "")}
                  />
                )}
              </div>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                text-gray-600 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-all duration-200
                ${collapsed ? "justify-center" : ""}
              `}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Moon className="w-5 h-5 flex-shrink-0" />
              )}
              {!collapsed && <span className="text-sm font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </button>

            {bottomNavigation.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                collapsed={collapsed}
                isActive={isActive(item.href)}
              />
            ))}
            
            {/* Logout */}
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg
                text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20
                transition-all duration-200
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  item,
  collapsed,
  isActive,
}: {
  item: any;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
        ${collapsed ? "justify-center" : ""}
        ${
          isActive
            ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      `}
      title={collapsed ? item.name : undefined}
    >
      <div className="relative">
        <Icon className="w-5 h-5 flex-shrink-0" />
        {item.badge && typeof item.badge === "number" && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </div>
      {!collapsed && (
        <div className="flex-1 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            {item.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            )}
          </div>
          {item.badge && typeof item.badge === "string" && (
            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
              {item.badge}
            </span>
          )}
          {item.badge && typeof item.badge === "number" && (
            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function NavItemWithChildren({
  item,
  collapsed,
  isActive,
}: {
  item: any;
  collapsed: boolean;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  const anyChildActive = item.children.some((child: any) => isActive(child.href));

  if (collapsed) {
    return (
      <div className="relative group">
        <div
          className={`
            flex items-center justify-center px-3 py-2 rounded-lg cursor-pointer
            ${
              anyChildActive
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </div>
            {item.children.map((child: any) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 transition-colors
                    ${
                      isActive(child.href)
                        ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <ChildIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{child.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
          ${
            anyChildActive
              ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }
        `}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {item.description}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children.map((child: any) => {
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.name}
                href={child.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${
                    isActive(child.href)
                      ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{child.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

