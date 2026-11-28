'use client';

import React, { memo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    /** Height below the md breakpoint; defaults to a phone-friendly 400px or less. */
    mobileHeight?: number;
    /** Heading level for the title, to fit the page outline. */
    headingLevel?: "h2" | "h3";
    className?: string;
}

/** A TradingView embed in a sheet, with a quiet placeholder until it paints. */
const TradingViewWidget = ({ title, scriptUrl, config, height = 600, mobileHeight, headingLevel = "h3", className }: TradingViewWidgetProps) => {
    const Heading = headingLevel;
    const phone = mobileHeight ?? Math.min(height, 400);
    const { containerRef, ready } = useTradingViewWidget(scriptUrl, config, height, phone);

    return (
        <section className="sheet flex w-full flex-col overflow-hidden">
            {title && (
                <div className="sheet-head">
                    <Heading className="sheet-title">{title}</Heading>
                </div>
            )}
            <div
                className="relative min-h-[var(--tv-mh)] p-2 md:min-h-[var(--tv-h)]"
                style={{ "--tv-h": `${height + 16}px`, "--tv-mh": `${phone + 16}px` } as React.CSSProperties}
            >
                {!ready && (
                    <div
                        aria-hidden="true"
                        className="absolute inset-2 flex items-center justify-center rounded-md bg-raised/40 text-sm text-fg-subtle"
                    >
                        Loading {title ? title.toLowerCase() : "chart"}…
                    </div>
                )}
                <div className={cn('tradingview-widget-container relative', className)} ref={containerRef}>
                    <div className="tradingview-widget-container__widget h-[var(--tv-mh)] w-full md:h-[var(--tv-h)]" />
                </div>
            </div>
        </section>
    );
}

export default memo(TradingViewWidget);
