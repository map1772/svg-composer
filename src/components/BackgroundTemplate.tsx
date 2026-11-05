import type { BackgroundTemplateId, Palette } from '../types';

type BackgroundTemplateProps = {
  template: BackgroundTemplateId;
  palette: Palette;
  width: number;
  height: number;
};

export function BackgroundTemplate({
  template,
  palette,
  width,
  height,
}: BackgroundTemplateProps) {
  return (
    <g className={`background-template background-${template}`} aria-hidden="true">
      <rect width={width} height={height} fill={palette.bgSurface} />
      {template !== 'clean' && (
        <path
          d={`M ${width * 0.605} ${height} L ${width} ${height * 0.758} L ${width} ${height} Z`}
          fill={palette.bgSecondary}
        />
      )}
      {template === 'lines' && (
        <>
          <g fill="none" stroke={palette.bgAccent} strokeWidth={1.65}>
            <path d={`M ${width * 0.048} ${height * 0.362} L ${width * 0.226} ${height * 0.254}`} />
            <path d={`M ${width * 0.137} ${height * 0.264} L ${width * 0.365} ${height * 0.127}`} />
            <path d={`M ${width * 0.362} ${height * 0.161} L ${width * 0.432} ${height * 0.118}`} />
            <path d={`M ${width * 0.565} ${height * 0.89} L ${width * 0.635} ${height * 0.847}`} />
            <path d={`M ${width * 0.72} ${height * 0.868} L ${width * 0.899} ${height * 0.76}`} />
          </g>
          <ellipse
            cx={width * 0.113}
            cy={height * 0.212}
            rx={width * 0.028}
            ry={height * 0.016}
            fill={palette.bgSecondary}
          />
          <ellipse
            cx={width * 0.106}
            cy={height * 0.932}
            rx={width * 0.035}
            ry={height * 0.018}
            fill="none"
            stroke={palette.bgAccent}
            strokeWidth={2}
          />
          <ellipse
            cx={width * 0.134}
            cy={height * 0.912}
            rx={width * 0.034}
            ry={height * 0.019}
            fill={palette.pureWhite}
          />
        </>
      )}
    </g>
  );
}

export function backgroundTemplateMarkup(
  template: BackgroundTemplateId,
  palette: Palette,
  width: number,
  height: number,
) {
  const plane =
    template === 'clean'
      ? ''
      : `<path d="M ${width * 0.605} ${height} L ${width} ${height * 0.758} L ${width} ${height} Z" fill="${palette.bgSecondary}"/>`;
  const lines =
    template !== 'lines'
      ? ''
      : `<g fill="none" stroke="${palette.bgAccent}" stroke-width="1.65"><path d="M ${width * 0.048} ${height * 0.362} L ${width * 0.226} ${height * 0.254}"/><path d="M ${width * 0.137} ${height * 0.264} L ${width * 0.365} ${height * 0.127}"/><path d="M ${width * 0.362} ${height * 0.161} L ${width * 0.432} ${height * 0.118}"/><path d="M ${width * 0.565} ${height * 0.89} L ${width * 0.635} ${height * 0.847}"/><path d="M ${width * 0.72} ${height * 0.868} L ${width * 0.899} ${height * 0.76}"/></g><ellipse cx="${width * 0.113}" cy="${height * 0.212}" rx="${width * 0.028}" ry="${height * 0.016}" fill="${palette.bgSecondary}"/><ellipse cx="${width * 0.106}" cy="${height * 0.932}" rx="${width * 0.035}" ry="${height * 0.018}" fill="none" stroke="${palette.bgAccent}" stroke-width="2"/><ellipse cx="${width * 0.134}" cy="${height * 0.912}" rx="${width * 0.034}" ry="${height * 0.019}" fill="${palette.pureWhite}"/>`;

  return `<rect width="${width}" height="${height}" fill="${palette.bgSurface}"/>${plane}${lines}`;
}
