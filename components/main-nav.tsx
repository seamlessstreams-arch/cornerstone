"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Manager" },
  { href: "/staff/dashboard", label: "Staff" },
  { href: "/daily-logs", label: "Handover" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/tasks", label: "Tasks" },
  { href: "/incidents", label: "Incidents" },
  { href: "/oversight", label: "Oversight" },
  { href: "/aria", label: "Aria" },
];

function isActivePath(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === "/dashboard" || href === "/staff/dashboard") {
    return pathname.startsWith(href + "/");
  }

  return pathname.startsWith(href);
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded bg-slate-900 px-3 py-2 text-white"
                : "rounded px-3 py-2 hover:bg-slate-100"
            }
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
      <AuthNav />
    </nav>
  );
}
