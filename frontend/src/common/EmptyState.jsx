import React from "react";

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-20 text-center bg-slate-50/50 dark:bg-slate-900/50 soft-enter">
      {Icon && (
        <div className="mb-4 rounded-full bg-slate-100 dark:bg-slate-800 p-4 text-slate-400 dark:text-slate-600">
          <Icon size={40} />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
