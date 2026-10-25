'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AiModel,
  createConversation,
  getRagStatus,
  queryRag,
  RagCitation,
  streamChatMessage,
} from '../../lib/api';

type AiCopilotDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  activeNoteId?: string;
  activeNoteTitle?: string;
  onInsertText?: (text: string) => void;
  initialQuery?: string;
};

function getModelIcon(modelId: string): string {
  const m = modelId.toLowerCase();
  if (m.includes('gemini')) return '🔮';
  if (m.includes('groq') || m.includes('gpt-oss') || m.includes('versatile')) return '⚡';
  if (m.includes('llama') || m.includes('ollama')) return '🦙';
  if (m.includes('gpt') || m.includes('openai')) return '🤖';
  return '✨';
}

function getModelDisplayName(modelId: string, modelList: AiModel[]): string {
  const found = modelList.find(m => m.id === modelId);
  if (found?.name) return found.name;
  if (modelId === 'gemini-2.0-flash') return 'Gemini 2.0 Flash';
  if (modelId === 'gemini-3.8-flash') return 'Gemini 3.8 Flash';
  if (modelId === 'openai/gpt-oss-120b') return 'GPT-OSS 120B (Groq)';
  if (modelId === 'llama-3.3-70b-versatile') return 'Llama 3.3 70B (Groq)';
  if (modelId === 'openai/gpt-oss-20b') return 'GPT-OSS 20B (Groq Fast)';
  return modelId;
}

export default function AiCopilotDrawer({
  isOpen,
  onClose,
  activeNoteId,
  activeNoteTitle,
  onInsertText,
  initialQuery,
}: AiCopilotDrawerProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [scope, setScope] = useState<'current' | 'workspace'>(activeNoteId ? 'current' : 'workspace');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<RagCitation[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [lastQuery, setLastQuery] = useState('');
  const [answeredByModel, setAnsweredByModel] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('noteform_copilot_model');
      if (saved) {
        setSelectedModel(saved);
      }
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      getRagStatus()
        .then((res) => {
          if (res.available_models?.length) {
            setModels(res.available_models);
            const saved = typeof window !== 'undefined' ? localStorage.getItem('noteform_copilot_model') : null;
            if (!saved) {
              const defaultModel = res.available_models.find((m) => m.is_default) || res.available_models[0];
              if (defaultModel) setSelectedModel(defaultModel.id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAsk = async (overrideModel?: string) => {
    const q = (overrideModel ? (lastQuery || query) : query).trim();
    if (!q || isLoading) return;
    const modelToUse = overrideModel || selectedModel;

    setIsLoading(true);
    setAnswer('');
    setCitations([]);
    setLastQuery(q);

    try {
      const res = await queryRag({
        query: q,
        model: modelToUse,
        note_id_filter: scope === 'current' && activeNoteId ? [activeNoteId] : undefined,
      });

      setAnswer(res.answer);
      setCitations(res.citations || []);
      setAnsweredByModel(modelToUse);
    } catch (err: any) {
      setAnswer(`Error querying AI: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (nextModel: string) => {
    setSelectedModel(nextModel);
    if (typeof window !== 'undefined') {
      localStorage.setItem('noteform_copilot_model', nextModel);
    }
  };

  const handleInsert = () => {
    if (answer && onInsertText) {
      onInsertText(answer);
      onClose();
    }
  };

  return (
    <div className="copilot-drawer-overlay" onClick={onClose}>
      <aside className="copilot-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="copilot-drawer-header">
          <div className="copilot-drawer-title-row">
            <span className="copilot-sparkle">✨</span>
            <div className="copilot-title-texts">
              <h3>AI Workspace Copilot</h3>
              <span className="copilot-active-model-pill">
                {getModelIcon(selectedModel)} {getModelDisplayName(selectedModel, models)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="copilot-close-btn" title="Close Copilot (Esc)">
            ✕
          </button>
        </div>

        {/* LLM Model Switcher Bar */}
        <div className="copilot-model-bar">
          <div className="copilot-model-select-group">
            <span className="copilot-model-icon">{getModelIcon(selectedModel)}</span>
            <span className="copilot-model-label">Switch LLM:</span>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="copilot-model-select"
              aria-label="Switch LLM Model"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id} {m.provider ? `(${m.provider.toUpperCase()})` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fastest, High Quota)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Latest Google)</option>
                  <option value="openai/gpt-oss-120b">GPT-OSS 120B (Groq Ultra-Speed)</option>
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq Versatile)</option>
                  <option value="openai/gpt-oss-20b">GPT-OSS 20B (Groq Fast)</option>
                </>
              )}
              {models.length > 0 && !models.some(m => m.id === 'gemini-2.0-flash') && (
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Google)</option>
              )}
              {models.length > 0 && !models.some(m => m.id === 'gemini-3.8-flash') && (
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Google)</option>
              )}
              {models.length > 0 && !models.some(m => m.id === 'openai/gpt-oss-120b') && (
                <option value="openai/gpt-oss-120b">GPT-OSS 120B (Groq)</option>
              )}
              {models.length > 0 && !models.some(m => m.id === 'llama-3.3-70b-versatile') && (
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
              )}
            </select>
          </div>
        </div>

        {/* Quick Switch Chips */}
        <div className="copilot-model-chips">
          {[
            { id: 'gemini-2.0-flash', label: 'Gemini 2.0', icon: '🔮' },
            { id: 'openai/gpt-oss-120b', label: 'Groq 120B', icon: '⚡' },
            { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3', icon: '⚡' },
            { id: 'openai/gpt-oss-20b', label: 'Groq Fast', icon: '⚡' },
          ].map((qm) => (
            <button
              key={qm.id}
              type="button"
              className={`copilot-model-chip ${selectedModel === qm.id ? 'active' : ''}`}
              onClick={() => handleModelChange(qm.id)}
            >
              <span>{qm.icon}</span>
              <span>{qm.label}</span>
            </button>
          ))}
        </div>

        {/* Scope Selector */}
        <div className="copilot-scope-bar">
          {activeNoteId && (
            <button
              onClick={() => setScope('current')}
              className={`copilot-scope-chip ${scope === 'current' ? 'active' : ''}`}
            >
              📄 Current Note: {activeNoteTitle ? activeNoteTitle.slice(0, 18) + '...' : 'Untitled'}
            </button>
          )}
          <button
            onClick={() => setScope('workspace')}
            className={`copilot-scope-chip ${scope === 'workspace' ? 'active' : ''}`}
          >
            🌐 All Notes (RAG)
          </button>
        </div>

        {/* Query Input */}
        <div className="copilot-query-box">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder={
              scope === 'current'
                ? 'Ask about this note, e.g. "Summarize key points"'
                : 'Ask across all notes, e.g. "What did we decide about auth?"'
            }
            className="copilot-input"
          />
          <button onClick={() => handleAsk()} disabled={isLoading || !query.trim()} className="copilot-ask-btn">
            {isLoading ? 'Thinking...' : 'Ask'}
          </button>
        </div>

        {/* Answer Content */}
        <div className="copilot-drawer-body">
          {isLoading && (
            <div className="copilot-loading-skeleton">
              <div className="copilot-skeleton-line short" />
              <div className="copilot-skeleton-line" />
              <div className="copilot-skeleton-line" />
            </div>
          )}

          {!isLoading && !answer && (
            <div className="copilot-empty-state">
              <p>Type a question above to retrieve context-grounded answers from your workspace notes.</p>
              <div className="copilot-presets">
                <button onClick={() => { setQuery('Summarize this note in 3 bullet points'); setScope('current'); }} className="copilot-preset-btn">
                  📌 3-bullet summary
                </button>
                <button onClick={() => { setQuery('Extract action items and TODOs'); setScope('current'); }} className="copilot-preset-btn">
                  ✅ Extract TODOs
                </button>
                <button onClick={() => { setQuery('What are the main topics in my workspace?'); setScope('workspace'); }} className="copilot-preset-btn">
                  🔍 Workspace overview
                </button>
              </div>
            </div>
          )}

          {!isLoading && answer && (
            <div className="copilot-answer-card">
              <div className="copilot-answer-meta-bar">
                <span className="copilot-answer-model-badge">
                  {getModelIcon(answeredByModel || selectedModel)} Generated with {getModelDisplayName(answeredByModel || selectedModel, models)}
                </span>
                {answeredByModel && answeredByModel !== selectedModel && (
                  <button
                    type="button"
                    className="copilot-reask-btn"
                    onClick={() => handleAsk(selectedModel)}
                    title={`Re-run this question with ${getModelDisplayName(selectedModel, models)}`}
                  >
                    🔄 Re-ask with {getModelDisplayName(selectedModel, models)}
                  </button>
                )}
              </div>

              <div className="copilot-answer-text">{answer}</div>

              {citations.length > 0 && (
                <div className="copilot-citations">
                  <span className="copilot-citations-title">Sources Referenced:</span>
                  <ul>
                    {citations.map((c, i) => (
                      <li key={i}>
                        <strong>{c.note_title}</strong>: <em>{c.snippet.slice(0, 90)}...</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {onInsertText && (
                <div className="copilot-actions">
                  <button onClick={handleInsert} className="copilot-insert-btn">
                    📋 Insert into Note
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(answer);
                      alert('Copied to clipboard!');
                    }}
                    className="copilot-copy-btn"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
