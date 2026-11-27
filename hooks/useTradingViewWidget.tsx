'use client';
import { useEffect, useRef } from "react";

/**
 * Embed a TradingView widget once its container comes within 300px of the
 * viewport. Each widget loads a script plus an iframe, so widgets further down
 * the page no longer compete with the first paint.
 */
const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || container.dataset.loaded) return;
        let injected = false;

        const inject = () => {
            container.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;
            const script = document.createElement("script");
            script.src = scriptUrl;
            script.async = true;
            script.innerHTML = JSON.stringify(config);
            container.appendChild(script);
            container.dataset.loaded = 'true';
            injected = true;
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                observer.disconnect();
                inject();
            }
        }, { rootMargin: "300px" });
        observer.observe(container);

        return () => {
            observer.disconnect();
            if (injected) {
                container.innerHTML = '';
                delete container.dataset.loaded;
            }
        };
    }, [scriptUrl, config, height])

    return containerRef;
}
export default useTradingViewWidget
