import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface SmartQuickAddProps {
  onAddTask: (text: string, projectName: string | null) => void;
}

const SmartQuickAdd: React.FC<SmartQuickAddProps> = ({ onAddTask }) => {
  const [input, setInput] = useState('');

  const parseSmartTask = (value: string) => {
    const match = value.match(/^(.*?)\s*@(\w+)$/);
    if (match) {
      return {
        text: match[1].trim(),
        projectName: match[2].trim(),
      };
    }
    return {
      text: value.trim(),
      projectName: null,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const { text, projectName } = parseSmartTask(input);
      onAddTask(text, projectName);
      setInput('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="relative flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-md p-2 border border-slate-200 dark:border-slate-700"
    >
      <input 
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a task... use @Project to route"
        className="flex-grow bg-transparent outline-none px-4 py-2 text-slate-700 dark:text-slate-200"
      />
      <button 
        type="submit"
        className="p-2 bg-action-indigo text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};

export default SmartQuickAdd;
export { SmartQuickAdd }; // for direct import if needed
