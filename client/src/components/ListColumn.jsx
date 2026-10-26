import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Trash2, Edit2, Check, X } from 'lucide-react';
import SortableCard from './SortableCard.jsx';

export default function ListColumn({
  list,
  cards,
  onCardClick,
  onAddCard,
  onRenameList,
  onDeleteList,
  isViewer = false,
}) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: list._id,
    data: { type: 'list', list },
  });

  const handleCreateCard = (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    onAddCard(list._id, newCardTitle.trim());
    setNewCardTitle('');
    setIsAddingCard(false);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== list.title) {
      onRenameList(list._id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-xl">
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="w-full rounded-md border border-indigo-500 bg-slate-950 px-2 py-1 text-sm font-semibold text-white focus:outline-none"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsEditingTitle(false)}
              className="p-1 text-slate-400 hover:bg-slate-800 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-wide text-slate-200">
              {list.title}
            </h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-400">
              {cards.length}
            </span>
          </div>
        )}

        {!isViewer && !isEditingTitle && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-36 rounded-xl border border-slate-700 bg-slate-900 py-1.5 shadow-xl">
                <button
                  onClick={() => {
                    setIsEditingTitle(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  Rename Column
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete column "${list.title}" and all its tasks?`)) {
                      onDeleteList(list._id);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Column
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards Scrollable Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 space-y-2.5 transition-colors ${
          isOver ? 'bg-indigo-950/20 ring-1 ring-inset ring-indigo-500/30' : ''
        }`}
      >
        <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card._id}
              card={card}
              onClick={() => onCardClick(card)}
              isViewer={isViewer}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && !isAddingCard && (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-600">
            No tasks in this list
          </div>
        )}

        {/* Inline Card Creation Form */}
        {isAddingCard && (
          <form onSubmit={handleCreateCard} className="rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-lg">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="What needs to be done?"
              rows={2}
              autoFocus
              className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCard(e);
                }
              }}
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="rounded-lg px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCardTitle.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Add Task
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Add Task Trigger */}
      {!isViewer && !isAddingCard && (
        <div className="p-3 pt-0">
          <button
            onClick={() => setIsAddingCard(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/40 py-2 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:bg-slate-800/50 hover:text-slate-200 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}
