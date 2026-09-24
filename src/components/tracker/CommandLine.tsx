import { useState, type FormEvent, type RefObject } from 'react';

interface CommandLineProps {
  prompt: string; // "gymmy/push$"
  output: string[]; // the replies to the last command, oldest first
  inputRef: RefObject<HTMLInputElement>;
  onSubmit: (text: string) => void;
}

// A prompt fixed at the bottom of the tracker. Up and Down walk back through earlier commands.
export function CommandLine({ prompt, output, inputRef, onSubmit }: CommandLineProps) {
  const [text, setText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim() === '') return;
    onSubmit(text);
    setHistory(previous => [...previous, text]);
    setHistoryIndex(null);
    setText('');
  };

  const recall = (step: 1 | -1) => {
    if (history.length === 0) return;
    const index = Math.min(history.length, Math.max(0, (historyIndex ?? history.length) + step));
    setHistoryIndex(index === history.length ? null : index);
    setText(history[index] ?? '');
  };

  return (
    <form onSubmit={submit} className="command-line fixed bottom-0 inset-x-0 z-40 bg-bg border-t border-edge px-4 py-2 font-mono text-sm">
      <div className="max-w-4xl mx-auto">
        {output.length > 0 && (
          <pre aria-live="polite" className="text-xs text-ink-muted whitespace-pre-wrap mb-1 max-h-40 overflow-y-auto">
            {output.join('\n')}
          </pre>
        )}
        <label className="flex items-center gap-2">
          <span className="text-accent-ink flex-none">{prompt}</span>
          <input
            ref={inputRef}
            value={text}
            onChange={event => setText(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                recall(event.key === 'ArrowUp' ? -1 : 1);
              } else if (event.key === 'Escape') {
                event.currentTarget.blur();
              }
            }}
            aria-label="Command"
            autoComplete="off"
            spellCheck={false}
            placeholder="62.5x8@2, d, n, rest 120, ? for help"
            className="flex-1 min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>
    </form>
  );
}
