import { useRef, useEffect, useState, useLayoutEffect, useCallback, useMemo, useId } from 'react';
import type { ReactNode, CSSProperties } from 'react';

export type StartPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | number;

export type AnimationMode = 'once' | 'loop';
export type Trigger = 'mount' | 'hover' | 'focus' | 'click' | 'manual';
export type LineCap = 'round' | 'square';
export type Variant = 'default' | 'split';
export type BorderPosition = 'inner' | 'outer';

export interface GradientBorderProps {
  /** Content to render inside the gradient border */
  children?: ReactNode;
  /** Array of colors for the gradient (hex format) */
  colors?: string[];
  /** Where on the border the gradient starts. Can be a position name or a number 0-1. */
  startPosition?: StartPosition;
  /** Width of the border stroke in pixels */
  strokeWidth?: number;
  /** Line cap style for the start of the stroke: 'round' | 'square' (default: 'square') */
  lineCapStart?: LineCap;
  /** Line cap style for the end/tip of the stroke: 'round' | 'square' (default: 'square') */
  lineCapEnd?: LineCap;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Number of segments to divide the border into */
  segments?: number;
  /** Animation duration in milliseconds for a full 100% draw */
  duration?: number;
  /** Percentage of the border to draw (0 to 100). Turns the border into a progress indicator. */
  percentage?: number;
  /** Whether to animate the border drawing in (default: true) */
  animate?: boolean;
  /** What triggers the border to appear: 'mount' | 'hover' | 'click' | 'manual' (default: 'mount') */
  trigger?: Trigger;
  /** Animation mode: 'once' draws and stops, 'loop' continuously animates around (default: 'once') */
  animationMode?: AnimationMode;
  /** Animation variant: 'default' draws from one point, 'split' draws from both directions meeting in the middle (default: 'default') */
  variant?: Variant;
  /** Reverse the animation direction (default: false) */
  reverse?: boolean;
  /** For manual trigger control - whether the border is active */
  active?: boolean;
  /** Whether border is visible when not triggered (for hover/click modes) (default: false) */
  showWhenInactive?: boolean;
  /** Lazy load - only render when visible in viewport (default: true) */
  lazy?: boolean;
  /** Root margin for lazy loading intersection observer (default: '100px') */
  lazyRootMargin?: string;
  /** Throttle interval in ms for resize recalculations (default: 150) */
  resizeThrottle?: number;
  /** Enable ants marching (dashed line) effect (default: false) */
  ants?: boolean;
  /** Width of each dash in the ants marching effect in pixels (default: 20) */
  antsDashWidth?: number;
  /** Gap between dashes in the ants marching effect in pixels (default: 16) */
  antsGapWidth?: number;
  /** Speed of the ants marching animation in ms per dash cycle (default: 250) */
  antsSpeed?: number;
  /** Border position: 'inner' draws inside the element, 'outer' draws outside (default: 'inner') */
  borderPosition?: BorderPosition;
  /** Offset the border by a CSS length value. Positive = outward, negative = inward. (e.g., 4, "10px", "-5px") */
  borderOffset?: number | string;
  /** Additional CSS styles for the container */
  style?: CSSProperties;
  /** Additional CSS class name for the container */
  className?: string;
}

interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface Size {
  width: number;
  height: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const parsedColorCache = new Map<string, [number, number, number]>();

function parseHexColor(hex: string): [number, number, number] {
  const cached = parsedColorCache.get(hex);
  if (cached) return cached;

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const parsed: [number, number, number] = result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];

  if (parsedColorCache.size > 1000) {
    const firstKey = parsedColorCache.keys().next().value;
    if (firstKey) parsedColorCache.delete(firstKey);
  }
  parsedColorCache.set(hex, parsed);

  return parsed;
}

function interpolateColor(color1: string, color2: string, t: number): string {
  const [r1, g1, b1] = parseHexColor(color1);
  const [r2, g2, b2] = parseHexColor(color2);

  return `rgb(${Math.round(lerp(r1, r2, t))}, ${Math.round(lerp(g1, g2, t))}, ${Math.round(lerp(b1, b2, t))})`;
}

function getColorAtPosition(colors: string[], t: number): string {
  if (colors.length === 0) return '#000000';
  if (colors.length === 1) return colors[0];

  t = Math.max(0, Math.min(1, t));

  const segmentCount = colors.length - 1;
  const segment = Math.min(Math.floor(t * segmentCount), segmentCount - 1);
  const segmentT = (t * segmentCount) - segment;

  return interpolateColor(colors[segment], colors[segment + 1], segmentT);
}

function getStartOffset(
  position: StartPosition,
  width: number,
  height: number,
  radius: number
): number {
  if (typeof position === 'number') {
    return Math.max(0, Math.min(1, position));
  }

  const r = Math.min(radius, width / 2, height / 2);
  const cornerArc = (Math.PI * r) / 2;
  const topEdge = width - 2 * r;
  const rightEdge = height - 2 * r;
  const bottomEdge = width - 2 * r;
  const leftEdge = height - 2 * r;

  const perimeter = topEdge + rightEdge + bottomEdge + leftEdge + 4 * cornerArc;

  const positions: Record<string, number> = {
    'top-left': 0,
    'top': (topEdge / 2) / perimeter,
    'top-right': (topEdge + cornerArc) / perimeter,
    'right': (topEdge + cornerArc + rightEdge / 2) / perimeter,
    'bottom-right': (topEdge + cornerArc + rightEdge + cornerArc) / perimeter,
    'bottom': (topEdge + cornerArc + rightEdge + cornerArc + bottomEdge / 2) / perimeter,
    'bottom-left': (topEdge + cornerArc + rightEdge + cornerArc + bottomEdge + cornerArc) / perimeter,
    'left': (topEdge + cornerArc + rightEdge + cornerArc + bottomEdge + cornerArc + leftEdge / 2) / perimeter,
  };

  return positions[position] ?? 0;
}

function getPointOnRoundedRect(
  t: number,
  width: number,
  height: number,
  radius: number
): { x: number; y: number } {
  const r = Math.min(radius, width / 2, height / 2);
  const cornerArc = (Math.PI * r) / 2;
  const topEdge = width - 2 * r;
  const rightEdge = height - 2 * r;
  const bottomEdge = width - 2 * r;
  const leftEdge = height - 2 * r;
  const perimeter = topEdge + rightEdge + bottomEdge + leftEdge + 4 * cornerArc;

  let d = (t % 1) * perimeter;
  if (d < 0) d += perimeter;

  if (d < topEdge) return { x: r + d, y: 0 };
  d -= topEdge;

  if (d < cornerArc) {
    const angle = d / r;
    return {
      x: width - r + Math.sin(angle) * r,
      y: r - Math.cos(angle) * r,
    };
  }
  d -= cornerArc;

  if (d < rightEdge) return { x: width, y: r + d };
  d -= rightEdge;

  if (d < cornerArc) {
    const angle = d / r;
    return {
      x: width - r + Math.cos(angle) * r,
      y: height - r + Math.sin(angle) * r,
    };
  }
  d -= cornerArc;

  if (d < bottomEdge) return { x: width - r - d, y: height };
  d -= bottomEdge;

  if (d < cornerArc) {
    const angle = d / r;
    return {
      x: r - Math.sin(angle) * r,
      y: height - r + Math.cos(angle) * r,
    };
  }
  d -= cornerArc;

  if (d < leftEdge) return { x: 0, y: height - r - d };
  d -= leftEdge;

  const angle = d / r;
  return {
    x: r - Math.cos(angle) * r,
    y: r - Math.sin(angle) * r,
  };
}

function parseCssLength(value: number | string): number {
  if (typeof value === 'number') return value;

  const match = value.match(/^(-?[\d.]+)(px|rem|em)?$/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2] || 'px';

  switch (unit) {
    case 'rem':
    case 'em':
      return num * 16;
    case 'px':
    default:
      return num;
  }
}

function generateLines(
  width: number,
  height: number,
  borderRadius: number,
  segments: number,
  colors: string[],
  startOffset: number,
  strokeWidth: number,
  borderPosition: BorderPosition,
  borderOffset: number
): LineSegment[] {
  const lines: LineSegment[] = [];
  const baseOffset = borderPosition === 'outer' ? strokeWidth / 2 : -strokeWidth / 2;
  const totalOffset = baseOffset + borderOffset;

  const pathWidth = width + totalOffset * 2;
  const pathHeight = height + totalOffset * 2;
  const pathRadius = Math.max(0, borderRadius + totalOffset);

  for (let i = 0; i < segments; i++) {
    const t1 = ((i / segments) + startOffset) % 1;
    const t2 = (((i + 1) / segments) + startOffset) % 1;

    const p1 = getPointOnRoundedRect(t1, pathWidth, pathHeight, pathRadius);
    const p2 = getPointOnRoundedRect(t2, pathWidth, pathHeight, pathRadius);

    const colorT = i / segments;
    const shift = -totalOffset;
    
    lines.push({
      x1: p1.x + shift,
      y1: p1.y + shift,
      x2: p2.x + shift,
      y2: p2.y + shift,
      color: getColorAtPosition(colors, colorT),
    });
  }

  return lines;
}

export function GradientBorder({
  children,
  colors = ['#0066ff', '#ffdd00'],
  startPosition = 'top-left',
  strokeWidth = 3,
  lineCapStart = 'square',
  lineCapEnd = 'square',
  borderRadius = 12,
  segments = 200,
  duration = 2000,
  percentage,
  animate = true,
  trigger = 'mount',
  animationMode = 'once',
  variant = 'default',
  reverse = false,
  active: manualActive,
  showWhenInactive = false,
  lazy = true,
  lazyRootMargin = '100px',
  resizeThrottle = 150,
  ants = false,
  antsDashWidth = 20,
  antsGapWidth = 16,
  antsSpeed = 250,
  borderPosition = 'inner',
  borderOffset = 0,
  style = {},
  className = '',
}: GradientBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const [lines, setLines] = useState<LineSegment[]>([]);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [isInViewport, setIsInViewport] = useState(!lazy);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [loopOffset, setLoopOffset] = useState(0);
  
  const antsGroupRef = useRef<SVGGElement>(null);
  const antsStartTimeRef = useRef<number | null>(null);
  const lastResizeRef = useRef<number>(0);
  const trailingResizeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasBeenVisible = useRef(false);
  const animationStarted = useRef(false);
  const [animationCompleted, setAnimationCompleted] = useState(!animate);

  // Calculate target segments based on percentage
  const safePercentage = percentage !== undefined ? Math.max(0, Math.min(100, percentage)) : 100;
  const targetSegments = Math.floor(segments * (safePercentage / 100));

  const [visibleCount, setVisibleCount] = useState(animate ? 0 : targetSegments);
  const currentVisibleCount = useRef(visibleCount); // Track progress for smooth percentage updates

  const isActive = (() => {
    switch (trigger) {
      case 'hover': return isHovered;
      case 'focus': return isFocused;
      case 'click': return isClicked;
      case 'manual': return manualActive ?? false;
      case 'mount':
      default: return true;
    }
  })();

  const shouldShowBorder = isActive || showWhenInactive;
  const colorsKey = useMemo(() => colors.join(','), [colors]);

  const throttledSetSize = useCallback((newSize: Size) => {
    const now = Date.now();
    const timeSinceLastResize = now - lastResizeRef.current;

    if (timeSinceLastResize >= resizeThrottle) {
      lastResizeRef.current = now;
      setSize(newSize);
    } else {
      if (trailingResizeRef.current) {
        clearTimeout(trailingResizeRef.current);
      }
      trailingResizeRef.current = setTimeout(() => {
        lastResizeRef.current = Date.now();
        setSize(newSize);
      }, resizeThrottle - timeSinceLastResize);
    }
  }, [resizeThrottle]);

  useEffect(() => {
    if (!lazy || !containerRef.current) {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInViewport(true);
          hasBeenVisible.current = true;
        }
      },
      {
        rootMargin: lazyRootMargin,
        threshold: 0,
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy, lazyRootMargin]);

  useLayoutEffect(() => {
    if (!containerRef.current || !isInViewport) return;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;

      const width = el.offsetWidth;
      const height = el.offsetHeight;

      if (width > 0 && height > 0) {
        throttledSetSize({ width, height });
      }
    };

    const el = containerRef.current;
    if (el) {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    }

    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (trailingResizeRef.current) {
        clearTimeout(trailingResizeRef.current);
      }
    };
  }, [throttledSetSize, isInViewport]);

  const parsedBorderOffset = useMemo(() => parseCssLength(borderOffset), [borderOffset]);

  // Generate line segments when size or props change
  useEffect(() => {
    if (size.width === 0 || size.height === 0 || !isInViewport) return;

    const startOffset = getStartOffset(startPosition, size.width, size.height, borderRadius);

    const newLines = generateLines(
      size.width,
      size.height,
      borderRadius,
      segments,
      colors,
      startOffset,
      strokeWidth,
      borderPosition,
      parsedBorderOffset
    );
    setLines(newLines);

    if (!animate) {
      setVisibleCount(targetSegments);
      currentVisibleCount.current = targetSegments;
    } else if (!animationStarted.current) {
      // Only reset to 0 if the animation hasn't started yet
      setVisibleCount(0);
      currentVisibleCount.current = 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, borderRadius, segments, colorsKey, startPosition, animate, strokeWidth, isInViewport, borderPosition, parsedBorderOffset, targetSegments]);

  // Reset animation when becoming active
  useEffect(() => {
    if (isActive && animate && !animationStarted.current) {
      setVisibleCount(0);
      currentVisibleCount.current = 0;
      setAnimationCompleted(false);
      animationStarted.current = true;
    } else if (!isActive) {
      animationStarted.current = false;
      setAnimationCompleted(false);
      if (!showWhenInactive) {
        setVisibleCount(0);
        currentVisibleCount.current = 0;
      }
    }
  }, [isActive, animate, showWhenInactive]);

  // Handle animation - draw once/percentage or loop
  useEffect(() => {
    if (!isActive || !animate || lines.length === 0 || !isInViewport) return;

    const startTime = performance.now();
    let frameId: number;

    if (animationMode === 'loop' && percentage === undefined) {
      // Continuous loop animation (ignored if percentage is set)
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = (elapsed / duration) % 1;
        setLoopOffset(progress);
        setVisibleCount(segments);
        currentVisibleCount.current = segments;
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    } else {
      // Draw to target segments
      const startSegments = currentVisibleCount.current;
      const segmentDiff = targetSegments - startSegments;

      if (segmentDiff === 0) {
        setAnimationCompleted(true);
        return; 
      }

      // Calculate a proportional duration so the speed remains constant 
      // regardless of how far the percentage needs to travel
      const timeToAnimate = (Math.abs(segmentDiff) / segments) * duration;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = timeToAnimate > 0 ? Math.min(elapsed / timeToAnimate, 1) : 1;

        const newVisible = Math.round(startSegments + segmentDiff * progress);
        setVisibleCount(newVisible);
        currentVisibleCount.current = newVisible;

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        } else {
          setAnimationCompleted(true);
        }
      };
      frameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(frameId);
  }, [lines, duration, segments, animate, isInViewport, isActive, animationMode, targetSegments, percentage]);

  const displayLines = useMemo(() => {
    if (animationMode === 'loop' && isActive && percentage === undefined) {
      const direction = reverse ? 1 : -1;
      return lines.map((line, i) => ({
        ...line,
        color: getColorAtPosition(colors, ((i / segments) + direction * loopOffset + 1) % 1),
      }));
    }
    if (variant === 'split') {
      const halfSegments = segments / 2;
      return lines.map((line, i) => {
        let colorT: number;
        if (i < halfSegments) {
          colorT = i / halfSegments;
        } else {
          colorT = (segments - 1 - i) / halfSegments;
        }
        return {
          ...line,
          color: getColorAtPosition(colors, colorT),
        };
      });
    }
    return lines;
  }, [animationMode, isActive, lines, colors, segments, loopOffset, reverse, variant, percentage]);

  useEffect(() => {
    if (!ants || !isActive || !isInViewport || !antsGroupRef.current) {
      antsStartTimeRef.current = null;
      return;
    }

    const group = antsGroupRef.current;
    const lineElements = Array.from(group.querySelectorAll('line'));
    if (lineElements.length === 0) return;

    const cumulativeLengths: number[] = [];
    let cumulative = 0;
    for (const line of lineElements) {
      const x1 = parseFloat(line.getAttribute('x1') || '0');
      const y1 = parseFloat(line.getAttribute('y1') || '0');
      const x2 = parseFloat(line.getAttribute('x2') || '0');
      const y2 = parseFloat(line.getAttribute('y2') || '0');
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      cumulativeLengths.push(cumulative);
      cumulative += length;
    }

    const dashCycle = antsDashWidth + antsGapWidth;
    const numLines = lineElements.length;
    const direction = reverse ? 1 : -1;

    const prevVisible: boolean[] = lineElements.map(line => line.style.opacity !== '0');

    let frameId: number;

    if (antsStartTimeRef.current === null) {
      antsStartTimeRef.current = performance.now();
    }

    const tick = (now: number) => {
      const elapsed = now - antsStartTimeRef.current!;
      const offset = (elapsed / antsSpeed) * dashCycle;

      for (let i = 0; i < numLines; i++) {
        const drawInVisible = lineElements[i].getAttribute('data-visible') === '1';
        const isTip = lineElements[i].getAttribute('data-tip') === '1';

        if (!drawInVisible) {
          if (prevVisible[i] !== false) {
            lineElements[i].style.opacity = '0';
            prevVisible[i] = false;
          }
          continue;
        }

        if (isTip) {
          if (prevVisible[i] !== true) {
            lineElements[i].style.opacity = '1';
            prevVisible[i] = true;
          }
          continue;
        }

        const positionInCycle = ((cumulativeLengths[i] + direction * offset) % dashCycle + dashCycle) % dashCycle;
        const isVisible = positionInCycle < antsDashWidth;

        if (isVisible !== prevVisible[i]) {
          lineElements[i].style.opacity = isVisible ? '1' : '0';
          prevVisible[i] = isVisible;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [ants, antsDashWidth, antsGapWidth, antsSpeed, isActive, isInViewport, displayLines, reverse]);

  const handleMouseEnter = trigger === 'hover' ? () => setIsHovered(true) : undefined;
  const handleMouseLeave = trigger === 'hover' ? () => setIsHovered(false) : undefined;
  const handleFocus = trigger === 'focus' ? () => setIsFocused(true) : undefined;
  const handleBlur = trigger === 'focus' ? () => setIsFocused(false) : undefined;
  const handleClick = trigger === 'click' ? () => setIsClicked(prev => !prev) : undefined;

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: trigger === 'click' ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
      {size.width > 0 && displayLines.length > 0 && shouldShowBorder && (() => {
        const baseOffset = borderPosition === 'outer' ? strokeWidth / 2 : -strokeWidth / 2;
        const totalOffset = baseOffset + parsedBorderOffset;
        const expansion = Math.max(0, totalOffset + strokeWidth / 2);
        const svgWidth = size.width + expansion * 2;
        const svgHeight = size.height + expansion * 2;
        const shouldClip = totalOffset < 0;

        return (
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -expansion,
            left: -expansion,
            width: svgWidth,
            height: svgHeight,
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 1,
          }}
          viewBox={`${-expansion} ${-expansion} ${svgWidth} ${svgHeight}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x="0"
                y="0"
                width={size.width}
                height={size.height}
                rx={Math.min(borderRadius, size.width / 2, size.height / 2)}
                ry={Math.min(borderRadius, size.width / 2, size.height / 2)}
              />
            </clipPath>
          </defs>
          <g clipPath={shouldClip ? `url(#${clipId})` : undefined} ref={antsGroupRef}>
            {displayLines.map((line, i) => {
              const isLoop = animationMode === 'loop' && percentage === undefined;
              const isSplit = variant === 'split';

              let visible: boolean;
              let isTip: boolean;
              let isFirstHalf: boolean;

              if (isLoop) {
                visible = true;
                isTip = false;
                isFirstHalf = false;
              } else if (isSplit) {
                const halfCount = Math.floor(visibleCount / 2);
                const forwardTip = Math.min(halfCount, Math.floor(segments / 2) - 1);
                const backwardTip = Math.max(segments - 1 - halfCount, Math.floor(segments / 2));

                visible = i <= forwardTip || i >= backwardTip;
                isTip = i === forwardTip || i === backwardTip;
                isFirstHalf = i <= Math.floor(segments / 4) || i >= segments - Math.floor(segments / 4);
              } else if (reverse) {
                const tipIndex = Math.max(segments - 1 - visibleCount, 0);
                visible = i >= segments - 1 - visibleCount;
                isTip = i === tipIndex;
                isFirstHalf = i > segments / 2;
              } else {
                const tipIndex = Math.min(visibleCount, segments - 1);
                visible = i <= visibleCount;
                isTip = i === tipIndex;
                isFirstHalf = i < segments / 2;
              }

              let segmentLineCap: LineCap = ants ? lineCapEnd : 'round';
              if (!isLoop && !ants) {
                if (isTip) {
                  segmentLineCap = lineCapEnd;
                } else if (!animationCompleted && isFirstHalf) {
                  segmentLineCap = lineCapStart;
                }
              }

              return (
                <line
                  key={`main-${i}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap={segmentLineCap}
                  data-visible={visible ? '1' : '0'}
                  data-tip={isTip ? '1' : '0'}
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: !animate ? 'none' : undefined,
                  }}
                />
              );
            })}
          </g>
        </svg>
        );
      })()}
    </div>
  );
}

export default GradientBorder;