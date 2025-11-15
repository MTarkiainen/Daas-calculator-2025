
import React from 'react';

interface LeaseLiabilityChartProps {
  data: { year: number; quarters: number[] }[];
}

const LeaseLiabilityChart: React.FC<LeaseLiabilityChartProps> = ({ data }) => {
  const locale = 'en-GB';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };
  
  if (!data || data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.flatMap(d => d.quarters), 0);
  const yAxisSteps = 5;
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue / (1000 * yAxisSteps)) * (1000 * yAxisSteps) : 10000;
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-center mb-2">Leasing Liability Schedule</h3>
      <p className="text-sm text-gray-500 text-center mb-6">Forecast of quarterly lease payments, invoiced in advance.</p>
      
      <div className="flex flex-col space-y-4">
        {data.map(({ year, quarters }) => (
          <div key={year}>
            <h4 className="font-semibold text-gray-800 mb-2">{year}</h4>
            <div className="relative h-64 w-full bg-gray-50 rounded-lg p-4 border flex items-end">
              {/* Y-Axis Grid Lines */}
              <div className="absolute top-0 left-0 right-10 bottom-8">
                {[...Array(yAxisSteps + 1)].map((_, i) => {
                  const value = yAxisMax * (i / yAxisSteps);
                  return (
                    <div key={i} className="absolute w-full h-px bg-gray-200" style={{ bottom: `${(i / yAxisSteps) * 100}%`}}>
                       <span className="absolute -right-2 top-0 -translate-y-1/2 text-xs text-gray-500">{formatCurrency(value)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bars */}
              <div className="w-full h-full flex justify-around items-end z-10 space-x-4">
                {quarters.map((value, index) => {
                  const barHeight = yAxisMax > 0 ? (value / yAxisMax) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                       <div 
                         className="relative w-full bg-brand-500 rounded-t-md hover:bg-brand-600 transition-colors group"
                         style={{ height: `${barHeight}%` }}
                       >
                         {value > 0 && (
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                               {formatCurrency(value)}
                            </div>
                         )}
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* X-Axis Labels */}
            <div className="w-full flex justify-around mt-1">
                 {quarters.map((_, index) => (
                    <div key={index} className="flex-1 text-center text-sm font-medium text-gray-600">
                      {`Q${index + 1}`}
                    </div>
                 ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaseLiabilityChart;
