import React from 'react';
import { SDGs, CORE_SDGS } from '../../common/SDGConstants';

const SDGSelector = ({ selectedSDGs = [], onChange, className = "" }) => {
  const toggleSDG = (number) => {
    if (selectedSDGs.includes(number)) {
      onChange(selectedSDGs.filter((id) => id !== number));
    } else {
      onChange([...selectedSDGs, number]);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Align with SDGs (Multiple)
      </label>
      <div className="flex flex-wrap gap-2">
        {SDGs.map((sdg) => {
          const isSelected = selectedSDGs.includes(sdg.number);
          const isCore = CORE_SDGS.includes(sdg.number);
          const Icon = sdg.icon;

          return (
            <button
              key={sdg.id}
              type="button"
              onClick={() => toggleSDG(sdg.number)}
              className={`group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 border-2 ${
                isSelected 
                  ? `${sdg.color} border-transparent scale-110 shadow-lg` 
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              } ${isCore && !isSelected ? "ring-2 ring-amber-400/50" : ""}`}
              title={sdg.name}
            >
              <Icon 
                size={20} 
                className={isSelected ? sdg.textColor : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"} 
                strokeWidth={isSelected ? 3 : 2}
              />
              {isCore && !isSelected && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-800" />
              )}
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                SDG {sdg.number}: {sdg.name}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] font-medium text-slate-400 italic">
        Core Campus SDGs (4, 16, 17) are highlighted.
      </p>
    </div>
  );
};

export default SDGSelector;
