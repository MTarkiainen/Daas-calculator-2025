

import React from 'react';

interface TcoBarChartProps {
    leaseCost: number;
    purchaseCost: number;
    currency: string;
}

const TcoBarChart: React.FC<TcoBarChartProps> = ({ leaseCost, purchaseCost, currency }) => {
    const locale = 'en-GB';

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    };

    const formatAxisCurrency = (value: number) => {
        return new Intl.NumberFormat(locale, { 
            style: 'currency', 
            currency,
            maximumFractionDigits: 0 
        }).format(value);
    };
    
    const getNiceMaxValue = (num: number): number => {
        if (num <= 1) return 100;
        const exponent = Math.floor(Math.log10(num));
        const powerOf10 = Math.pow(10, exponent);
        const mantissa = num / powerOf10;
        
        let niceMantissa;
        if (mantissa < 1.5) niceMantissa = 1.5;
        else if (mantissa < 2) niceMantissa = 2;
        else if (mantissa < 3) niceMantissa = 3;
        else if (mantissa < 4) niceMantissa = 4;
        else if (mantissa < 5) niceMantissa = 5;
        else if (mantissa < 7.5) niceMantissa = 7.5;
        else niceMantissa = 10;
        
        return niceMantissa * powerOf10;
    };

    const maxDataValue = Math.max(leaseCost, purchaseCost);
    const yAxisTop = getNiceMaxValue(maxDataValue);

    const leaseHeight = yAxisTop > 0 ? (leaseCost / yAxisTop) * 100 : 0;
    const purchaseHeight = yAxisTop > 0 ? (purchaseCost / yAxisTop) * 100 : 0;
    
    const gridLinesCount = 4;

    return (
        <div>
            <h3 className="text-lg font-semibold text-center mb-6">Lease vs. Purchase Cost Comparison</h3>
            <div className="flex h-72 w-full">
                {/* Chart Area with integrated Y-Axis */}
                <div className="relative flex-1 flex justify-around pl-20 pb-8">
                    
                    {/* Grid Lines and Y-Axis labels */}
                    <div className="absolute top-0 left-20 right-0 bottom-8">
                        {[...Array(gridLinesCount + 1)].map((_, i) => {
                            const percentage = (i / gridLinesCount) * 100;
                            const value = yAxisTop * (i / gridLinesCount);
                            return (
                                <div key={i} className="absolute w-full" style={{ bottom: `${percentage}%` }}>
                                    <div className="h-px bg-slate-200"></div>
                                    <span className="absolute left-0 top-0 -translate-y-1/2 -translate-x-full text-xs text-slate-700 font-medium pr-2">
                                        {formatAxisCurrency(value)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Lease Bar */}
                    <div className="relative z-10 flex flex-col items-center justify-end w-1/4">
                        <div
                            className="w-24 bg-chg-active-blue rounded-t-lg transition-all duration-700 ease-out group relative hover:bg-brand-700"
                            style={{ height: `${leaseHeight}%` }}
                            title={`Total Lease Cost: ${formatCurrency(leaseCost)}`}
                        >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-chg-active-blue">{formatCurrency(leaseCost)}</span>
                        </div>
                        <span className="mt-2 text-sm text-slate-600 text-center font-medium">Total Lease Cost</span>
                    </div>

                    {/* Purchase Bar */}
                    <div className="relative z-10 flex flex-col items-center justify-end w-1/4">
                        <div
                            className="w-24 bg-slate-600 rounded-t-lg transition-all duration-700 ease-out group relative hover:bg-slate-700"
                            style={{ height: `${purchaseHeight}%` }}
                            title={`Total Ownership Cost: ${formatCurrency(purchaseCost)}`}
                        >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-700">{formatCurrency(purchaseCost)}</span>
                        </div>
                        <span className="mt-2 text-sm text-slate-600 text-center font-medium">Total Ownership Cost</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TcoBarChart;