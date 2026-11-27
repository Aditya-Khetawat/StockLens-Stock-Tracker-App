'use client';

import React, { memo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

/** A TradingView embed set on a paper sheet, with a quiet placeholder until it paints. */
const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
    const { containerRef, ready } = useTradingViewWidget(scriptUrl, config, height);

    return (
        <section className="sheet flex w-full flex-col overflow-hidden">
            {title && (
                <div className="sheet-head">
                    <h3 className="sheet-title">{title}</h3>
                </div>
            )}
            <div className="relative p-2" style={{ minHeight: height + 16 }}>
                {!ready && (
                    <div
                        aria-hidden="true"
                        className="absolute inset-2 flex items-center justify-center rounded-md bg-raised/40 text-sm text-fg-subtle"
                    >
                        Loading {title ? title.toLowerCase() : "chart"}…
                    </div>
                )}
                <div className={cn('tradingview-widget-container relative', className)} ref={containerRef}>
                    <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
                </div>
            </div>
        </section>
    );
}

export default memo(TradingViewWidget);
