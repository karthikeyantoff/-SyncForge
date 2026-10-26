import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, AlertCircle } from 'lucide-react';
import { priorityConfig, labelColors } from '../theme.js';

export default function SortableCard({ card, onClick, isViewer = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card._id,
    data: { type: 'card', card },
    disabled: isViewer,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[card.priority] || priorityConfig.medium;
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-sm transition-all hover:border-slate-700 hover:shadow-md cursor-pointer ${
        isDragging ? 'opacity-40 ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' : ''
      }`}
    >
      {/* Priority & Version Indicator */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${priority.bg} ${priority.text} ${priority.border}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>

        <span className="text-[10px] font-mono text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity">
          v{card.version ?? 0}
        </span>
      </div>

      {/* Card Title */}
      <h4 className="text-sm font-semibold text-slate-100 leading-snug group-hover:text-indigo-400 transition-colors">
        {card.title}
      </h4>

      {/* Description Snippet */}
      {card.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-400 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {card.labels.map((lbl, idx) => {
            const colorClass = labelColors[lbl.color] || labelColors.indigo;
            return (
              <span
                key={idx}
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}
              >
                {lbl.text}
              </span>
            );
          })}
        </div>
      )}

      {/* Card Footer (Due Date & Assignee) */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-500">
        {card.dueDate ? (
          <div
            className={`flex items-center gap-1 font-medium ${
              isOverdue ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
            <span>{new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        ) : (
          <div />
        )}

        {card.assignee ? (
          <div
            className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-2 py-0.5 text-slate-300"
            title={`Assigned to ${card.assignee.name}`}
          >
            <div className="h-4 w-4 rounded-full bg-indigo-600/30 text-[9px] font-bold text-indigo-400 flex items-center justify-center">
              {card.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-medium">{card.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-600 italic">Unassigned</span>
        )}
      </div>
    </div>
  );
}
