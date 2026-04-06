import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, ListTodo, ArrowLeft } from 'lucide-react';
import type { Project, Checklist } from './types';

interface SmartQuickAddProps {
  projects: Project[];
  checklists: Checklist[];
  onAddTask: (text: string, projectId: string, checklistId: string) => void;
  activeProjectId: string | null;
}

const SmartQuickAdd: React.FC<SmartQuickAddProps> = ({ projects, checklists, onAddTask, activeProjectId }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Project[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  
  const [routingTask, setRoutingTask] = useState<{ text: string; project: Project } | null>(null);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (routingTask) {
      setShowSectionSelector(true);
      setShowSuggestions(false);
    } else {
      setShowSectionSelector(false);
    }
  }, [routingTask]);

  useEffect(() => {
    const atIndex = input.lastIndexOf('@');
    if (atIndex !== -1 && !routingTask) {
      const query = input.substring(atIndex + 1).toLowerCase();
      const filtered = projects.filter(p => p.name.toLowerCase().includes(query));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [input, projects, routingTask]);

  const parseSmartTask = (value: string) => {
    // Matches "Text @Project Name" - captures everything before @ and everything after
    const match = value.match(/^(.*?)\s*@([^@]+)$/);
    if (match) {
      const text = match[1].trim();
      const projectName = match[2].trim();
      
      // Try to find an exact project match
      const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      
      return {
        text,
        project: project || null,
        projectName: project ? null : projectName // Keep name if no match found
      };
    }
    return {
      text: value.trim(),
      project: null,
      projectName: null
    };
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      const { text, project } = parseSmartTask(input);
      
      // Use the parsed project, or the active one, or the first one as a fallback
      const targetProject = project || (activeProjectId ? projects.find(p => p.id === activeProjectId) : projects[0]);

      if (targetProject) {
        setRoutingTask({ text, project: targetProject });
      }
    }
  };

  const selectSection = (checklistId: string) => {
    if (routingTask) {
      onAddTask(routingTask.text, routingTask.project.id, checklistId);
      setRoutingTask(null);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(suggestions[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const selectSuggestion = (project: Project) => {
    const atIndex = input.lastIndexOf('@');
    const newInput = input.substring(0, atIndex) + '@' + project.name;
    setInput(newInput);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const targetProjectChecklists = routingTask 
    ? checklists.filter(c => c.projectId === routingTask.project.id)
    : [];

  return (
    <div className="relative">
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 border border-slate-200 dark:border-slate-700"
      >
        <input 
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!!routingTask}
          placeholder="Add a task... use @Project to route"
          className="flex-grow bg-transparent outline-none px-4 py-2 text-slate-700 dark:text-slate-200 disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!!routingTask}
          className="p-2 bg-action-indigo text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="p-2 bg-slate-50 dark:bg-slate-700/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Select Project
          </div>
          {suggestions.map((project, index) => (
            <button
              key={project.id}
              onClick={() => selectSuggestion(project)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${index === suggestionIndex ? 'bg-action-indigo text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              <Hash className={`w-4 h-4 ${index === suggestionIndex ? 'text-white' : 'text-slate-400'}`} />
              <span>{project.name}</span>
            </button>
          ))}
        </div>
      )}

      {showSectionSelector && routingTask && (
        <div className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          <div className="p-2 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Route to: {routingTask.project.name}
            </span>
            <button 
              onClick={() => setRoutingTask(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="p-1 bg-slate-100 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 text-center uppercase tracking-tighter">
            Select Section
          </div>
          <div className="max-h-48 overflow-y-auto">
            {targetProjectChecklists.length > 0 ? (
              targetProjectChecklists.map((checklist) => (
                <button
                  key={checklist.id}
                  onClick={() => selectSection(checklist.id)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800"
                >
                  <ListTodo className="w-4 h-4 text-action-indigo" />
                  <span className="font-medium text-sm">{checklist.name}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No sections found. Add one first?
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartQuickAdd;
export { SmartQuickAdd }; // for direct import if needed
