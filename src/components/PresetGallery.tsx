import { RotateCcw } from 'lucide-react';
import type { CompositionManifest } from '../types';

type PresetGalleryProps = {
  presets: CompositionManifest[];
  activeId: string;
  onSelect: (id: string) => void;
  onReset: (id: string) => void;
};

export function PresetGallery({ presets, activeId, onSelect, onReset }: PresetGalleryProps) {
  return (
    <div className="preset-gallery">
      {presets.map((preset, index) => (
        <article
          key={preset.id}
          className={`preset-card ${activeId === preset.id ? 'is-active' : ''}`}
        >
          <button className="preset-select" onClick={() => onSelect(preset.id)}>
            <span className="preset-index">0{index + 1}</span>
            <img src={preset.referenceImage} alt="" />
            <span className="preset-copy">
              <strong>{preset.name}</strong>
              <small>{preset.description}</small>
            </span>
          </button>
          <button className="preset-reset" onClick={() => onReset(preset.id)}>
            <RotateCcw size={13} />
            Сбросить к эталону
          </button>
        </article>
      ))}
    </div>
  );
}
