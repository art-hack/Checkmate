import { useState, useEffect, type FC } from 'react';
import { Command } from 'cmdk';
import { 
  Search, 
  LayoutDashboard, 
  Inbox as InboxIcon, 
  Plus, 
  CheckSquare, 
  Hash, 
  ChevronRight,
  Command as CommandIcon
} from 'lucide-react';
import type { Project, Task } from './types';

interface CommandPaletteProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject: (projectId: string | null) => void;
}

const CommandPalette: FC<CommandPaletteProps> = ({
  projects,
  tasks,
  onSelectProject
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const page = pages[pages.length - 1];

  // Toggle the menu when ⌘K or Ctrl+K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelectProject = (projectId: string | null) => {
    onSelectProject(projectId);
    setOpen(false);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const inboxProject = projects.find(p => p.isInbox);

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Global Command Palette"
      className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] p-4 bg-slate-950/40 backdrop-blur-sm"
      onKeyDown={(e) => {
        // Escape or Backspace (when empty) goes back a page
        if (e.key === 'Escape' && pages.length > 0) {
          e.preventDefault();
          setPages((pages) => pages.slice(0, -1));
        }
        if (e.key === 'Backspace' && !search && pages.length > 0) {
          e.preventDefault();
          setPages((pages) => pages.slice(0, -1));
        }
      }}
    >
      <div className="w-full max-w-[640px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all">
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4">
          {pages.length > 0 && (
            <button 
              onClick={() => setPages(pages.slice(0, -1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 mr-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <Command.Input 
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder={page === 'projects' ? "Search projects..." : page === 'tasks' ? "Search all tasks..." : "Type a command or search..."}
            className="w-full py-4 text-base outline-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded ml-2">
            <span className="uppercase tracking-tighter">{pages.length > 0 ? 'Esc / ←' : 'Esc'}</span>
          </div>
        </div>

        <Command.List className="max-h-[360px] overflow-y-auto p-2 custom-scrollbar transition-all">
          <Command.Empty className="py-12 text-center text-sm text-slate-500">
            No results found for "{search}"
          </Command.Empty>

          {!page && (
            <>
              {/* Main commands remain same */}
              <Command.Group heading="Navigation" className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Command.Item 
                  onSelect={() => handleSelectProject(null)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl cursor-default select-none hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors aria-selected:bg-action-indigo aria-selected:text-white"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>The Board</span>
                </Command.Item>
                {inboxProject && (
                  <Command.Item 
                    onSelect={() => handleSelectProject(inboxProject.id)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl cursor-default select-none hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors aria-selected:bg-action-indigo aria-selected:text-white"
                  >
                    <InboxIcon className="w-4 h-4" />
                    <span>Inbox</span>
                  </Command.Item>
                )}
                <Command.Item 
                  onSelect={() => setPages([...pages, 'projects'])}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-default select-none hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors aria-selected:bg-action-indigo aria-selected:text-white group"
                >
                  <div className="flex items-center space-x-3">
                    <Hash className="w-4 h-4" />
                    <span>Go to Project...</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-aria-selected:text-white/70" />
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Tasks" className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Command.Item 
                  onSelect={() => {
                    setOpen(false);
                    // Switch to board if not already there
                    onSelectProject(null);
                    setTimeout(() => {
                      const quickAddInput = document.querySelector('[data-quick-add="true"]') as HTMLInputElement;
                      if (quickAddInput) quickAddInput.focus();
                    }, 100);
                  }}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl cursor-default select-none hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors aria-selected:bg-action-indigo aria-selected:text-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Task...</span>
                  <div className="flex items-center space-x-1 ml-auto">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold text-slate-500 group-aria-selected:bg-white/20 group-aria-selected:text-white transition-colors">Alt</kbd>
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-bold text-slate-500 group-aria-selected:bg-white/20 group-aria-selected:text-white transition-colors">N</kbd>
                  </div>
                </Command.Item>
                <Command.Item 
                  onSelect={() => setPages([...pages, 'tasks'])}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-default select-none hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors aria-selected:bg-action-indigo aria-selected:text-white group"
                >
                  <div className="flex items-center space-x-3">
                    <CheckSquare className="w-4 h-4" />
                    <span>Search All Tasks...</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-aria-selected:text-white/70" />
                </Command.Item>
              </Command.Group>
            </>
          )}

          {page === 'projects' && (
            <Command.Group heading="Select Project" className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {projects.map(p => (
                <Command.Item 
                  key={p.id}
                  onSelect={() => handleSelectProject(p.id)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl cursor-default select-none hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors aria-selected:bg-action-indigo aria-selected:text-white"
                >
                  <Hash className="w-4 h-4 opacity-50" />
                  <span>{p.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {page === 'tasks' && (
            <Command.Group heading="Jump to Project Section" className="px-2 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {activeTasks.map(t => (
                <Command.Item 
                  key={t.id}
                  onSelect={() => handleSelectProject(t.projectId)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-default select-none hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors aria-selected:bg-action-indigo aria-selected:text-white group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-4 h-4 rounded border border-current opacity-30 flex-shrink-0" />
                    <span className="truncate">{t.text}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-[10px] opacity-50 group-aria-selected:opacity-80 flex items-center">
                      <Hash className="w-2.5 h-2.5 mr-1" />
                      {projects.find(p => p.id === t.projectId)?.name}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded shadow-sm inline-flex items-center justify-center min-w-[14px]">
                <ChevronRight className="w-2.5 h-2.5 rotate-90" />
              </span>
              <span>Select</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded shadow-sm">Enter</span>
              <span>Open</span>
            </span>
          </div>
          <div className="flex items-center space-x-1 opacity-50">
            <CommandIcon className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
