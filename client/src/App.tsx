import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  ListTodo, 
  AlertCircle, 
  GripVertical,
  SlidersHorizontal,
  FolderKanban
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'Active' | 'Completed';
  creationDate: string;
  position: number;
}

export default function App() {
  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [sortBy, setSortBy] = useState<'position' | 'creationDate'>('position');

  // Inline Editing State
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);

  // Fetch tasks on load & whenever sort order changes
  useEffect(() => {
    fetchTasks();
  }, [sortBy]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/tasks?sort=${sortBy}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Create Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          dueDate: newDueDate || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      
      // If we are sorting by creationDate (newest first), prepend the new task
      // If by position (custom), append it to the end of local state
      if (sortBy === 'creationDate') {
        setTasks((prev) => [newTask, ...prev]);
      } else {
        setTasks((prev) => [...prev, newTask]);
      }

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add task.');
    }
  };

  // Toggle Completion Status
  const handleToggleStatus = async (task: Task) => {
    const updatedStatus = task.status === 'Active' ? 'Completed' : 'Active';
    try {
      // Optimistic Update
      setTasks(prev => 
        prev.map(t => t.id === task.id ? { ...t, status: updatedStatus } : t)
      );

      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus }),
      });

      if (!res.ok) throw new Error('Failed to update task status');
      
      const updatedTask = await res.json();
      setTasks(prev => 
        prev.map(t => t.id === task.id ? updatedTask : t)
      );
    } catch (err: any) {
      // Revert optimistic update on failure
      fetchTasks();
      setError(err.message || 'Failed to update task.');
    }
  };

  // Enable inline editing mode for a task
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(task.dueDate || '');
  };

  // Save Inline Edits
  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          dueDate: editDueDate || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save task changes');
      
      const updatedTask = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      setEditingTaskId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save edits.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete task');

      setTasks(prev => prev.filter(t => t.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task.');
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (sortBy !== 'position') return; // Only allow drag and drop in position mode
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    if (sortBy !== 'position') return;
    e.preventDefault();
    if (draggedTaskId !== id) {
      setDragOverTaskId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    if (sortBy !== 'position' || draggedTaskId === null || draggedTaskId === targetId) return;
    e.preventDefault();

    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedItem);

    // Reassign position index based on new order sequence
    const updatedTasks = newTasks.map((task, idx) => ({
      ...task,
      position: idx + 1,
    }));

    // Optimistically update frontend UI
    setTasks(updatedTasks);
    setDraggedTaskId(null);
    setDragOverTaskId(null);

    // Call reorder backend API to persist positions
    try {
      const orderPayload = updatedTasks.map(task => ({
        id: task.id,
        position: task.position,
      }));

      const res = await fetch(`${API_BASE_URL}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderPayload }),
      });

      if (!res.ok) throw new Error('Failed to save new order to database');
    } catch (err: any) {
      setError('Reordering failed to save. Reloading...');
      fetchTasks();
    }
  };

  // Helper: Verify if a task is overdue
  const isOverdue = (task: Task) => {
    if (task.status === 'Completed' || !task.dueDate) return false;
    // Set comparison to end of current day or absolute time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Stats Calculations
  const totalTasks = tasks.length;
  const activeCount = tasks.filter(t => t.status === 'Active').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const overdueCount = tasks.filter(isOverdue).length;

  // Filter & Search Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      statusFilter === 'All' || 
      (statusFilter === 'Active' && task.status === 'Active') ||
      (statusFilter === 'Completed' && task.status === 'Completed');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden bg-slate-950 pb-20">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[150px] animate-pulse-slow pointer-events-none" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-12 relative z-10">
        
        {/* Header Branding */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
              <FolderKanban className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FlowTask
              </h1>
              <p className="text-slate-400 text-sm">Personal Task Manager Workspace</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-95 transition-all duration-200 text-white font-medium rounded-xl shadow-lg shadow-violet-600/30"
          >
            {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isFormOpen ? 'Close Editor' : 'New Task'}
          </button>
        </header>

        {/* Global Error Display */}
        {error && (
          <div className="mb-6 p-4 glass-panel border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm flex-grow">{error}</div>
            <button onClick={() => setError(null)} className="hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Dashboard Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <span className="text-3xl font-bold text-white mt-2">{totalTasks}</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Active</span>
            <span className="text-3xl font-bold text-violet-400 mt-2">{activeCount}</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Completed</span>
            <span className="text-3xl font-bold text-emerald-400 mt-2">{completedCount}</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between border-red-500/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Overdue</span>
            <span className={`text-3xl font-bold mt-2 ${overdueCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
              {overdueCount}
            </span>
          </div>
        </section>

        {/* Add Task Form (Collapsible) */}
        {isFormOpen && (
          <section className="glass-panel p-6 rounded-2xl mb-8 border-violet-500/20 shadow-xl shadow-black/40">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-violet-400" /> Create a New Task
            </h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  placeholder="Provide context or steps (optional)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-medium rounded-xl transition-all shadow-md shadow-violet-600/20"
                >
                  Create Task
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Toolbar: Filters & Sorting */}
        <section className="glass-panel p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/30 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls Container */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Status Filter */}
            <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              {(['All', 'Active', 'Completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === filter 
                      ? 'bg-slate-800 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="position" className="bg-slate-900">Custom Order</option>
                <option value="creationDate" className="bg-slate-900">Newest Created</option>
              </select>
            </div>
          </div>
        </section>

        {/* Drag & Drop Instructions */}
        {sortBy === 'position' && filteredTasks.length > 1 && (
          <div className="text-center text-xs text-slate-500 mb-4 animate-pulse">
            💡 Drag & Drop the <GripVertical className="inline w-3.5 h-3.5 -mt-0.5" /> handle to custom-reorder tasks.
          </div>
        )}

        {/* Tasks Container */}
        <section className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Synchronizing tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            /* Empty State */
            <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-slate-800 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center mb-4 text-slate-500 border border-slate-800/80">
                <ListTodo className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {searchQuery || statusFilter !== 'All' ? 'No Matching Tasks' : 'Workspace is Empty'}
              </h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                {searchQuery || statusFilter !== 'All' 
                  ? 'Try clearing your search term or changing your status filter.' 
                  : 'Get started by creating your very first task and organize your flow.'}
              </p>
              {!(searchQuery || statusFilter !== 'All') ? (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-5 py-2.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-violet-400 font-semibold rounded-xl transition-all"
                >
                  Create Task
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            /* Task List */
            filteredTasks.map((task) => {
              const isTaskEditing = editingTaskId === task.id;
              const isTaskDeleteConfirm = deleteConfirmId === task.id;
              const isTaskOverdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  draggable={sortBy === 'position' && !isTaskEditing}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, task.id)}
                  className={`glass-card p-5 rounded-2xl flex items-start gap-4 ${
                    draggedTaskId === task.id ? 'dragging' : ''
                  } ${dragOverTaskId === task.id ? 'drag-over' : ''} ${
                    isTaskOverdue ? 'border-red-500/30 bg-red-950/5' : ''
                  }`}
                >
                  {/* Drag Handle */}
                  {sortBy === 'position' && !isTaskEditing && (
                    <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 -ml-2 select-none self-center">
                      <GripVertical className="w-5 h-5" />
                    </div>
                  )}

                  {/* Complete/Active Status Toggle */}
                  {!isTaskEditing && (
                    <button 
                      onClick={() => handleToggleStatus(task)}
                      className="mt-1 flex-shrink-0 text-slate-500 hover:text-violet-400 active:scale-90 transition-all"
                    >
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-400/10" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                  )}

                  {/* Task Content Area */}
                  <div className="flex-grow min-w-0">
                    {isTaskEditing ? (
                      /* Edit Mode Form */
                      <div className="space-y-3 pt-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
                          placeholder="Task title"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                          rows={2}
                          placeholder="Description (optional)"
                        />
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 [color-scheme:dark]"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(task.id)}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Mode */
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`font-semibold text-base tracking-wide truncate ${
                            task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}>
                            {task.title}
                          </h3>

                          {/* Overdue Badge */}
                          {isTaskOverdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                              <AlertCircle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className={`text-sm mt-1 whitespace-pre-line leading-relaxed ${
                            task.status === 'Completed' ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            {task.description}
                          </p>
                        )}

                        {/* Date Info */}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                          {task.dueDate && (
                            <span className={`inline-flex items-center gap-1.5 ${isTaskOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            <span>Created: {new Date(task.creationDate).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Section */}
                  {!isTaskEditing && (
                    <div className="flex items-center gap-1.5 flex-shrink-0 self-start">
                      {isTaskDeleteConfirm ? (
                        /* Delete Confirmation State */
                        <div className="flex items-center gap-1 border border-red-500/20 bg-red-950/20 px-2 py-1 rounded-xl">
                          <span className="text-[10px] font-bold text-red-400 mr-1 uppercase tracking-wider">Sure?</span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-md transition-colors"
                            title="Confirm Delete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
                            title="Cancel Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        /* Standard Action Buttons */
                        <>
                          <button
                            onClick={() => startEditing(task)}
                            className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-xl transition-all"
                            title="Edit Task"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(task.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
