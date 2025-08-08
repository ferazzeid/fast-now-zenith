import { NavLink, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { label: "Operations", to: "/admin/operations" },
  { label: "Content", to: "/admin/content" },
  { label: "Branding & SEO", to: "/admin/branding" },
  { label: "Payments", to: "/admin/payments" },
];

export function AdminSubnav() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                buttonVariants({ variant: isActive ? "default" : "secondary", size: "sm" }),
                "whitespace-nowrap"
              )}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
