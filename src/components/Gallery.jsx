import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

function Lightbox({ images, index, onIndex, onClose, alt }) {
  const count = images.length;
  const go = step => onIndex((index + step + count) % count);

  // Capture phase so Escape/arrows don't also reach the detail dialog underneath.
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) go(-1);
      else if (e.key === 'ArrowRight' && count > 1) go(1);
      else return;
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  return createPortal(
    <div className="gal-lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <img src={images[index].src} alt={`${alt} - ảnh ${index + 1}`} onClick={e => e.stopPropagation()} />
      <button className="gal-lightbox-close" onClick={onClose} aria-label="Đóng ảnh" title="Đóng (Esc)">
        <X className="h-5 w-5" />
      </button>
      {count > 1 && (
        <>
          <button
            className="gal-nav gal-prev"
            onClick={e => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="gal-nav gal-next"
            onClick={e => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Ảnh sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="gal-count">
            {index + 1}/{count}
          </span>
        </>
      )}
    </div>,
    document.body,
  );
}

export default function Gallery({ images, alt }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;
  if (count === 0) return null;
  const go = step => setIndex(i => (i + step + count) % count);

  return (
    <div className="gal">
      <div className="gal-main">
        <button type="button" className="gal-main-btn" onClick={() => setZoomed(true)} title="Bấm để xem ảnh lớn">
          <img src={images[index].src} alt={`${alt} - ảnh ${index + 1}`} />
        </button>
        {count > 1 && (
          <>
            <button type="button" className="gal-nav gal-prev" onClick={() => go(-1)} aria-label="Ảnh trước">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="gal-nav gal-next" onClick={() => go(1)} aria-label="Ảnh sau">
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="gal-count">
              {index + 1}/{count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="gal-thumbs">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              className={`gal-thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === index}
            >
              <img src={img.thumb} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoomed && (
        <Lightbox images={images} index={index} onIndex={setIndex} onClose={() => setZoomed(false)} alt={alt} />
      )}
    </div>
  );
}
