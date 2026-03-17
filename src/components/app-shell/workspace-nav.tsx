"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceNavItem = {
  href: string;
  label: string;
};

const workspaceNavItems: WorkspaceNavItem[] = [
  { href: "/clients", label: "Clients" },
  { href: "/service-packages", label: "Service Packages" },
  { href: "/quotes", label: "Quotes" },
  { href: "/invoices", label: "Invoices" },
  { href: "/settings", label: "Settings & Defaults" },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace sections" className="border-b border-zinc-200 bg-zinc-50">
      <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-2 py-2 sm:px-6">
        {workspaceNavItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
