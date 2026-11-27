'use client';

import React, { memo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import {cn} from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
    const containerRef = useTradingViewWidget(scriptUrl, config, height);

    return (
        <div className="w-full">
            {title && <h3 className="font-semibold text-2xl text-fg mb-5">{title}</h3>}
            <div className="relative" style={{ height }}>
                {/* Static, not pulsing: a pulse here would also pulse the loaded chart. */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center rounded-lg border border-line bg-surface text-sm text-fg-subtle"
                >
                    Loading {title ? title.toLowerCase() : "chart"}…
                </div>
                <div className={cn('tradingview-widget-container relative', className)} ref={containerRef}>
                    <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
                </div>
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);