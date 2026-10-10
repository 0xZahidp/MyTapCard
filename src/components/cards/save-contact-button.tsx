import { useState } from "react";
import { UserPlus, Share2, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadVCard, type VCardContact } from "@/lib/vcard";

interface SaveContactActionsProps {
  contact: VCardContact;
  accentStyle?: React.CSSProperties;
  btnRadius?: string;
  className?: string;
}

export function SaveContactActions({
  contact,
  accentStyle,
  btnRadius = "rounded-xl",
  className = "",
}: SaveContactActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleSaveContact = () => {
    downloadVCard(contact);
    toast.success("Contact file downloaded", {
      description: "Open the file to save directly into your phone contacts.",
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `${contact.name} — MyTapCard`,
      text: contact.bio || `Check out ${contact.name}'s digital card on MyTapCard`,
      url: contact.url || window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const url = contact.url || window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Card link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleSaveContact}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold text-sm text-white shadow-soft transition-smooth hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] ${btnRadius}`}
        style={accentStyle}
      >
        <UserPlus className="h-4 w-4 shrink-0" />
        <span>Save Contact</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        className={`flex items-center justify-center p-3 font-semibold text-sm bg-card text-foreground border border-border shadow-soft transition-smooth hover:bg-secondary/70 active:scale-95 ${btnRadius}`}
        title="Share Profile"
        aria-label="Share profile"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
