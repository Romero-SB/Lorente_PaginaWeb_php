import { useEffect, useRef } from 'react';

export default function Reveal({ children, delay = 0, threshold = 0.1, className = '' }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            el.classList.add('rev-in');
            return;
        }

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        el.classList.add('rev-in');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold },
        );

        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);

    return (
        <div
            ref={ref}
            className={`rev ${className}`.trim()}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
        >
            {children}
        </div>
    );
}
