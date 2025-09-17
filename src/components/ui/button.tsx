import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * 🎨 FAST NOW - CENTRALIZED BUTTON DESIGN SYSTEM
 * 
 * ✅ CONSISTENT STYLING RULES:
 * - ALL action buttons use the SAME primary styling (no transparent/muted variants)
 * - ALL action buttons maintain consistent heights (h-12 for main actions)
 * - NO manual className overrides for colors - use proper variants
 * 
 * 📋 USAGE GUIDELINES:
 * 
 * 🔸 MAIN ACTIONS (Start, Add, Save):
 *   variant="action-primary" size="action-main"
 * 
 * 🔸 SECONDARY ACTIONS (Pause, Cancel, Stop):
 *   variant="action-secondary" size="action-secondary" 
 *   (Same styling as primary - maintains consistency)
 * 
 * 🔸 GRID LAYOUTS (Food Tracking buttons):
 *   variant="action-primary" size="action-tall"
 * 
 * 🔸 COMPACT SPACES:
 *   variant="action-compact" size="action-compact"
 * 
 * ❌ AVOID: ghost, outline with manual bg-muted classes
 * ❌ AVOID: Manual className color overrides
 * ✅ USE: Standardized action-* variants only
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border-none",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-none",
        outline:
          "border border-subtle bg-background hover:bg-muted hover:text-muted-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-none",
        ghost: "hover:bg-muted hover:text-muted-foreground border-none",
        link: "text-primary underline-offset-4 hover:underline border-none",
        neutral: "bg-muted text-muted-foreground hover:bg-muted/80 border-none",
        // 🎨 STANDARDIZED ACTION BUTTON SYSTEM - USE THESE FOR CONSISTENCY
        // ✅ PRIMARY ACTIONS: Main user actions (Start, Add, Save, etc.)
        "action-primary": "bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium border-none",
        // ✅ SECONDARY ACTIONS: Supporting actions (Pause, Cancel, etc.) - SAME STYLING AS PRIMARY
        "action-secondary": "bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium border-none",
        // ✅ COMPACT ACTIONS: Smaller buttons with same primary styling
        "action-compact": "bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium border-none",
        // ✅ AI ACTIONS: Special AI-related buttons (Generate AI Image, Voice Input, etc.) - Now using primary
        "ai": "bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium border-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // 📏 STANDARDIZED ACTION BUTTON SIZES - CONSISTENT HEIGHTS
        // ✅ MAIN ACTIONS: Large buttons for primary actions (h-12)
        "action-main": "h-12 px-6 py-3",
        // ✅ SECONDARY ACTIONS: Same height as main for consistency (h-12)
        "action-secondary": "h-12 px-4 py-3", 
        // ✅ COMPACT ACTIONS: Smaller for tight spaces (h-10)
        "action-compact": "h-10 px-4 py-2",
        // ✅ TALL ACTIONS: Full-height buttons for grid layouts (h-12)
        "action-tall": "h-12 px-4 py-3",
        // ✅ START BUTTONS: Extra large buttons for Start Fast/Walking (h-16)
        "start-button": "h-16 px-8 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
