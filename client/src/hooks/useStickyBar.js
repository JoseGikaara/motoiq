import { useState, useEffect, useRef } from "react";

/**
 * Returns true when the sticky bar should be visible:
 * - User has scrolled past the "showAfter" element (e.g. hero)
 * - User has not yet reached the "hideBefore" element (e.g. footer/contact)
 */
export function useStickyBar(options = {}) {
  const { showAfterRef, hideBeforeRef, rootMargin = "0px" } = options;
  const [visible, setVisible] = useState(false);
  const showAfterSeen = useRef(false);

  useEffect(() => {
    if (!showAfterRef?.current) return;

    const showObserver = new IntersectionObserver(
      ([e]) => {
        showAfterSeen.current = !e.isIntersecting;
        setVisible(showAfterSeen.current);
      },
      { threshold: 0, rootMargin }
    );
    showObserver.observe(showAfterRef.current);

    return () => showObserver.disconnect();
  }, [showAfterRef, rootMargin]);

  useEffect(() => {
    if (!hideBeforeRef?.current) return;

    const hideObserver = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(false);
        else setVisible(showAfterSeen.current);
      },
      { threshold: 0, rootMargin: "0px 0px -100px 0px" }
    );
    hideObserver.observe(hideBeforeRef.current);

    return () => hideObserver.disconnect();
  }, [hideBeforeRef]);

  return visible;
}
