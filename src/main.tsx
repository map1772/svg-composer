import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronsDown,
  ChevronsUp,
  CircleDollarSign,
  Download,
  Eye,
  FlipHorizontal2,
  Flower2,
  FolderOpen,
  Headphones,
  ImagePlus,
  LampDesk,
  Layers3,
  Palette,
  PenLine,
  Puzzle,
  RotateCcw,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  WalletCards,
  Wand2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SceneCanvas } from './components/SceneCanvas';
import { PresetGallery } from './components/PresetGallery';
import { assetIds, assetLibrary } from './data/assetLibrary';
import {
  compositionPresets,
  findPreset,
  instantiateManifest,
} from './data/compositionPresets';
import { canvasFormats, palettes } from './data/palettes';
import { buildSceneSvg, downloadSvg } from './lib/exportSvg';
import { calculateCompositionScore } from './lib/sceneGeometry';
import type {
  AssetId,
  AssetRole,
  BackgroundTemplateId,
  CanvasFormat,
  DetailSize,
  PaletteName,
  SceneObjectModel,
} from './types';
import './styles.css';

const iconMap: Record<AssetId, LucideIcon> = {
  book: BookOpen,
  smartphone: Smartphone,
  puzzle: Puzzle,
  coin: CircleDollarSign,
  headphones: Headphones,
  lamp: LampDesk,
  flowers: Flower2,
  wallet: WalletCards,
  folder: FolderOpen,
  pen: PenLine,
};

const requestedPresetId = new URLSearchParams(window.location.search).get('preset');
const initialPreset = findPreset(requestedPresetId ?? '') ?? compositionPresets[0];

function createId() {
  return crypto.randomUUID();
}

function getNextZIndex(objects: SceneObjectModel[]) {
  return objects.length === 0 ? 10 : Math.max(...objects.map((object) => object.zIndex)) + 10;
}

function sanitizeUploadedSvg(source: string) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(source, 'image/svg+xml');
  if (documentNode.querySelector('parsererror') || documentNode.documentElement.tagName !== 'svg') {
    throw new Error('Файл не содержит корректный SVG');
  }

  documentNode.querySelectorAll('script, foreignObject, style').forEach((node) => node.remove());
  documentNode.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      const externalReference =
        (name === 'href' || name.endsWith(':href')) &&
        !value.startsWith('#') &&
        !value.startsWith('data:image/');
      if (
        name.startsWith('on') ||
        value.startsWith('javascript:') ||
        value.includes('url(http') ||
        externalReference
      ) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  const root = documentNode.documentElement;
  const viewBox = root.getAttribute('viewBox')?.split(/[ ,]+/).map(Number);
  const width = viewBox?.length === 4 && viewBox[2] > 0 ? viewBox[2] : Number.parseFloat(root.getAttribute('width') ?? '600');
  const height = viewBox?.length === 4 && viewBox[3] > 0 ? viewBox[3] : Number.parseFloat(root.getAttribute('height') ?? '600');
  const serialized = new XMLSerializer().serializeToString(root);
  return {
    href: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`,
    pixelWidth: Number.isFinite(width) && width > 0 ? width : 600,
    pixelHeight: Number.isFinite(height) && height > 0 ? height : 600,
  };
}

function App() {
  const [activePresetId, setActivePresetId] = useState(initialPreset.id);
  const [objects, setObjects] = useState<SceneObjectModel[]>(() =>
    instantiateManifest(initialPreset),
  );
  const [sceneBaseSize, setSceneBaseSize] = useState(initialPreset.baseSize);
  const [format, setFormat] = useState<CanvasFormat>(initialPreset.format);
  const [detailSize, setDetailSize] = useState<DetailSize>('L');
  const [paletteName, setPaletteName] = useState<PaletteName>(initialPreset.palette);
  const [backgroundTemplate, setBackgroundTemplate] = useState<BackgroundTemplateId>(
    initialPreset.backgroundTemplate,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    objects.length > 0 ? objects[objects.length - 1].id : null,
  );
  const [headline, setHeadline] = useState('');
  const [componentText, setComponentText] = useState('');
  const [variant, setVariant] = useState(1);
  const [showDocs, setShowDocs] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selfContained, setSelfContained] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);

  const activePreset = findPreset(activePresetId) ?? initialPreset;
  const dimensions = canvasFormats[format];
  const palette = palettes[paletteName];
  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedId) ?? null,
    [objects, selectedId],
  );
  const score = useMemo(
    () => calculateCompositionScore(objects, activePreset),
    [objects, activePreset],
  );

  function setScene(nextObjects: SceneObjectModel[]) {
    setObjects(nextObjects);
    const topObject = [...nextObjects].sort((left, right) => right.zIndex - left.zIndex)[0];
    setSelectedId(topObject?.id ?? null);
  }

  function applyPreset(id: string) {
    const preset = findPreset(id);
    if (!preset) return;
    setActivePresetId(preset.id);
    setSceneBaseSize(preset.baseSize);
    setFormat(preset.format);
    setPaletteName(preset.palette);
    setBackgroundTemplate(preset.backgroundTemplate);
    setScene(instantiateManifest(preset));
    setNotice('Эталонная композиция восстановлена');
  }

  function updateObject(id: string, patch: Partial<SceneObjectModel>) {
    setObjects((current) =>
      current.map((object) => (object.id === id ? { ...object, ...patch } : object)),
    );
  }

  function addObject(assetId: AssetId, role: AssetRole = 'main') {
    const index = objects.length;
    const object: SceneObjectModel = {
      id: createId(),
      assetId,
      role,
      x: 0.42 + (index % 3) * 0.08,
      y: 0.42 + (index % 2) * 0.1,
      width: assetLibrary[assetId].defaultWidth,
      rotation: 0,
      opacity: 1,
      zIndex: getNextZIndex(objects),
      flipX: false,
    };
    setObjects((current) => [...current, object]);
    setSelectedId(object.id);
  }

  function autoBuild(text: string) {
    const query = text.toLowerCase();
    const matches = assetIds.filter((assetId) => {
      const asset = assetLibrary[assetId];
      return (
        query.includes(asset.label.toLowerCase()) ||
        asset.tags.some((tag) => query.includes(tag))
      );
    });
    const selectedAssets = (matches.length > 0 ? matches : ['smartphone', 'puzzle']).slice(0, 5) as AssetId[];
    const nextObjects = selectedAssets.map<SceneObjectModel>((assetId, index) => ({
      id: createId(),
      assetId,
      role: index === 0 && selectedAssets.length > 2 ? 'background' : 'main',
      x: [0.28, 0.61, 0.48, 0.72, 0.3][index],
      y: [0.32, 0.33, 0.64, 0.68, 0.76][index],
      width: assetLibrary[assetId].defaultWidth,
      rotation: index % 2 === 0 ? -5 : 8,
      opacity: 1,
      zIndex: (index + 1) * 10,
      flipX: false,
    }));
    setSceneBaseSize({ width: 600, height: 600 });
    setScene(nextObjects);
  }

  function parseComponents() {
    const chunks = componentText
      .split(',')
      .map((chunk) => chunk.trim().toLowerCase())
      .filter(Boolean);
    const parsed = chunks
      .map((chunk) => {
        const assetId = assetIds.find((id) => {
          const asset = assetLibrary[id];
          return (
            chunk.includes(id) ||
            chunk.includes(asset.label.toLowerCase()) ||
            asset.tags.some((tag) => chunk.includes(tag))
          );
        });
        if (!assetId) return null;
        return { assetId, role: chunk.includes('фон') ? 'background' : 'main' } as const;
      })
      .filter((value): value is { assetId: AssetId; role: AssetRole } => value !== null);

    if (parsed.length === 0) {
      setNotice('Не удалось распознать объекты');
      return;
    }

    setScene(
      parsed.map((entry, index) => ({
        id: createId(),
        assetId: entry.assetId,
        role: entry.role,
        x: [0.25, 0.58, 0.45, 0.72, 0.3][index % 5],
        y: [0.3, 0.34, 0.62, 0.7, 0.78][index % 5],
        width: assetLibrary[entry.assetId].defaultWidth,
        rotation: index % 2 === 0 ? -4 : 8,
        opacity: 1,
        zIndex: entry.role === 'background' ? (index + 1) * 10 : 100 + (index + 1) * 10,
        flipX: false,
      })),
    );
  }

  function recompose() {
    setVariant((current) => (current % 3) + 1);
    setObjects((current) =>
      current.map((object, index) => ({
        ...object,
        x: Math.min(1.25, Math.max(-0.25, object.x + (variant % 2 === 0 ? 0.05 : -0.05))),
        y: Math.min(1.25, Math.max(-0.25, object.y + (index % 2 === 0 ? -0.025 : 0.025))),
        rotation: object.rotation + 15,
      })),
    );
  }

  function shiftLayer(direction: 'back' | 'forward' | 'bottom' | 'top') {
    if (!selectedObject) return;
    const ordered = [...objects].sort((left, right) => left.zIndex - right.zIndex);
    const index = ordered.findIndex((object) => object.id === selectedObject.id);
    if (index < 0) return;

    if (direction === 'bottom' || direction === 'top') {
      const targetZ =
        direction === 'bottom'
          ? Math.min(...objects.map((object) => object.zIndex)) - 10
          : Math.max(...objects.map((object) => object.zIndex)) + 10;
      updateObject(selectedObject.id, { zIndex: targetZ });
      return;
    }

    const neighbourIndex = direction === 'back' ? index - 1 : index + 1;
    const neighbour = ordered[neighbourIndex];
    if (!neighbour) return;
    setObjects((current) =>
      current.map((object) => {
        if (object.id === selectedObject.id) return { ...object, zIndex: neighbour.zIndex };
        if (object.id === neighbour.id) return { ...object, zIndex: selectedObject.zIndex };
        return object;
      }),
    );
  }

  function setObjectRole(object: SceneObjectModel, role: AssetRole) {
    if (object.role === role) return;
    const layerBoundary =
      role === 'background'
        ? Math.min(...objects.map((item) => item.zIndex)) - 10
        : Math.max(...objects.map((item) => item.zIndex)) + 10;
    updateObject(object.id, { role, zIndex: layerBoundary });
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const sanitized = sanitizeUploadedSvg(await file.text());
      const object: SceneObjectModel = {
        id: createId(),
        assetId: 'puzzle',
        role: 'main',
        x: 0.5,
        y: 0.5,
        width: 0.5,
        rotation: 0,
        opacity: 1,
        zIndex: getNextZIndex(objects),
        flipX: false,
        customAsset: { ...sanitized, name: file.name },
      };
      setObjects((current) => [...current, object]);
      setSelectedId(object.id);
      setNotice('SVG добавлен на сцену');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось загрузить SVG');
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const svg = await buildSceneSvg({
        dimensions,
        baseSize: sceneBaseSize,
        backgroundTemplate,
        palette,
        objects,
        detailSize,
        selfContained,
      });
      downloadSvg(svg, `composition-${dimensions.label.replace(':', 'x')}.svg`);
      setNotice(selfContained ? 'SVG сохранён со встроенными PNG' : 'SVG сохранён со ссылками на PNG');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось экспортировать SVG');
    } finally {
      setExporting(false);
    }
  }

  function removeSelected() {
    if (!selectedObject) return;
    const next = objects.filter((object) => object.id !== selectedObject.id);
    setObjects(next);
    setSelectedId(next.length > 0 ? next[next.length - 1].id : null);
  }

  const appStyle = {
    '--surface': palette.bgSurface,
    '--secondary': palette.bgSecondary,
    '--accent': palette.bgAccent,
  } as CSSProperties;

  return (
    <div className="app" style={appStyle}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div>
            <strong>ИЗОКОНСТРУКТОР</strong>
            <span>Композиционная студия</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="button secondary-button" onClick={() => setShowDocs(true)}>
            <BookOpen size={16} /> Документация
          </button>
          <button
            className={`button secondary-button ${showComparison ? 'is-active' : ''}`}
            onClick={() => setShowComparison((current) => !current)}
          >
            <Eye size={16} /> {showComparison ? 'Редактор' : 'Сравнить'}
          </button>
          <button className="button primary-button" onClick={handleExport} disabled={exporting}>
            <Download size={16} /> {exporting ? 'Сборка…' : 'Скачать SVG'}
          </button>
        </div>
      </header>

      <main className="app-layout">
        <aside className="sidebar">
          <section className="control-section">
            <div className="section-label">СЦЕНА</div>
            <div className="segmented three-columns">
              {(Object.keys(canvasFormats) as CanvasFormat[]).map((value) => (
                <button
                  key={value}
                  className={format === value ? 'active' : ''}
                  onClick={() => setFormat(value)}
                >
                  {canvasFormats[value].label}
                </button>
              ))}
            </div>
            <div className="segmented two-columns">
              {(['L', 'S'] as DetailSize[]).map((value) => (
                <button
                  key={value}
                  className={detailSize === value ? 'active' : ''}
                  onClick={() => setDetailSize(value)}
                  title="Меняет PNG-файл, но не геометрию объекта"
                >
                  PNG {value}
                </button>
              ))}
            </div>
            <label className="field-label" htmlFor="background-template">Фоновая геометрия</label>
            <select
              id="background-template"
              value={backgroundTemplate}
              onChange={(event) => setBackgroundTemplate(event.target.value as BackgroundTemplateId)}
            >
              <option value="lines">Линии и блики</option>
              <option value="corner">Угловая плоскость</option>
              <option value="clean">Чистый фон</option>
            </select>
          </section>

          <section className="control-section">
            <div className="section-label">АВТОСБОРКА</div>
            <label className="field-label" htmlFor="headline">Заголовок или метафора</label>
            <textarea
              id="headline"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="Например: безопасность личных финансов"
            />
            <button className="button primary-button full-width" onClick={() => autoBuild(headline)}>
              <Wand2 size={16} /> Собрать по смыслу
            </button>
            <label className="field-label" htmlFor="components">Компоненты через запятую</label>
            <input
              id="components"
              value={componentText}
              onChange={(event) => setComponentText(event.target.value)}
              placeholder="книга, смартфон, пазл"
            />
            <button className="button secondary-button full-width" onClick={parseComponents}>
              <Sparkles size={16} /> Собрать по названиям
            </button>
            <button className="button secondary-button full-width" onClick={recompose}>
              <RotateCcw size={16} /> Перекомпоновать · {variant}
            </button>
          </section>

          <section className="control-section">
            <div className="section-label">ПАЛИТРА</div>
            <div className="palette-row">
              {(Object.keys(palettes) as PaletteName[]).map((name) => (
                <button
                  key={name}
                  className={`swatch ${paletteName === name ? 'chosen' : ''}`}
                  onClick={() => setPaletteName(name)}
                  style={{ background: palettes[name].bgSurface }}
                  title={name}
                  aria-label={`Палитра ${name}`}
                >
                  <i style={{ background: palettes[name].objAccent2 }} />
                  <i style={{ background: palettes[name].bgAccent }} />
                </button>
              ))}
            </div>
            <div className="palette-name">
              <Palette size={15} /> {paletteName}
            </div>
          </section>

          <section className="control-section">
            <div className="section-label">БИБЛИОТЕКА PNG</div>
            <div className="object-grid">
              {assetIds.map((assetId) => {
                const Icon = iconMap[assetId];
                return (
                  <button key={assetId} onClick={() => addObject(assetId)}>
                    <Icon size={18} />
                    <span>{assetLibrary[assetId].label}</span>
                  </button>
                );
              })}
            </div>
            <button className="upload-button" onClick={() => uploadRef.current?.click()}>
              <Upload size={16} /> Загрузить SVG
            </button>
            <input
              ref={uploadRef}
              className="visually-hidden"
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleUpload}
            />
          </section>

          <section className="control-section export-options">
            <div className="section-label">ЭКСПОРТ</div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={selfContained}
                onChange={(event) => setSelfContained(event.target.checked)}
              />
              Встраивать PNG как data URL
            </label>
          </section>
        </aside>

        <section className="workspace">
          <div className="workspace-top">
            <div>
              <div className="eyebrow">РАБОЧАЯ ОБЛАСТЬ</div>
              <h1>
                {activePreset.name} <span>{dimensions.label}</span>
              </h1>
            </div>
            <div className="workspace-tools">
              <div className="match-badge" title="Оценка по нормализованным координатам и ширине">
                <CheckCircle2 size={15} /> {score.total}% совпадения
              </div>
              <button className="button secondary-button" onClick={() => applyPreset(activePreset.id)}>
                <RotateCcw size={15} /> К эталону
              </button>
              <button
                className="button secondary-button"
                onClick={() => {
                  setObjects([]);
                  setSelectedId(null);
                }}
              >
                <Trash2 size={15} /> Очистить
              </button>
            </div>
          </div>

          {showComparison ? (
            <div className="comparison-area">
              <div className="comparison-heading">
                <div>
                  <span>Сопоставлено объектов</span>
                  <strong>{score.matched}/{score.expected}</strong>
                </div>
                <div>
                  <span>Позиции</span>
                  <strong>{score.position}%</strong>
                </div>
                <div>
                  <span>Размеры</span>
                  <strong>{score.size}%</strong>
                </div>
              </div>
              <div className="comparison-grid">
                <figure className="comparison-panel">
                  <figcaption><span>01</span> Эталонный PNG</figcaption>
                  <div className="comparison-canvas" style={{ aspectRatio: `${activePreset.baseSize.width}/${activePreset.baseSize.height}` }}>
                    <img src={activePreset.referenceImage} alt={`Эталон: ${activePreset.name}`} />
                  </div>
                </figure>
                <figure className="comparison-panel">
                  <figcaption><span>02</span> Текущая композиция</figcaption>
                  <div className="comparison-canvas" style={{ aspectRatio: `${activePreset.baseSize.width}/${activePreset.baseSize.height}` }}>
                    <SceneCanvas
                      dimensions={{
                        width: activePreset.baseSize.width,
                        height: activePreset.baseSize.height,
                        label: 'reference',
                      }}
                      baseSize={sceneBaseSize}
                      backgroundTemplate={backgroundTemplate}
                      palette={palette}
                      objects={objects}
                      detailSize={detailSize}
                      interactive={false}
                    />
                  </div>
                </figure>
              </div>
            </div>
          ) : (
            <div className="canvas-stage">
              <div
                className="canvas-frame"
                style={{ aspectRatio: `${dimensions.width}/${dimensions.height}` }}
                onClick={(event) => {
                  if (event.target === event.currentTarget) setSelectedId(null);
                }}
              >
                <SceneCanvas
                  dimensions={dimensions}
                  baseSize={sceneBaseSize}
                  backgroundTemplate={backgroundTemplate}
                  palette={palette}
                  objects={objects}
                  detailSize={detailSize}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onChange={updateObject}
                />
              </div>
            </div>
          )}

          <div className="canvas-footer">
            <span><span className="status-dot" /> Сцена хранит нормализованные координаты</span>
            <span>{objects.length} объектов · PNG {detailSize}</span>
          </div>

          <section className={`inspector ${selectedObject ? '' : 'is-empty'}`}>
            <div className="inspector-title">
              <div>
                <div className="section-label">ВЫБРАННЫЙ ОБЪЕКТ</div>
                <strong>
                  {selectedObject
                    ? selectedObject.customAsset?.name ?? assetLibrary[selectedObject.assetId].label
                    : 'Выберите объект на холсте'}
                </strong>
              </div>
              {selectedObject && (
                <button className="icon-button danger" onClick={removeSelected} title="Удалить объект">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {selectedObject && (
              <div className="inspector-controls">
                <div className="control-block">
                  <span>Роль</span>
                  <div className="segmented two-columns">
                    {(['main', 'background'] as AssetRole[]).map((role) => (
                      <button
                        key={role}
                        className={selectedObject.role === role ? 'active' : ''}
                        onClick={() => setObjectRole(selectedObject, role)}
                      >
                        {role === 'main' ? 'Главный' : 'Фоновый'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="control-block">
                  <span>Поворот</span>
                  <div className="quick-buttons">
                    {[-15, 0, 15].map((rotation) => (
                      <button
                        key={rotation}
                        className={selectedObject.rotation === rotation ? 'active' : ''}
                        onClick={() => updateObject(selectedObject.id, { rotation })}
                      >
                        {rotation > 0 ? `+${rotation}°` : `${rotation}°`}
                      </button>
                    ))}
                    <button
                      className={selectedObject.flipX ? 'active' : ''}
                      onClick={() => updateObject(selectedObject.id, { flipX: !selectedObject.flipX })}
                      title="Отражение по изометрической оси"
                    >
                      <FlipHorizontal2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="control-block layer-controls">
                  <span><Layers3 size={14} /> Слои · z {selectedObject.zIndex}</span>
                  <div className="quick-buttons">
                    <button onClick={() => shiftLayer('bottom')} title="В самый низ"><ChevronsDown size={15} /></button>
                    <button onClick={() => shiftLayer('back')} title="На слой ниже"><ArrowDown size={15} /></button>
                    <button onClick={() => shiftLayer('forward')} title="На слой выше"><ArrowUp size={15} /></button>
                    <button onClick={() => shiftLayer('top')} title="В самый верх"><ChevronsUp size={15} /></button>
                  </div>
                </div>
                <div className="object-metrics">
                  <span>x {selectedObject.x.toFixed(3)}</span>
                  <span>y {selectedObject.y.toFixed(3)}</span>
                  <span>ширина {selectedObject.width.toFixed(3)}</span>
                </div>
              </div>
            )}
          </section>

          <section className="presets-section">
            <div className="section-label">ШЕСТЬ ЭТАЛОННЫХ ПРЕСЕТОВ</div>
            <PresetGallery
              presets={compositionPresets}
              activeId={activePresetId}
              onSelect={applyPreset}
              onReset={applyPreset}
            />
          </section>
        </section>
      </main>

      {notice && (
        <button className="notice" onClick={() => setNotice('')}>
          <CheckCircle2 size={16} /> {notice} <X size={14} />
        </button>
      )}

      {showDocs && (
        <div className="modal-backdrop" onMouseDown={() => setShowDocs(false)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">ДОКУМЕНТАЦИЯ</div>
                <h2>Архитектура сцены</h2>
              </div>
              <button className="icon-button" onClick={() => setShowDocs(false)}><X size={18} /></button>
            </div>
            <p>
              Пресеты хранят нормализованные координаты, ширину, роль, прозрачность и z-index.
              Переход между форматами выполняется единым коэффициентом contain-fit, поэтому пропорции
              объектов и расстояния между ними не искажаются.
            </p>
            <p>
              Библиотека содержит отдельные PNG для ролей main/background и детализации L/S.
              Пользователь меняет положение, угол, роль и слой, но не растягивает изображение по осям.
            </p>
            <p>
              Экспорт формирует SVG с viewBox и clipPath. В автономном режиме PNG встраиваются как
              data URL, поэтому файл открывается отдельно от приложения.
            </p>
            <div className="doc-grid">
              <div><ImagePlus size={18} /><b>40</b><span>PNG-вариантов</span></div>
              <div><Layers3 size={18} /><b>6</b><span>точных пресетов</span></div>
              <div><Eye size={18} /><b>3</b><span>фоновые геометрии</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
