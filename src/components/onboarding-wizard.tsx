import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  User,
  Link2,
  QrCode,
  Smartphone,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

interface OnboardingWizardProps {
  userId?: string;
  hasCompletedProfile?: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingWizard({
  userId,
  hasCompletedProfile = false,
  forceOpen = false,
  onClose,
}: OnboardingWizardProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const markAsSeen = () => {
    try {
      localStorage.setItem("mtc_onboarding_seen", "true");
      if (userId) {
        localStorage.setItem(`mtc_onboarding_seen_${userId}`, "true");
      }
      // Silently persist to Supabase user metadata across all devices
      supabase.auth.updateUser({ data: { onboarding_seen: true } }).catch(() => {});
    } catch {
      // Ignore storage errors in restricted browser modes
    }
  };

  useEffect(() => {
    // If user clicked the "Guide" button manually, always open
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }

    // If the user already has an existing profile (not a brand new registration), never auto-open
    if (hasCompletedProfile) {
      markAsSeen();
      return;
    }

    // Check local storage first (instant check)
    const isSeenLocally =
      localStorage.getItem("mtc_onboarding_seen") === "true" ||
      (userId ? localStorage.getItem(`mtc_onboarding_seen_${userId}`) === "true" : false);

    if (isSeenLocally) {
      return;
    }

    // Also check Supabase user metadata if available
    if (userId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.user_metadata?.onboarding_seen) {
          markAsSeen();
          return;
        }

        // Brand-new first-time user: display once and immediately record as seen
        const timer = setTimeout(() => {
          setOpen(true);
          markAsSeen();
        }, 1000);
        return () => clearTimeout(timer);
      });
    }
  }, [forceOpen, userId, hasCompletedProfile]);

  const handleFinish = () => {
    markAsSeen();
    setOpen(false);
    onClose?.();
  };

  const handleClose = () => {
    markAsSeen();
    setOpen(false);
    onClose?.();
  };

  const steps = [
    {
      icon: Sparkles,
      iconColor: "text-amber-500 bg-amber-500/10",
      badge: "Step 1 of 4",
      title: "Welcome to MyTapCard!",
      subtitle: "Your digital identity, shared in a single tap.",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            MyTapCard replaces outdated paper business cards with a modern, interactive digital
            profile that lives at your custom web link.
          </p>
          <div className="rounded-2xl border border-border bg-secondary/30 p-3.5 flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-foreground/90">
              <span className="font-semibold block">One Link for Everything:</span>
              Share your contact info, social accounts, work portfolio, and payment methods all in
              one place.
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: User,
      iconColor: "text-blue-500 bg-blue-500/10",
      badge: "Step 2 of 4",
      title: "Personalize Your Card",
      subtitle: "Make your digital card unmistakably yours.",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Start by choosing your unique <strong>@username</strong>, adding your display name, and
            uploading a high-res photo.
          </p>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Built-in Photo Cropper:</strong> Rotate, zoom, and frame your avatar with
                ease.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Custom Bio:</strong> Use markdown formatting to highlight your role and
                passions.
              </span>
            </li>
          </ul>
        </div>
      ),
      actionButton: {
        to: "/profile",
        label: "Edit Profile",
      },
    },
    {
      icon: Link2,
      iconColor: "text-purple-500 bg-purple-500/10",
      badge: "Step 3 of 4",
      title: "Add Links & Payments",
      subtitle: "Connect all your channels in seconds.",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Choose from over <strong>70+ native brand icons</strong> to connect your profiles with
            direct action links.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-border bg-card p-2.5">
              <span className="font-semibold block text-foreground">Social & Contact:</span>
              WhatsApp, LinkedIn, Instagram, GitHub, Telegram, Email & Phone.
            </div>
            <div className="rounded-xl border border-border bg-card p-2.5">
              <span className="font-semibold block text-foreground">Payments & Crypto:</span>
              bKash, Nagad, Stripe, PayPal, Bitcoin, Ethereum, USDT.
            </div>
          </div>
        </div>
      ),
      actionButton: {
        to: "/links",
        label: "Add Links",
      },
    },
    {
      icon: Smartphone,
      iconColor: "text-emerald-500 bg-emerald-500/10",
      badge: "Step 4 of 4",
      title: "Tap, Scan & Share!",
      subtitle: "You're ready to share your identity anywhere.",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Sharing your card takes just a second:</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/30 p-2.5">
              <Smartphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">NFC Tap:</strong> Hold your card near an
                iPhone (top) or Android (center) for instant 1-tap open.
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/30 p-2.5">
              <QrCode className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Quick QR:</strong> Open the QR modal from your
                dashboard for in-person scanning without an app.
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const IconComponent = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md max-w-[92vw] p-6">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {currentStep.badge}
            </span>

            {/* Step progress pills */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === step ? "w-6 bg-primary" : "w-1.5 bg-secondary-foreground/20"
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${currentStep.iconColor}`}
            >
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                {currentStep.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {currentStep.subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Body with Slide Animation */}
        <div className="py-2 min-h-[160px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {currentStep.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              className="text-xs gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < steps.length - 1 ? (
              <Button
                type="button"
                variant="hero"
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="text-xs gap-1"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="hero"
                size="sm"
                onClick={handleFinish}
                className="text-xs gap-1"
              >
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
