// ============================================================
// INTERSECTION OBSERVER HOOK
// For lazy loading and infinite scroll functionality
// ============================================================

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefCallback<Element>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0%', freezeOnceVisible = false } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = null;

    if (frozen || !node) return;

    observer.current = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    );

    const { current: currentObserver } = observer;
    currentObserver.observe(node);

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };
  }, [node, threshold, root, rootMargin, frozen]);

  const previouslyInView = useRef(false);
  const isIntersecting = entry?.isIntersecting ?? false;

  if (isIntersecting) {
    previouslyInView.current = true;
  }

  return [setNode, frozen ? previouslyInView.current : isIntersecting];
}