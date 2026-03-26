import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  once?: boolean;
}

/**
 * Observe when an element enters and leaves viewport
 * Useful for lazy loading images, infinite scroll, etc.
 */
export function useIntersectionObserver<T extends HTMLElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);
  const { threshold = 0.1, rootMargin = '0px', once = false } = options;

  useEffect(() => {
    const currentElement = ref.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(currentElement);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(currentElement);
    return () => observer.unobserve(currentElement);
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

export default useIntersectionObserver;
