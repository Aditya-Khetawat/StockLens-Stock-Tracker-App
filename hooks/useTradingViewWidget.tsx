'use client';
import { useEffect, useRef, useState } from "react";

/**
 * Embed a TradingView widget once its container comes within 300px of the
 * viewport, and report when its iframe has loaded so the caller can drop its
 * placeholder. Widgets further down the page never compete with first paint.
 */
const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || container.dataset.loaded) return;
        let injected = false;
        let mutations: MutationObserver | null = null;

        const inject = () => {
            container.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;
            const script = document.createElement("script");
            script.src = scriptUrl;
            script.async = true;
            script.innerHTML = JSON.stringify(config);
            container.appendChild(script);
            container.dataset.loaded = 'true';
            injected = true;

            // The script adds an iframe; the widget is visible once it loads.
            mutations = new MutationObserver(() => {
                const frame = container.querySelector("iframe");
                if (!frame) return;
                mutations?.disconnect();
                frame.addEventListener("load", () => setReady(true), { once: true });
            });
            mutations.observe(container, { childList: true, subtree: true });
            // Never leave the placeholder up if the load event is missed.
            fallback = setTimeout(() => setReady(true), 8000);
        };
        let fallback: ReturnType<typeof setTimeout> | undefined;

        const visibility = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                visibility.disconnect();
                inject();
            }
        }, { rootMargin: "300px" });
        visibility.observe(container);

        return () => {
            visibility.disconnect();
            mutations?.disconnect();
            clearTimeout(fallback);
            if (injected) {
                container.innerHTML = '';
                delete container.dataset.loaded;
            }
        };
    }, [scriptUrl, config, height])

    return { containerRef, ready };
}
export default useTradingViewWidget
