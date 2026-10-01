import { useState, type FormEvent, type RefObject } from 'react';

interface CommandLineProps {
  output: string[]; // the replies to the last command, oldest first
  inputRef: RefObject<HTMLInputElement | null>;
  onSubmit: (text: string) => void;
}

// A quiet row at the foot of the tracker, for logging from the keyboard. Up and Down walk
// back through earlier commands.
export function CommandLine({ output, inputRef, onSubmit }: CommandLineProps) {
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
    <form onSubmit={submit} className="flex-none bg-inset border-t border-line px-6 py-3">
      <div className="max-w-[90rem] mx-auto">
        {output.length > 0 && (
          <pre aria-live="polite" className="font-mono text-base text-ink-muted whitespace-pre-wrap mb-2 max-h-40 overflow-y-auto">
            {output.join('\n')}
          </pre>
        )}
        <label className="flex items-center gap-4">
          <span className="section-label flex-none">Type a set</span>
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
            placeholder="62.5x8@2 logs the next set. / jumps here, ? lists every command."
            className="flex-1 min-w-0 bg-transparent font-mono text-lg text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>
    </form>
  );
}
