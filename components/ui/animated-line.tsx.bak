import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedLineProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  duration?: number;
}

const AnimatedLine = React.forwardRef<HTMLDivElement, AnimatedLineProps>(
  ({ color = "currentColor", duration = 1.5, className, ...props }, ref) => {
    const pathVariants: Variants = {
      hidden: {
        pathLength: 0,
        opacity: 0,
      },
      visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
          duration: duration,
          ease: "easeInOut",
        },
      },
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center mt-4", className)}
        {...props}
      >
        <motion.svg
          width="300"
          height="30"
          viewBox="0 0 300 30"
          className="text-[#00D4A4]"
        >
          <motion.path
            d="M 0,15 Q 75,5 150,15 Q 225,25 300,15"
            stroke={color}
            strokeWidth="3"
            fill="none"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
        </motion.svg>
      </div>
    );
  }
);

AnimatedLine.displayName = "AnimatedLine";

export { AnimatedLine };
