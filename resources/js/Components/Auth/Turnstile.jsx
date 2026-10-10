import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

let scriptLoaded = false;

export default function Turnstile() {
    const { turnstile_site_key: siteKey } = usePage().props;
    const ref = useRef(null);
    const rendered = useRef(false);

    useEffect(() => {
        if (!siteKey || !ref.current || rendered.current) {
            return;
        }

        function render() {
            if (window.turnstile && ref.current) {
                window.turnstile.render(ref.current, { sitekey: siteKey, theme: 'light' });
                rendered.current = true;
            }
        }

        if (window.turnstile) {
            render();

            return;
        }

        if (!scriptLoaded) {
            scriptLoaded = true;
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.onload = render;
            document.head.appendChild(script);
        }
    }, [siteKey]);

    if (!siteKey) {
        return null;
    }

    return <div ref={ref} className="mb-1" />;
}