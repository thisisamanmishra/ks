'use client';

import { useEffect, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
  column_status: string;
  priority: string;
  assigned_to: string;
}

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Completed'];

function SortableTask({ task, activeId }: { task: Task; activeId: string | null }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: activeId === task.id ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing mb-2">
      <p className="text-sm font-bold text-navy">{task.title}</p>
      <div className="flex gap-2 mt-2">
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${task.priority === 'High' || task.priority === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{task.priority || 'Medium'}</span>
      </div>
    </div>
  );
}

export default function ProjectKanbanBoard({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // In a real implementation we would fetch from `/api/admin/projects/${projectId}/tasks`
  // But let's mock it initially to render
  useEffect(() => {
    // mock fetch
    setTasks([
      { id: '1', title: 'Setup DB', column_status: 'To Do', priority: 'High', assigned_to: '' },
      { id: '2', title: 'Write tests', column_status: 'In Progress', priority: 'Medium', assigned_to: '' },
      { id: '3', title: 'Deploy App', column_status: 'Completed', priority: 'High', assigned_to: '' },
    ]);
  }, [projectId]);

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine target column. If dropped over a column, over.id is column name.
    // If dropped over a task, target column is task's column.
    
    let targetColumn = overId as string;
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) targetColumn = overTask.column_status;

    if (COLUMNS.includes(targetColumn)) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, column_status: targetColumn } : t));
      // Trigger API update
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-heading text-navy">Project Kanban Board</h1>
      
      <DndContext collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.column_status === col);
            return (
              <div key={col} className="bg-slate-50 rounded-2xl p-4 min-h-[500px]">
                <h3 className="font-bold text-slate-700 mb-4">{col}</h3>
                <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {colTasks.map(task => (
                      <SortableTask key={task.id} task={task} activeId={activeId} />
                    ))}
                  </div>
                </SortableContext>
                <button className="w-full mt-4 py-2 border border-dashed border-slate-300 rounded-xl text-slate-500 font-bold text-sm">+ Add Task</button>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeId ? <div className="bg-white p-3 rounded-xl shadow-2xl border border-accent opacity-90 scale-105" /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
