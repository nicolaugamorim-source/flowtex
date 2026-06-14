"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Type definition for a single integration item.
 */
export interface Integration {
  name: string;
  description: string;
  iconSrc: string;
}

/**
 * Props for the IntegrationShowcase component.
 */
export interface IntegrationShowcaseProps {
  title: string;
  subtitle?: string;
  illustrationSrc?: string;
  illustrationAlt?: string;
  integrations: Integration[];
  className?: string;
  onIntegrationClick?: (name: string) => void;
  renderCustomCard?: (integration: Integration) => React.ReactNode;
}

// Function to parse the title and wrap the highlighted word in a span
const HighlightedTitle = ({ text }: { text: string }) => {
  const parts = text.split(/~/);
  return (
    <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#0D1F2D]">
      {parts.map((part, index) =>
        index === 1 ? (
          <span key={index} className="underline decoration-[#00D4A4] decoration-8 underline-offset-8">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </h2>
  );
};

export const IntegrationShowcase = React.forwardRef<
  HTMLElement,
  IntegrationShowcaseProps
>(({ title, subtitle, illustrationSrc, illustrationAlt, integrations, className, onIntegrationClick, renderCustomCard }, ref) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section ref={ref} className={cn('w-full py-32 sm:py-40', className)}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className={illustrationSrc ? "grid grid-cols-1 items-start gap-x-12 gap-y-10 lg:grid-cols-2" : "text-center mb-32"}>
          <div className={illustrationSrc ? "max-w-xl" : "mx-auto"}>
            <HighlightedTitle text={title} />
            {subtitle && (
              <p className="mt-4 text-lg text-[#4A6880] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {illustrationSrc && (
            <div className="flex items-center justify-center lg:justify-center">
              <img
                src={illustrationSrc}
                alt={illustrationAlt}
                className="w-64 h-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Integrations Grid */}
        <motion.div
          className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {integrations.map((item) => {
            // Check if there's a custom renderer for this integration
            if (renderCustomCard) {
              const customCard = renderCustomCard(item);
              if (customCard) {
                return customCard;
              }
            }

            const isClickable = item.name !== 'More Coming';
            return (
              <motion.div
                key={item.name}
                variants={itemVariants}
                onClick={() => isClickable && onIntegrationClick?.(item.name)}
                className={`group flex items-start space-x-4 p-4 rounded-lg transition-colors duration-300 ${
                  isClickable
                    ? 'cursor-pointer hover:bg-[#F8FAFC] hover:shadow-md'
                    : 'opacity-75'
                }`}
              >
                <div className="flex-shrink-0 p-3 bg-[#F8FAFC] rounded-lg group-hover:bg-[#00D4A4]/10 transition-colors duration-300">
                  <img
                    src={item.iconSrc}
                    alt={`${item.name} logo`}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0D1F2D]">{item.name}</h3>
                  <p className="mt-1.5 text-sm text-[#4A6880]">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
});

IntegrationShowcase.displayName = 'IntegrationShowcase';
