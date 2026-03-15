import { useState } from "react";
import { ContentBlock } from "@workspace/api-client-react/src/generated/api.schemas";
import { useSearchYoutube } from "@workspace/api-client-react";
import { Copy, Loader2, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContentBlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={i} className="text-3xl font-display font-bold mt-12 mb-6 text-foreground tracking-tight border-b pb-2">
                {block.text}
              </h2>
            );
          case 'paragraph':
            return (
              <p key={i} className="text-lg text-foreground/80 leading-relaxed mb-6">
                {block.text}
              </p>
            );
          case 'code':
            return <CodeBlock key={i} block={block} />;
          case 'video':
            return <VideoBlock key={i} block={block} />;
          case 'mcq':
            return <MCQBlock key={i} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function CodeBlock({ block }: { block: ContentBlock }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!block.text) return;
    navigator.clipboard.writeText(block.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-[#1E1E1E] my-8 shadow-xl border border-[#333]">
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
        <span className="text-xs font-mono font-medium text-white/70 uppercase tracking-wider">
          {block.language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="text-white/50 hover:text-white transition-colors flex items-center text-xs gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-[15px] font-mono leading-relaxed text-blue-100">
        <code>{block.text}</code>
      </pre>
    </div>
  );
}

function VideoBlock({ block }: { block: ContentBlock }) {
  const { data, isLoading } = useSearchYoutube(
    { query: block.query || '' },
    { query: { enabled: !!block.query } }
  );

  return (
    <div className="my-10 rounded-2xl overflow-hidden border border-border/50 bg-muted shadow-lg aspect-video relative group pdf-exclude">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Finding best video resource...</p>
        </div>
      ) : data?.videoId ? (
        <iframe
          className="w-full h-full absolute inset-0"
          src={`https://www.youtube.com/embed/${data.videoId}`}
          title={data.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-muted-foreground">
          <PlayCircle className="w-16 h-16 mb-3 opacity-20" />
          <p className="font-medium text-lg">Video resource unavailable</p>
          <p className="text-sm opacity-70">Could not find a match for "{block.query}"</p>
        </div>
      )}
    </div>
  );
}

function MCQBlock({ block }: { block: ContentBlock }) {
  const [selected, setSelected] = useState<number | null>(null);
  
  return (
    <div className="bg-card rounded-2xl p-8 border border-border shadow-md my-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <h4 className="font-display font-bold text-xl mb-6 text-foreground pr-4">
        {block.question}
      </h4>
      <div className="space-y-3">
        {block.options?.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === block.answer;
          const showReveal = selected !== null;
          
          let btnClass = "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground";
          
          if (showReveal) {
            if (isCorrect) {
              btnClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 font-medium";
            } else if (isSelected && !isCorrect) {
              btnClass = "border-destructive bg-destructive/10 text-destructive font-medium";
            } else {
              btnClass = "border-border/50 bg-background opacity-50";
            }
          }

          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              disabled={showReveal}
              className={cn(
                "w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group",
                btnClass
              )}
            >
              <span className="text-[15px] leading-snug">{opt}</span>
              {showReveal && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-3" />}
              {showReveal && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0 ml-3" />}
            </button>
          );
        })}
      </div>
      
      {selected !== null && (
        <div className={cn(
          "mt-6 p-5 rounded-xl border animate-in slide-in-from-top-2 duration-300", 
          selected === block.answer 
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-100" 
            : "bg-destructive/10 border-destructive/20 text-destructive"
        )}>
          <p className="font-bold text-lg mb-2">
            {selected === block.answer ? "Great job! That's correct." : "Not quite right."}
          </p>
          <p className="text-[15px] leading-relaxed opacity-90">{block.explanation}</p>
        </div>
      )}
    </div>
  );
}
