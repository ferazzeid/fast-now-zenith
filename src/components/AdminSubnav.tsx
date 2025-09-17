import { NavLink, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { label: "Data", to: "/admin/data" },
  { label: "OPS", to: "/admin/operations" },
  { label: "Content", to: "/admin/content" },
  { label: "AI", to: "/admin/ai" },
  { label: "Func", to: "/admin/functions" },
  { label: "Brand", to: "/admin/branding" },
  { label: "Pay", to: "/admin/payments" },
  { label: "Anim", to: "/admin/animations" },
];

export function AdminSubnav() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-b-subtle">
      <div className="container mx-auto px-4 py-2 flex justify-start gap-1">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
            className={cn(
              buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" }),
              "whitespace-nowrap h-6 px-1.5 text-[10px] font-medium flex-shrink-0",
              isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
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
