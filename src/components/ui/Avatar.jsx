import { useState } from 'react'

/**
 * Avatar — Shared avatar component.
 * Renders image from src (avatar_url) if available, otherwise shows initial letter.
 */
export default function Avatar({ src, name, size = 56, className = '' }) {
  const [imgError, setImgError] = useState(false)
  const initialName = name && name.trim() ? name.trim() : '?'
  const initial = initialName[0].toUpperCase()
  const showImage = src && !imgError

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {showImage && (
        <img
          src={src}
          alt={name ?? 'Avatar'}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
        />
      )}
      <div
        className={`absolute inset-0 rounded-xl flex items-center justify-center font-display font-black text-white bg-violet-600 ${showImage ? 'invisible' : ''}`}
        style={{ fontSize: size * 0.35 }}
      >
        {initial}
      </div>
    </div>
  )
}
