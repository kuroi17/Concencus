import React from 'react';
import { getSDGById } from '../../common/SDGConstants';

const SDGBadge = ({ sdgId, showName = true, className = "" }) => {
  const sdg = getSDGById(sdgId);

  if (!sdg) return null;

  const Icon = sdg.icon;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${sdg.color} ${sdg.textColor} shadow-sm ${className}`}
      title={sdg.name}
    >
      <Icon size={12} strokeWidth={3} />
      {showName && <span>SDG {sdg.number}</span>}
    </div>
  );
};

export default SDGBadge;
