"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CookieIcon, ChevronRight } from "lucide-react";
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
  {
    id: "marketing",
    name: "Marketing Cookies",
    description: "Enable personalized ads across websites.",
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
          <div className="m-3 bg-[#121218] border border-[#A0A0A0]/30 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 p-6 pb-4">
              <div className="bg-[#D4934E]/10 p-2 rounded-lg">
                <CookieIcon className="h-5 w-5 text-[#D4934E]" />
              </div>
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Cookie Preferences</h2>
            </div>
            <div className="px-6 pb-4">
              <p className="text-sm text-[#A0A0A0] leading-relaxed mb-4">
                We use cookies to enhance your experience, personalize content, and analyze traffic.
              </p>
              <Link
                href={cookiePolicyUrl}
                className="text-xs inline-flex items-center text-[#D4934E] hover:underline group font-medium transition-colors"
              >
                Cookie Policy
                <ChevronRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="p-4 flex flex-col sm:flex-row gap-3 border-t border-[#A0A0A0]/30 bg-[#0A0A0A]">
              <Button
                onClick={onAcceptAll}
                size="sm"
                className="w-full sm:flex-1 h-9 rounded-lg text-sm bg-[#D4934E] text-white hover:bg-[#D4934E]/90 transition-all hover:shadow-md"
              >
                Accept All
              </Button>
              <Button
                onClick={onCustomize}
                size="sm"
                variant="outline"
                className="w-full sm:flex-1 h-9 rounded-lg text-sm border-[#A0A0A0]/50 text-[#F5F5F5] hover:bg-[#1A1A20] transition-all hover:shadow-md"
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
      <DialogContent className="bg-[#121218] z-[200] sm:max-w-[500px] p-0 gap-0 border-[#A0A0A0]/30 shadow-xl">
        <DialogHeader className="p-6 pb-4 border-b border-[#A0A0A0]/30">
          <DialogTitle className="text-xl font-semibold text-[#F5F5F5]">Manage Cookies</DialogTitle>
          <DialogDescription className="text-[#A0A0A0]">
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
                  ? "border-[#D4934E]/50 bg-[#D4934E]/10 shadow-sm"
                  : "border-[#A0A0A0]/30 hover:border-[#A0A0A0]/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    preferences[index] ? "bg-[#D4934E]/20" : "bg-[#A0A0A0]/10"
                  )}>
                    {category.icon || <CookieIcon className="h-4 w-4 text-[#D4934E]" />}
                  </div>
                  <Label
                    htmlFor={`cookie-${index}`}
                    className="font-semibold text-base cursor-pointer text-[#F5F5F5]"
                  >
                    {category.name}
                    {category.isEssential && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#D4934E]/20 text-[#D4934E]">
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
              <p className="text-sm mt-3 text-[#A0A0A0] leading-relaxed">
                {category.description}
              </p>
            </motion.div>
          ))}
        </div>
        <DialogFooter className="p-6 border-t border-[#A0A0A0]/30 bg-[#0A0A0A]">
          <div className="flex w-full flex-col-reverse sm:flex-row sm:justify-between gap-3 items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onRejectAll}
                className="min-w-[120px] border-[#A0A0A0]/50 text-[#F5F5F5] hover:bg-[#1A1A20] transition-all hover:shadow-md"
              >
                Reject All
              </Button>
              <Button
                onClick={handleSaveClick}
                className="min-w-[140px] bg-[#D4934E] text-white hover:bg-[#D4934E]/90 transition-all hover:shadow-md"
              >
                {showSaveSuccess ? "✓ Saved" : "Save Preferences"}
              </Button>
            </div>
            {showSaveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-sm text-[#10B981] font-medium"
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
