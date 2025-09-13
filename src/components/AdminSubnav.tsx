import { NavLink, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { label: "OPS", to: "/admin/operations" },
  { label: "Content", to: "/admin/content" },
  { label: "AI", to: "/admin/ai" },
  { label: "Brand", to: "/admin/branding" },
  { label: "Pay", to: "/admin/payments" },
  { label: "Dev", to: "/admin/dev" },
];

export function AdminSubnav() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
                "whitespace-nowrap h-8 px-3 text-xs flex-shrink-0"
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
