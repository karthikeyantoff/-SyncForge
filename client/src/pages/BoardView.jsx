import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from '../api/client.js';
import { getSocket } from '../socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { positionBetween, appendPosition } from '../utils/position.js';
import Navbar from '../components/Navbar.jsx';
import ListColumn from '../components/ListColumn.jsx';
import SortableCard from '../components/SortableCard.jsx';
import CardModal from '../components/CardModal.jsx';
import ConflictDialog from '../components/ConflictDialog.jsx';
import MemberModal from '../components/MemberModal.jsx';
import ActivityPanel from '../components/ActivityPanel.jsx';
import {
  Plus,
  Users,
  History,
  Search,
  Filter,
  Shield,
  Trash2,
  AlertCircle,
  Eye,
  ArrowLeft,
} from 'lucide-react';

function groupCardsByList(lists, cards) {
  const byList = {};
  lists.forEach((l) => {
    byList[l._id] = [];
  });
  cards.forEach((c) => {
    if (byList[c.list]) {
      byList[c.list].push(c);
    }
  });
  return byList;
}

export default function BoardView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [membership, setMembership] = useState(null);
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({});
  const [activeCard, setActiveCard] = useState(null);
  const [openCard, setOpenCard] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityCursor, setActivityCursor] = useState(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwner = membership?.role === 'owner';
  const isViewer = membership?.role === 'viewer';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Initial board load
  useEffect(() => {
    fetchBoard();
    reloadActivities();
  }, [id]);

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/boards/${id}`);
      setBoard(data.board);
      setMembership(data.membership);
      setLists(data.lists);
      setCardsByList(groupCardsByList(data.lists, data.cards));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reloadActivities = async () => {
    try {
      const { data } = await api.get(`/boards/${id}/activity`);
      setActivities(data.activities);
      setActivityCursor(data.nextCursor);
    } catch {
      // non-fatal
    }
  };

  const loadMoreActivity = async () => {
    if (!activityCursor) return;
    try {
      const { data } = await api.get(`/boards/${id}/activity`, {
        params: { cursor: activityCursor },
      });
      setActivities((prev) => [...prev, ...data.activities]);
      setActivityCursor(data.nextCursor);
    } catch {
      // non-fatal
    }
  };

  // Real-time synchronization with Socket.IO
  useEffect(() => {
    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('board:join', id, (res) => {
        if (res && !res.ok) {
          setError(res.error || 'Realtime subscription failed');
        }
      });
    };

    let firstConnect = true;
    const onConnect = () => {
      joinRoom();
      if (firstConnect) {
        firstConnect = false;
        return;
      }
      // Re-synchronize board and history on reconnect
      fetchBoard();
      reloadActivities();
    };

    if (socket.connected) firstConnect = false;
    joinRoom();
    socket.on('connect', onConnect);

    // Socket Event Handlers
    const onCardUpsert = ({ card }) => {
      setCardsByList((prev) => {
        const next = {};
        for (const [listId, cards] of Object.entries(prev)) {
          next[listId] = cards.filter((c) => c._id !== card._id);
        }
        next[card.list] = [...(next[card.list] || []), card].sort(
          (a, b) => a.position - b.position
        );
        return next;
      });
    };

    const onCardDeleted = ({ cardId, listId }) => {
      setCardsByList((prev) => {
        const next = {};
        for (const [lId, cards] of Object.entries(prev)) {
          next[lId] = cards.filter((c) => c._id !== cardId);
        }
        return next;
      });
    };

    const onListCreated = ({ list }) => {
      setLists((prev) =>
        prev.some((l) => l._id === list._id) ? prev : [...prev, list].sort((a, b) => a.position - b.position)
      );
      setCardsByList((prev) => ({ ...prev, [list._id]: prev[list._id] || [] }));
    };

    const onListUpdated = ({ list }) => {
      setLists((prev) =>
        prev.map((l) => (l._id === list._id ? list : l)).sort((a, b) => a.position - b.position)
      );
    };

    const onListDeleted = ({ listId }) => {
      setLists((prev) => prev.filter((l) => l._id !== listId));
      setCardsByList((prev) => {
        const next = { ...prev };
        delete next[listId];
        return next;
      });
    };

    const onMemberAdded = ({ member }) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const exists = prev.members.some(
          (m) => String(m.user?._id || m.user) === String(member.user?._id || member.user)
        );
        if (exists) return prev;
        return { ...prev, members: [...prev.members, member] };
      });
    };

    const onMemberRemoved = ({ memberUserId }) => {
      if (String(user?._id) === String(memberUserId)) {
        navigate('/');
        return;
      }
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter(
            (m) => String(m.user?._id || m.user) !== String(memberUserId)
          ),
        };
      });
    };

    const onMemberUpdated = ({ memberUserId, role }) => {
      if (String(user?._id) === String(memberUserId)) {
        setMembership((prev) => (prev ? { ...prev, role } : prev));
      }
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            String(m.user?._id || m.user) === String(memberUserId) ? { ...m, role } : m
          ),
        };
      });
    };

    const onActivityCreated = ({ activity }) => {
      setActivities((prev) => [activity, ...prev]);
    };

    const onBoardDeleted = () => {
      alert('This board was deleted by its owner.');
      navigate('/');
    };

    socket.on('card:created', onCardUpsert);
    socket.on('card:updated', onCardUpsert);
    socket.on('card:deleted', onCardDeleted);
    socket.on('list:created', onListCreated);
    socket.on('list:updated', onListUpdated);
    socket.on('list:deleted', onListDeleted);
    socket.on('member:added', onMemberAdded);
    socket.on('member:removed', onMemberRemoved);
    socket.on('member:updated', onMemberUpdated);
    socket.on('activity:created', onActivityCreated);
    socket.on('board:deleted', onBoardDeleted);

    return () => {
      socket.emit('board:leave', id);
      socket.off('connect', onConnect);
      socket.off('card:created', onCardUpsert);
      socket.off('card:updated', onCardUpsert);
      socket.off('card:deleted', onCardDeleted);
      socket.off('list:created', onListCreated);
      socket.off('list:updated', onListUpdated);
      socket.off('list:deleted', onListDeleted);
      socket.off('member:added', onMemberAdded);
      socket.off('member:removed', onMemberRemoved);
      socket.off('member:updated', onMemberUpdated);
      socket.off('activity:created', onActivityCreated);
      socket.off('board:deleted', onBoardDeleted);
    };
  }, [id, user]);

  // Drag and Drop Logic
  const handleDragStart = ({ active }) => {
    if (isViewer) return;
    const cardId = active.id;
    for (const cards of Object.values(cardsByList)) {
      const match = cards.find((c) => c._id === cardId);
      if (match) {
        setActiveCard(match);
        break;
      }
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (isViewer || !over) return;
    const activeId = active.id;
    const overId = over.id;

    let sourceListId = null;
    let targetListId = null;

    for (const [listId, cards] of Object.entries(cardsByList)) {
      if (cards.some((c) => c._id === activeId)) sourceListId = listId;
      if (listId === overId || cards.some((c) => c._id === overId)) targetListId = listId;
    }

    if (!sourceListId || !targetListId || sourceListId === targetListId) return;

    setCardsByList((prev) => {
      const sourceCards = [...prev[sourceListId]];
      const targetCards = [...prev[targetListId]];

      const cardIndex = sourceCards.findIndex((c) => c._id === activeId);
      if (cardIndex === -1) return prev;

      const [movedCard] = sourceCards.splice(cardIndex, 1);
      movedCard.list = targetListId;

      targetCards.push(movedCard);

      return {
        ...prev,
        [sourceListId]: sourceCards,
        [targetListId]: targetCards,
      };
    });
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null);
    if (isViewer || !over) return;

    const activeId = active.id;
    const overId = over.id;

    let listId = null;
    for (const [lId, cards] of Object.entries(cardsByList)) {
      if (cards.some((c) => c._id === activeId)) {
        listId = lId;
        break;
      }
    }

    if (!listId) return;

    const currentListCards = cardsByList[listId] || [];
    const oldIndex = currentListCards.findIndex((c) => c._id === activeId);
    let newIndex = currentListCards.findIndex((c) => c._id === overId);

    if (newIndex === -1) {
      newIndex = currentListCards.length - 1;
    }

    const reordered = arrayMove(currentListCards, oldIndex, newIndex);

    const prevCard = reordered[newIndex - 1];
    const nextCard = reordered[newIndex + 1];
    const targetPosition = positionBetween(prevCard?.position, nextCard?.position);

    const cardToUpdate = reordered[newIndex];
    cardToUpdate.position = targetPosition;

    // Optimistic update
    setCardsByList((prev) => ({
      ...prev,
      [listId]: reordered,
    }));

    // Server commit
    try {
      await api.patch(`/cards/${cardToUpdate._id}`, {
        list: listId,
        position: targetPosition,
      });
    } catch (err) {
      console.error('[Move Card Error]', err.message);
      fetchBoard(); // Reconcile on error
    }
  };

  // Card Operations
  const handleAddCard = async (listId, title) => {
    try {
      const { data } = await api.post(`/lists/${listId}/cards`, { title });
      setCardsByList((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] || []), data.card],
      }));
    } catch (err) {
      alert(`Could not create card: ${err.message}`);
    }
  };

  const handleSaveCard = async (updatedCard) => {
    try {
      const { data } = await api.patch(`/cards/${updatedCard._id}`, updatedCard);
      setCardsByList((prev) => {
        const next = {};
        for (const [lId, cards] of Object.entries(prev)) {
          next[lId] = cards.map((c) => (c._id === data.card._id ? data.card : c));
        }
        return next;
      });
    } catch (err) {
      // Check for OCC 409 Conflict
      if (err.message.includes('modified by another collaborator') || err.message.includes('409')) {
        // Re-fetch card from server to show conflict dialog
        try {
          const boardRes = await api.get(`/boards/${id}`);
          const serverCard = boardRes.data.cards.find((c) => c._id === updatedCard._id);
          if (serverCard) {
            setConflict({
              attempted: updatedCard,
              server: serverCard,
            });
            return;
          }
        } catch {}
      }
      throw err;
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await api.delete(`/cards/${cardId}`);
      setCardsByList((prev) => {
        const next = {};
        for (const [lId, cards] of Object.entries(prev)) {
          next[lId] = cards.filter((c) => c._id !== cardId);
        }
        return next;
      });
    } catch (err) {
      alert(`Could not delete card: ${err.message}`);
    }
  };

  // List Operations
  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const { data } = await api.post(`/boards/${id}/lists`, {
        title: newListTitle.trim(),
      });
      setLists((prev) => [...prev, data.list]);
      setCardsByList((prev) => ({ ...prev, [data.list._id]: [] }));
      setNewListTitle('');
      setIsAddingList(false);
    } catch (err) {
      alert(`Could not create column: ${err.message}`);
    }
  };

  const handleRenameList = async (listId, title) => {
    try {
      const { data } = await api.patch(`/lists/${listId}`, { title });
      setLists((prev) => prev.map((l) => (l._id === listId ? data.list : l)));
    } catch (err) {
      alert(`Could not rename column: ${err.message}`);
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      await api.delete(`/lists/${listId}`);
      setLists((prev) => prev.filter((l) => l._id !== listId));
      setCardsByList((prev) => {
        const next = { ...prev };
        delete next[listId];
        return next;
      });
    } catch (err) {
      alert(`Could not delete column: ${err.message}`);
    }
  };

  // Member Management Actions
  const handleAddMember = async (email, role) => {
    const { data } = await api.post(`/boards/${id}/members`, { email, role });
    setBoard(data.board);
  };

  const handleRemoveMember = async (memberUserId) => {
    const { data } = await api.delete(`/boards/${id}/members/${memberUserId}`);
    setBoard(data.board);
  };

  const handleUpdateRole = async (memberUserId, role) => {
    const { data } = await api.patch(`/boards/${id}/members/${memberUserId}`, { role });
    setBoard(data.board);
  };

  // Delete Board Action
  const handleDeleteBoard = async () => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${board.title}"?`)) return;
    try {
      await api.delete(`/boards/${id}`);
      navigate('/');
    } catch (err) {
      alert(`Could not delete board: ${err.message}`);
    }
  };

  // Filtering Logic
  const filteredCardsByList = useMemo(() => {
    const result = {};
    for (const [listId, cards] of Object.entries(cardsByList)) {
      result[listId] = cards.filter((card) => {
        const matchesSearch =
          !searchQuery.trim() ||
          card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          card.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPriority =
          priorityFilter === 'all' || card.priority === priorityFilter;

        return matchesSearch && matchesPriority;
      });
    }
    return result;
  }, [cardsByList, searchQuery, priorityFilter]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-slate-400">Synchronizing board workspace...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Board Unavailable</h2>
        <p className="mt-1 max-w-sm text-xs text-slate-400">{error || 'Board not found or access revoked.'}</p>
        <Link
          to="/"
          className="mt-5 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <Navbar />

      {/* Board Header Toolbar */}
      <header className="flex-shrink-0 border-b border-slate-800 bg-slate-900/60 px-4 py-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Board Title & Badges */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="All Boards"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">{board.title}</h1>
                {isViewer ? (
                  <span className="flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    <Eye className="h-3 w-3" />
                    Viewer (Read-Only)
                  </span>
                ) : (
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 capitalize">
                    {membership?.role || 'Member'}
                  </span>
                )}
              </div>
              {board.description && (
                <p className="text-xs text-slate-400 line-clamp-1">{board.description}</p>
              )}
            </div>
          </div>

          {/* Controls: Search, Filter, Members, Activity, Delete */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-36 sm:w-44"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Collaborators Button */}
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>{board.members?.length || 1} Members</span>
            </button>

            {/* Activity Stream Button */}
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <History className="h-3.5 w-3.5 text-amber-400" />
              <span>Activity</span>
            </button>

            {/* Delete Board (Owner Only) */}
            {isOwner && (
              <button
                onClick={handleDeleteBoard}
                className="rounded-xl p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                title="Delete Board"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Kanban Workspace Horizontal Canvas */}
      <main className="flex-1 overflow-x-auto p-4 sm:p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full items-start gap-5">
            {lists.map((list) => (
              <ListColumn
                key={list._id}
                list={list}
                cards={filteredCardsByList[list._id] || []}
                onCardClick={(card) => setOpenCard(card)}
                onAddCard={handleAddCard}
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
                isViewer={isViewer}
              />
            ))}

            {/* Add Column Button / Form */}
            {!isViewer && (
              <div className="w-80 flex-shrink-0">
                {isAddingList ? (
                  <form
                    onSubmit={handleAddList}
                    className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-xl"
                  >
                    <input
                      type="text"
                      placeholder="Column title (e.g. QA Testing)"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      autoFocus
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingList(false)}
                        className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newListTitle.trim()}
                        className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        Add Column
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingList(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 py-4 text-xs font-bold text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-white transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Column
                  </button>
                )}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-72">
                <SortableCard card={activeCard} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Card Detail Modal */}
      {openCard && (
        <CardModal
          card={openCard}
          boardMembers={board.members}
          onClose={() => setOpenCard(null)}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          isViewer={isViewer}
        />
      )}

      {/* OCC 409 Conflict Dialog */}
      {conflict && (
        <ConflictDialog
          attempted={conflict.attempted}
          server={conflict.server}
          onDiscard={() => {
            // Accept server version
            setCardsByList((prev) => {
              const next = {};
              for (const [lId, cards] of Object.entries(prev)) {
                next[lId] = cards.map((c) => (c._id === conflict.server._id ? conflict.server : c));
              }
              return next;
            });
            setConflict(null);
          }}
          onOverwrite={async () => {
            // Overwrite using new server version counter
            try {
              const payload = {
                ...conflict.attempted,
                version: conflict.server.version,
              };
              const { data } = await api.patch(`/cards/${conflict.attempted._id}`, payload);
              setCardsByList((prev) => {
                const next = {};
                for (const [lId, cards] of Object.entries(prev)) {
                  next[lId] = cards.map((c) => (c._id === data.card._id ? data.card : c));
                }
                return next;
              });
              setConflict(null);
            } catch (err) {
              alert(`Could not overwrite: ${err.message}`);
            }
          }}
        />
      )}

      {/* Member Management Modal */}
      {showMembers && (
        <MemberModal
          board={board}
          currentUserId={user?._id}
          isOwner={isOwner}
          onClose={() => setShowMembers(false)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onUpdateRole={handleUpdateRole}
        />
      )}

      {/* Activity Timeline Drawer */}
      {showActivity && (
        <ActivityPanel
          activities={activities}
          onClose={() => setShowActivity(false)}
          onLoadMore={loadMoreActivity}
          hasMore={Boolean(activityCursor)}
        />
      )}
    </div>
  );
}
