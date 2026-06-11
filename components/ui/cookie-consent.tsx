"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CookieIcon, ChevronRight, Lock, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCookieDialog } from "@/lib/cookie-context";

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  isEssential?: boolean;
}

interface CookieConsentProps {
  className?: string;
  categories?: CookieCategory[];
  cookiePolicyUrl?: string;
  onAccept?: (preferences: boolean[]) => void;
  onDecline?: () => void;
  onOpenCustomize?: () => void;
}

const DEFAULT_COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: "essential",
    name: "Essential Cookies",
    description: "Required for core website functionality, such as navigation and security.",
    isEssential: true,
  },
  {
    id: "analytics",
    name: "Analytics Cookies",
    description: "Track anonymous usage to improve our services.",
  },
];

const STORAGE_KEY = "cookie_preferences";
const CONSENT_KEY = "cookie_consent_given";

function CookieConsent({
  className,
  categories = DEFAULT_COOKIE_CATEGORIES,
  cookiePolicyUrl = "/cookies",
  onAccept,
  onDecline,
  onOpenCustomize,
}: CookieConsentProps) {
  const [mounted, setMounted] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);
  const [showCustomizeDialog, setShowCustomizeDialog] = React.useState(false);
  const { isCustomizeDialogOpen, closeCustomizeDialog } = useCookieDialog();
  const [preferences, setPreferences] = React.useState<boolean[]>(() =>
    categories.map(cat => !!cat.isEssential)
  );

  React.useEffect(() => {
    setMounted(true);

    try {
      const consentGiven = localStorage.getItem(CONSENT_KEY) === "true";
      const storedPrefs = localStorage.getItem(STORAGE_KEY);

      if (consentGiven && storedPrefs) {
        const parsedPrefs = JSON.parse(storedPrefs) as boolean[];
        if (Array.isArray(parsedPrefs) && parsedPrefs.length === categories.length) {
          setPreferences(parsedPrefs);
          onAccept?.(parsedPrefs);
          return;
        }
      }

      setShowBanner(true);
    } catch (error) {
      console.error("Error reading cookie preferences:", error);
      setShowBanner(true);
    }
  }, [categories.length, onAccept]);

  const savePreferences = React.useCallback((prefs: boolean[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      localStorage.setItem(CONSENT_KEY, "true");
      console.log("✅ Cookie preferences saved:", prefs);
    } catch (error) {
      console.error("Error saving cookie preferences:", error);
    }

    setShowBanner(false);
    setShowCustomizeDialog(false);
    setPreferences(prefs);
    onAccept?.(prefs);
  }, [onAccept]);

  const handleAcceptAll = React.useCallback(() => {
    const allTrue = categories.map(() => true);
    setPreferences(allTrue);
    savePreferences(allTrue);
  }, [categories, savePreferences]);

  const handleRejectAll = React.useCallback(() => {
    const essentialOnly = categories.map(cat => !!cat.isEssential);
    setPreferences(essentialOnly);
    savePreferences(essentialOnly);
    onDecline?.();
  }, [categories, savePreferences, onDecline]);

  const handleSaveCustom = React.useCallback(() => {
    savePreferences(preferences);
  }, [preferences, savePreferences]);

  const handleToggle = React.useCallback((index: number, checked: boolean) => {
    if (categories[index]?.isEssential) return;

    setPreferences(prev => {
      const newPrefs = [...prev];
      newPrefs[index] = checked;
      return newPrefs;
    });
  }, [categories]);

  const openCustomizeDialog = React.useCallback(() => {
    setShowCustomizeDialog(true);
    onOpenCustomize?.();
  }, [onOpenCustomize]);

  if (!mounted) return null;

  return (
    <>
      <CookieBanner
        isVisible={showBanner}
        onAcceptAll={handleAcceptAll}
        onCustomize={openCustomizeDialog}
        cookiePolicyUrl={cookiePolicyUrl}
        className={className}
      />

      <CookieCustomizeDialog
        open={showCustomizeDialog || isCustomizeDialogOpen}
        onOpenChange={(open) => {
          setShowCustomizeDialog(open);
          if (!open) closeCustomizeDialog();
        }}
        categories={categories}
        preferences={preferences}
        onToggle={handleToggle}
        onSave={handleSaveCustom}
        onRejectAll={handleRejectAll}
      />
    </>
  );
}

interface CookieBannerProps {
  isVisible: boolean;
  onAcceptAll: () => void;
  onCustomize: () => void;
  cookiePolicyUrl: string;
  className?: string;
}

function CookieBanner({
  isVisible,
  onAcceptAll,
  onCustomize,
  cookiePolicyUrl,
  className,
}: CookieBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "fixed bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 z-50 w-full sm:max-w-md",
            className
          )}
        >
          <div className="m-3 bg-[#F8FAFC] border border-[#C8D8E6] rounded-xl shadow-lg">
            <div className="flex items-center gap-3 p-6 pb-4">
              <div className="bg-[#E0F7F2] p-2 rounded-lg">
                <CookieIcon className="h-5 w-5 text-[#0D1F2D]" />
              </div>
              <h2 className="text-lg font-semibold text-[#0D1F2D]">Cookie Preferences</h2>
            </div>
            <div className="px-6 pb-4">
              <p className="text-sm text-[#4A6880] leading-relaxed mb-4">
                We use cookies to enhance your experience, personalize content, and analyze traffic.
              </p>
              <Link
                href={cookiePolicyUrl}
                className="text-xs inline-flex items-center text-[#0D1F2D] hover:underline group font-medium transition-colors"
              >
                Cookie Policy
                <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="p-4 flex flex-col sm:flex-row gap-3 border-t border-[#E2EAF1] bg-[#F1F5F9]">
              <Button
                onClick={onAcceptAll}
                size="sm"
                className="w-full sm:flex-1 h-9 rounded-lg text-sm bg-[#00D4A4] text-[#0D1F2D] hover:bg-[#00A882] transition-all hover:shadow-md font-semibold"
              >
                Accept All
              </Button>
              <Button
                onClick={onCustomize}
                size="sm"
                variant="outline"
                className="w-full sm:flex-1 h-9 rounded-lg text-sm border-[#C8D8E6] text-[#0D1F2D] hover:bg-[#F1F5F9] transition-all hover:shadow-md"
              >
                Customize
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getCategoryIcon(index: number) {
  const icons = [
    <Lock key="lock" className="h-4 w-4 text-[#0D1F2D]" />,
    <BarChart3 key="chart" className="h-4 w-4 text-[#0D1F2D]" />,
  ];
  return icons[index] || <CookieIcon className="h-4 w-4 text-[#0D1F2D]" />;
}

interface CookieCustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CookieCategory[];
  preferences: boolean[];
  onToggle: (index: number, checked: boolean) => void;
  onSave: () => void;
  onRejectAll: () => void;
}

function CookieCustomizeDialog({
  open,
  onOpenChange,
  categories,
  preferences,
  onToggle,
  onSave,
  onRejectAll,
}: CookieCustomizeDialogProps) {
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);

  const handleSaveClick = () => {
    onSave();
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#F8FAFC] z-[200] sm:max-w-[500px] p-0 gap-0 border-[#C8D8E6] shadow-xl">
        <DialogHeader className="p-6 pb-4 border-b border-[#E2EAF1]">
          <DialogTitle className="text-xl font-semibold text-[#0D1F2D]">Manage Cookies</DialogTitle>
          <DialogDescription className="text-[#4A6880]">
            Customize your cookie preferences below.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-6 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={cn(
                "p-4 border rounded-xl transition-all duration-200",
                preferences[index]
                  ? "border-[#00D4A4]/50 bg-[#E0F7F2] shadow-sm"
                  : "border-[#E2EAF1] hover:border-[#C8D8E6]"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    preferences[index] ? "bg-[#E0F7F2]" : "bg-[#F1F5F9]"
                  )}>
                    {category.icon || getCategoryIcon(index)}
                  </div>
                  <Label
                    htmlFor={`cookie-${index}`}
                    className="font-semibold text-base cursor-pointer text-[#0D1F2D]"
                  >
                    {category.name}
                    {category.isEssential && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#E0F7F2] text-[#00A882]">
                              Required
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">These cookies cannot be disabled.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Label>
                </div>
                <Switch
                  id={`cookie-${index}`}
                  checked={preferences[index] || false}
                  onCheckedChange={(checked) => onToggle(index, checked)}
                  disabled={category.isEssential}
                />
              </div>
              <p className="text-sm mt-3 text-[#4A6880] leading-relaxed">
                {category.description}
              </p>
            </motion.div>
          ))}
        </div>
        <DialogFooter className="p-6 border-t border-[#E2EAF1] bg-[#F1F5F9]">
          <div className="flex w-full flex-col-reverse sm:flex-row sm:justify-between gap-3 items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onRejectAll}
                className="min-w-[120px] border-[#C8D8E6] text-[#0D1F2D] hover:bg-[#E8EFF5] transition-all hover:shadow-md"
              >
                Reject All
              </Button>
              <Button
                onClick={handleSaveClick}
                className="min-w-[140px] bg-[#00D4A4] text-[#0D1F2D] hover:bg-[#00A882] transition-all hover:shadow-md font-semibold"
              >
                {showSaveSuccess ? "✓ Saved" : "Save Preferences"}
              </Button>
            </div>
            {showSaveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-sm text-[#22C55E] font-medium"
              >
                Preferences saved successfully
              </motion.div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CookieConsent };
export type { CookieCategory, CookieConsentProps };
