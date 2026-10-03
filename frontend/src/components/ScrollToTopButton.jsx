import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 600;

// Floating "back to top" arrow, shown once the page has scrolled a screen or so
const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "fixed bottom-6 right-6 z-30 size-11 rounded-full border text-primary shadow-lg transition-opacity hover:border-primary/50 [&_svg]:size-5",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {/* Bob the icon, not the button, so the button's own states stay put */}
      <ArrowUp className="motion-safe:animate-bob" />
    </Button>
  );
};

export default ScrollToTopButton;
