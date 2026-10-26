import { useRef, useState, type ChangeEvent } from 'react';
import { api } from '../lib/api';

type Props = {
  eyebrow: string;
  icon?: string;
  title: string;
  description: string;
  action?: string;
  endpoint?: string;
  accept?: string;
};

/* ── Empty-state icon map ──────────────────────────── */
const emptyStateMessages: Record<string, { emoji: string; hint: string }> = {
  '🎯': { emoji: '🎯', hint: 'Add verified skill entries to build your evidence profile.' },
  '🗺️': { emoji: '🗺️', hint: 'Select a target role to unlock personalised career paths.' },
  '💼': { emoji: '💼', hint: 'Complete your profile to see matching job listings.' },
  '🎤': { emoji: '🎤', hint: 'Practice sessions will appear here after you start an interview.' },
  '🛣️': { emoji: '🛣️', hint: 'Your roadmap generates once resume and skills are recorded.' },
  '📊': { emoji: '📊', hint: 'Charts will appear when assessment data is available.' },
  '👤': { emoji: '👤', hint: 'Fill in your education and target role to personalise everything.' },
};

export function FeaturePage({ eyebrow, icon, title, description, action, endpoint, accept }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyMeta = icon ? emptyStateMessages[icon] : null;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    setFile(chosen);
    setStatus('');
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    // Validate extension
    if (accept) {
      const exts = accept.split(',').map((s) => s.trim().toLowerCase());
      const fileExt = '.' + dropped.name.split('.').pop()?.toLowerCase();
      if (!exts.includes(fileExt)) {
        setStatus(`Please upload a valid file: ${accept}`);
        return;
      }
    }
    setFile(dropped);
    setStatus('');
  }

  async function handleUpload() {
    if (!endpoint || !file) return;
    setStatus('Uploading securely…');
    setIsUploading(true);

    try {
      const body = new FormData();
      body.append('resume', file);
      await api(endpoint, { method: 'POST', body });
      setStatus('✅ Uploaded successfully. Processing will appear here once the API is running.');
      setFile(null);
    } catch (error) {
      setStatus(`❌ ${error instanceof Error ? error.message : 'The request failed. Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="feature-page fade-up" aria-labelledby="feature-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="feature-title">{title}</h2>
      <p className="feature-description">{description}</p>

      <div className="empty-panel">
        {accept ? (
          /* ── File upload flow ─────────────────────── */
          <div className="file-input-wrap">
            {/* Drop zone */}
            <label
              className={`file-drop-zone transition-all duration-300 hover:border-indigo-400 hover:shadow-md cursor-pointer ${file ? 'has-file' : ''} ${isDragging ? 'has-file scale-[1.02]' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              htmlFor="file-upload"
              aria-label="Drop file here or click to browse"
            >
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                disabled={isUploading}
                aria-label="Choose a file to upload"
              />
              <div className="drop-icon transition-transform duration-300 hover:scale-110" aria-hidden="true">
                {file ? '📄' : '☁️'}
              </div>
              {file ? (
                <>
                  <p className="file-name font-semibold text-indigo-600">{file.name}</p>
                  <p style={{ fontSize: '0.78rem', marginTop: 4, opacity: 0.7 }}>
                    {(file.size / 1024).toFixed(0)} KB · Click to replace
                  </p>
                </>
              ) : (
                <>
                  <p>Drag &amp; drop your {accept} file here</p>
                  <p style={{ fontSize: '0.78rem', marginTop: 4, opacity: 0.7 }}>
                    or click to browse your computer
                  </p>
                </>
              )}
            </label>

            {/* Upload button */}
            <button
              className="btn-primary transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
              disabled={!file || isUploading}
              onClick={handleUpload}
              type="button"
              style={{ width: '100%', maxWidth: 420 }}
            >
              {isUploading ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255, 255, 255, 0.35)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                    aria-hidden="true"
                  />
                  Uploading…
                </>
              ) : (
                <>{action} <span aria-hidden="true">↗</span></>
              )}
            </button>

            {/* Status message */}
            {status && (
              <p className="status-text" role="status" aria-live="polite">
                {status}
              </p>
            )}
          </div>
        ) : (
          /* ── Empty state ──────────────────────────── */
          <>
            <div className="empty-icon" aria-hidden="true">
              {icon ?? '+'}
            </div>
            <h3>{action ?? 'Nothing to show yet'}</h3>
            <p>
              {emptyMeta?.hint ??
                'Your private evidence will appear here after you connect this part of your profile.'}
            </p>
            <button className="btn-secondary" type="button" style={{ marginTop: 8 }}>
              Get started <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
