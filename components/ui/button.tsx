import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent)] text-[var(--color-text-primary)] shadow-sm shadow-black/5 hover:bg-[var(--color-accent-hover)] hover:shadow-[0_20px_40px_-15px_rgba(0,212,164,0.3)] transition-all duration-300",
        destructive:
          "bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-700",
        outline:
          "border border-[var(--color-accent)]/30 bg-transparent text-[var(--color-accent)] shadow-sm shadow-black/5 hover:bg-[var(--color-accent)]/10 hover:border-[var(--color-accent)]/50 transition-all duration-300",
        secondary:
          "bg-white/10 text-white shadow-sm shadow-black/5 hover:bg-white/20",
        ghost: "hover:bg-white/10 hover:text-white text-white/90",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
