import { useState } from 'react'

import { Icon } from './Icons.jsx'

export default function ImageWithFallback({ src, publicSrc, alt, className = '' }) {
  // The portable catalog ships its own images. Browsing never needs a remote image host.
  const sources = src ? [src] : []
  return <ImageCandidates key={JSON.stringify(sources)} sources={sources} alt={alt} className={className} />
}

function ImageCandidates({ sources, alt, className }) {
  const [index, setIndex] = useState(0)
  if (!sources[index]) {
    return <div className={`image-fallback ${className}`} role="img" aria-label={`${alt}（图片不可用）`}><Icon name="factory" size={22} /></div>
  }
  return <img key={index} className={className} src={sources[index]} alt={alt} loading="lazy" decoding="async" onError={() => setIndex(index + 1)} />
}
