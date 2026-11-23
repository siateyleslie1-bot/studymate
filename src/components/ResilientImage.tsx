import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackLabel = 'StudyMate Visual',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-600 p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3 text-blue-700">
          <BookOpen className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 text-center">{fallbackLabel}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
