import { useState } from 'react'
import { imgSrc, gifSrc } from '../lib/exercises.js'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

// Big autoplaying animation; tap toggles to the still frame. `compact` shrinks it (superset cards).
// Custom exercises have no media — the animation stays blank by design (issue #11).
// `minimizable` (workout view) adds a persistent minimize/expand control so the animation stops
// eating the screen; the chosen size is saved to settings and carries across exercises and
// future workouts (issue #12).
export default function Media({ ex, id, compact, minimizable }) {
  const [playing, setPlaying] = useState(true)
  const gifSize = useStore(s => s.S.gifSize)
  const update = useStore(s => s.update)
  if (!ex.gif) return null
  const mini = minimizable && gifSize === 'mini'
  const toggleSize = e => { e.stopPropagation(); update(s => { s.gifSize = mini ? 'full' : 'mini' }) }
  return (
    <div
      className={'exmedia' + (compact ? ' compact' : '') + (mini ? ' mini' : '')}
      id={id}
      onClick={() => setPlaying(p => !p)}
      style={{
        position: 'relative',
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'var(--surface-2)',
        border: '1px solid var(--card-border)',
        marginBottom: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      <img
        decoding="async"
        src={playing ? gifSrc(ex) : imgSrc(ex)}
        alt={ex.n}
        style={{
          width: '100%',
          height: mini ? '110px' : compact ? '140px' : '200px',
          objectFit: 'contain',
          display: 'block',
          mixBlendMode: 'multiply'
        }}
      />
      {minimizable && (
        <button
          className="giftoggle"
          onClick={toggleSize}
          type="button"
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: '99px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer'
          }}
        >
          <Icon name={mini ? 'expand' : 'minimize'} />{mini ? t('Expand Visual') : t('Compact')}
        </button>
      )}
      {!mini && (
        <span
          className="gifhint"
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            pointerEvents: 'none',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            borderRadius: '99px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Icon name={playing ? 'pause' : 'play'} />{playing ? t('Tap to pause') : t('Tap to play')}
        </span>
      )}
    </div>
  )
}

export function Thumb({ ex }) {
  if (!ex.img) return <div className="thumb thumb-x"><Icon name="dumbbell" /></div>
  return <img className="thumb" loading="lazy" decoding="async" src={imgSrc(ex)} alt="" />
}
