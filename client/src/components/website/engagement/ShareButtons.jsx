import { useState } from "react";
import { MessageCircle, Facebook, Twitter, Link2, Share2 } from "lucide-react";

export default function ShareButtons({ url, title, text }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareTitle = title || "";
  const shareText = text || title || "";

  function handleCopy() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const canNativeShare = typeof navigator !== "undefined" && navigator.share;
  const waText = encodeURIComponent(shareText && shareUrl ? `${shareText} ${shareUrl}` : shareUrl);
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400 mr-1">Share:</span>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 text-sm"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
        Facebook
      </a>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
        aria-label="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
        Twitter
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
        aria-label="Copy link"
      >
        <Link2 className="w-4 h-4" />
        {copied ? "Copied!" : "Copy link"}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={() => navigator.share({ url: shareUrl, title: shareTitle, text: shareText })}
          className="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}
    </div>
  );
}
