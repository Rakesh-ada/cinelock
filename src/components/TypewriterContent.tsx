"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

const MarkdownDisplay = ({ content }: { content: string }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                    <div className="relative group/code my-4 rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e]">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/5">
                            <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
                        </div>
                        <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-cream-white/90" {...props}>
                        {children}
                    </code>
                );
            },
            p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-200">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-200">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-200">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-cream-white mt-6 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-cream-white mt-5">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-cream-white mt-4">{children}</h3>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-cinelock-accent/50 pl-4 py-1 my-4 bg-white/5 rounded-r italic text-gray-300">{children}</blockquote>,
            table: ({ children }) => <div className="overflow-x-auto my-4 rounded-lg border border-white/10"><table className="min-w-full text-sm text-left">{children}</table></div>,
            thead: ({ children }) => <thead className="bg-white/10 text-cream-white font-medium">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-white/5 bg-black/20">{children}</tbody>,
            tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
            th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
            td: ({ children }) => <td className="px-4 py-3 text-gray-300">{children}</td>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cinelock-accent hover:underline hover:text-blue-300 transition-colors">{children}</a>,
        }}
    >
        {content}
    </ReactMarkdown>
);

export const TypewriterContent = ({ content, onComplete }: { content: string, onComplete?: () => void }) => {
    const [displayContent, setDisplayContent] = useState("");

    useEffect(() => {
        let index = 0;
        // Immediate start
        if (content.length > 0) {
            setDisplayContent(content.charAt(0));
            index = 1;
        }

        const timer = setInterval(() => {
            if (index < content.length) {
                setDisplayContent((prev) => prev + content.charAt(index));
                index++;
            } else {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
        }, 10); // Adjust speed here

        return () => clearInterval(timer);
    }, [content, onComplete]);

    return <MarkdownDisplay content={displayContent} />;
};
