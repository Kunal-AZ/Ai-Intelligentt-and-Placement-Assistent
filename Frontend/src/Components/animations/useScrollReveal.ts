import { useEffect, useRef } from 'react';

export interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  stagger?: number; // ms delay between items
}

/**
 * useScrollReveal hook
 * High-performance scroll observer that triggers entrance animations
 * using GPU-accelerated CSS classes and unobserves revealed elements.
 * Fully respects prefers-reduced-motion for accessibility.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const containerRef = useRef<T | null>(null);
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', stagger = 0 } = options;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Check accessibility preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Find all target elements including the root itself if tagged
    const targetElements: HTMLElement[] = [];
    if (root.classList.contains('reveal-on-scroll')) {
      targetElements.push(root);
    }
    const children = root.querySelectorAll<HTMLElement>('.reveal-on-scroll');
    children.forEach((el) => targetElements.push(el));

    if (!targetElements.length) return;

    if (prefersReducedMotion) {
      targetElements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            if (stagger > 0) {
              el.style.transitionDelay = `${idx * stagger}ms`;
            }
            el.classList.add('is-revealed');
            observer.unobserve(el);
          }
        });
      },
      { threshold, rootMargin }
    );

    targetElements.forEach((target) => {
      // If already revealed previously, no need to observe
      if (!target.classList.contains('is-revealed')) {
        observer.observe(target);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, stagger]);

  return containerRef;
}
