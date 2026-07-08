"use client";

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    forwardRef,
    useImperativeHandle,
    useMemo,
    type ReactNode,
    type MouseEvent as ReactMouseEvent,
    type SVGProps,
} from 'react';
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
    type Transition,
    type VariantLabels,
    type Target,
    type TargetAndTransition,
    type Variants,
} from 'framer-motion';
import { usePostHog } from 'posthog-js/react';
import { useTheme } from 'next-themes';
import { Dock } from '@/components/ui/dock-two';
import { supabase } from '@/lib/supabase';

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    "children" | "transition" | "initial" | "animate" | "exit"
  > {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | TargetAndTransition;
  exit?: Target | VariantLabels;
  animatePresenceMode?: "sync" | "wait";
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: "spring", damping: 25, stiffness: 300 },
      initial = { y: "100%", opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: "-120%", opacity: 0 },
      animatePresenceMode = "wait",
      animatePresenceInitial = false,
      rotationInterval = 2200,
      staggerDuration = 0.01,
      staggerFrom = "last",
      loop = true,
      auto = true,
      splitBy = "characters",
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      ...rest
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

    const splitIntoCharacters = (text: string): string[] => {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        try {
           const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
           return Array.from(segmenter.segment(text), (segment) => segment.segment);
        } catch (error) {
           console.error("Intl.Segmenter failed, falling back to simple split:", error);
           return text.split('');
        }
      }
      return text.split('');
    };

    const elements = useMemo(() => {
        const currentText: string = texts[currentTextIndex] ?? '';
        if (splitBy === "characters") {
            const words = currentText.split(/(\s+)/);
            let charCount = 0;
            return words.filter(part => part.length > 0).map((part) => {
                const isSpace = /^\s+$/.test(part);
                const chars = isSpace ? [part] : splitIntoCharacters(part);
                const startIndex = charCount;
                charCount += chars.length;
                return { characters: chars, isSpace: isSpace, startIndex: startIndex };
            });
        }
        if (splitBy === "words") {
            return currentText.split(/(\s+)/).filter(word => word.length > 0).map((word, i) => ({
                characters: [word], isSpace: /^\s+$/.test(word), startIndex: i
            }));
        }
        if (splitBy === "lines") {
            return currentText.split('\n').map((line, i) => ({
                characters: [line], isSpace: false, startIndex: i
            }));
        }
        return currentText.split(splitBy).map((part, i) => ({
            characters: [part], isSpace: false, startIndex: i
        }));
    }, [texts, currentTextIndex, splitBy]);

    const totalElements = useMemo(() => elements.reduce((sum, el) => sum + el.characters.length, 0), [elements]);

    const getStaggerDelay = useCallback(
      (index: number, total: number): number => {
        if (total <= 1 || !staggerDuration) return 0;
        const stagger = staggerDuration;
        switch (staggerFrom) {
          case "first": return index * stagger;
          case "last": return (total - 1 - index) * stagger;
          case "center":
            const center = (total - 1) / 2;
            return Math.abs(center - index) * stagger;
          case "random": return Math.random() * (total - 1) * stagger;
          default:
            if (typeof staggerFrom === 'number') {
              const fromIndex = Math.max(0, Math.min(staggerFrom, total - 1));
              return Math.abs(fromIndex - index) * stagger;
            }
            return index * stagger;
        }
      },
      [staggerFrom, staggerDuration]
    );

    const handleIndexChange = useCallback(
      (newIndex: number) => {
        setCurrentTextIndex(newIndex);
        onNext?.(newIndex);
      },
      [onNext]
    );

    const next = useCallback(() => {
      const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
      if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex);
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const previous = useCallback(() => {
      const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
      if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex);
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const jumpTo = useCallback(
      (index: number) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1));
        if (validIndex !== currentTextIndex) handleIndexChange(validIndex);
      },
      [texts.length, currentTextIndex, handleIndexChange]
    );

     const reset = useCallback(() => {
        if (currentTextIndex !== 0) handleIndexChange(0);
     }, [currentTextIndex, handleIndexChange]);

    useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

    useEffect(() => {
      if (!auto || texts.length <= 1) return;
      const intervalId = setInterval(next, rotationInterval);
      return () => clearInterval(intervalId);
    }, [next, rotationInterval, auto, texts.length]);

    return (
      <motion.span
        className={cn("inline-flex flex-wrap whitespace-pre-wrap relative align-bottom pb-[10px]", mainClassName)}
        {...rest}
        layout
      >
        <span className="sr-only">{texts[currentTextIndex]}</span>
        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.div
            key={currentTextIndex}
            className={cn(
               "inline-flex flex-wrap relative",
               splitBy === "lines" ? "flex-col items-start w-full" : "flex-row items-baseline"
            )}
            layout
            aria-hidden="true"
            initial="initial"
            animate="animate"
            exit="exit"
          >
             {elements.map((elementObj, elementIndex) => (
                <span
                    key={elementIndex}
                    className={cn("inline-flex", splitBy === 'lines' ? 'w-full' : '', splitLevelClassName)}
                    style={{ whiteSpace: 'pre' }}
                >
                    {elementObj.characters.map((char, charIndex) => {
                        const globalIndex = elementObj.startIndex + charIndex;
                        return (
                            <motion.span
                                key={`${char}-${charIndex}`}
                                initial={initial}
                                animate={animate}
                                exit={exit}
                                transition={{
                                    ...transition,
                                    delay: getStaggerDelay(globalIndex, totalElements),
                                }}
                                className={cn("inline-block leading-none tracking-tight", elementLevelClassName)}
                            >
                                {char === ' ' ? ' ' : char}
                            </motion.span>
                        );
                     })}
                </span>
             ))}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    );
  }
);
RotatingText.displayName = "RotatingText";

const ShinyText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => (
    <span className={cn("relative overflow-hidden inline-block", className)}>
        {text}
        <span style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-accent) 20%, transparent), transparent)',
            animation: 'shine 2s infinite linear',
            opacity: 0.5,
            pointerEvents: 'none'
        }}></span>
        <style>{`
            @keyframes shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `}</style>
    </span>
);

const LogoComponent: React.FC<{ icon: any; size?: number }> = ({ icon, size = 20 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ fill: 'var(--color-text-secondary)' }}
    >
      <path d={icon.path} />
    </svg>
  );
};

const GmailLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={{ fill: 'var(--color-text-secondary)' }}
  >
    <path d={siGmail.path} />
  </svg>
);

const NotionLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={{ fill: 'var(--color-text-secondary)' }}
  >
    <path d={siNotion.path} />
  </svg>
);

const ClaudeLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={{ fill: 'var(--color-text-secondary)' }}
  >
    <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
  </svg>
);

const ChevronDownIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 ml-1 inline-block transition-transform duration-200 group-hover:rotate-180" {...props}>
     <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
   </svg>
);

const MenuIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const CloseIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const ExternalLinkIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

import { Sun, Moon } from 'lucide-react';
import { siGmail, siGooglecalendar, siNotion, siGoogledrive, siAnthropic } from 'simple-icons';
import { DashboardMockup } from '@/components/dashboard/dashboard-mockup';
import { AppDashboardMockup } from '@/components/dashboard/app-dashboard-mockup';

interface NavLinkProps {
    href?: string;
    children: ReactNode;
    hasDropdown?: boolean;
    className?: string;
    onClick?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href = "#", children, hasDropdown = false, className = "", onClick }) => (
   <motion.a
     href={href}
     onClick={onClick}
     className={cn("relative group text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] transition-colors duration-200 flex items-center py-1", className)}
     whileHover="hover"
   >
     {children}
     {hasDropdown && <ChevronDownIcon />}
     {!hasDropdown && (
         <motion.div
           className="absolute bottom-[-2px] left-0 right-0 h-[1px] bg-[var(--color-accent)]"
           variants={{ initial: { scaleX: 0, originX: 0.5 }, hover: { scaleX: 1, originX: 0.5 } }}
           initial="initial"
           transition={{ duration: 0.3, ease: "easeOut" }}
         />
     )}
   </motion.a>
 );

interface DropdownMenuProps {
    children: ReactNode;
    isOpen: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, isOpen }) => (
   <AnimatePresence>
     {isOpen && (
       <motion.div
         initial={{ opacity: 0, y: 10, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
         transition={{ duration: 0.2, ease: "easeOut" }}
         className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 origin-top z-40"
       >
           <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-md shadow-xl p-2">
               {children}
           </div>
       </motion.div>
     )}
   </AnimatePresence>
);

interface DropdownItemProps {
    href?: string;
    children: ReactNode;
    icon?: React.ReactElement<SVGProps<SVGSVGElement>>;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ href = "#", children, icon }) => (
 <a
   href={href}
   className="group flex items-center justify-between w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] rounded-md transition-colors duration-150"
 >
   <span>{children}</span>
   {icon && React.cloneElement(icon, { className: "w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" })}
 </a>
);

interface Dot {
    x: number;
    y: number;
    baseColor: string;
    targetOpacity: number;
    currentOpacity: number;
    opacitySpeed: number;
    baseRadius: number;
    currentRadius: number;
}

const ThemeSwitch: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 8px',
        borderRadius: '8px',
        border: `1px solid ${hovered ? 'var(--color-border-strong)' : 'var(--color-border)'}`,
        backgroundColor: hovered ? 'var(--color-surface)' : 'var(--color-surface-2)',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark
        ? <Moon size={18} color="var(--color-text-secondary)" />
        : <Sun size={18} color="var(--color-text-secondary)" />
      }
    </button>
  );
};

const HeroFlowtex: React.FC = () => {
   const posthog = usePostHog();
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const animationFrameId = useRef<number | null>(null);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
   const [openDropdown, setOpenDropdown] = useState<string | null>(null);
   const [isScrolled, setIsScrolled] = useState<boolean>(false);
   const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
   const { theme = 'dark', setTheme } = useTheme();
   const [mounted, setMounted] = useState(false);
   useEffect(() => { setMounted(true); }, []);

   useEffect(() => {
       supabase.auth.getSession().then(({ data: { session } }) => {
           setIsLoggedIn(!!session);
       });
       const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
           setIsLoggedIn(!!session);
       });
       return () => subscription.subscription.unsubscribe();
   }, []);

   const { scrollY } = useScroll();
   useMotionValueEvent(scrollY, "change", (latest) => {
       setIsScrolled(latest > 10);
   });


   const dotsRef = useRef<Dot[]>([]);
   const gridRef = useRef<Record<string, number[]>>({});
   const canvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
   const mousePositionRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

   const DOT_SPACING = 25;
   const BASE_OPACITY_MIN = 0.40;
   const BASE_OPACITY_MAX = 0.50;
   const BASE_RADIUS = 1;
   const INTERACTION_RADIUS = 150;
   const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
   const OPACITY_BOOST = 0.6;
   const RADIUS_BOOST = 2.5;
   const GRID_CELL_SIZE = Math.max(50, Math.floor(INTERACTION_RADIUS / 1.5));

   const handleMouseMove = useCallback((event: globalThis.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            mousePositionRef.current = { x: null, y: null };
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        mousePositionRef.current = { x: canvasX, y: canvasY };
   }, []);

   const createDots = useCallback(() => {
       const { width, height } = canvasSizeRef.current;
       if (width === 0 || height === 0) return;

       const newDots: Dot[] = [];
       const newGrid: Record<string, number[]> = {};
       const cols = Math.ceil(width / DOT_SPACING);
       const rows = Math.ceil(height / DOT_SPACING);

       for (let i = 0; i < cols; i++) {
           for (let j = 0; j < rows; j++) {
               const x = i * DOT_SPACING + DOT_SPACING / 2;
               const y = j * DOT_SPACING + DOT_SPACING / 2;
               const cellX = Math.floor(x / GRID_CELL_SIZE);
               const cellY = Math.floor(y / GRID_CELL_SIZE);
               const cellKey = `${cellX}_${cellY}`;

               if (!newGrid[cellKey]) {
                   newGrid[cellKey] = [];
               }

               const dotIndex = newDots.length;
               newGrid[cellKey].push(dotIndex);

               const baseOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
               newDots.push({
                   x,
                   y,
                   // Canvas fillStyle can't read CSS custom properties — hardcode the RGB
                   // of --color-accent dark (#DFAA45 = 223,170,69) for the dot grid.
                   baseColor: `rgba(223, 170, 69, ${BASE_OPACITY_MAX})`,
                   targetOpacity: baseOpacity,
                   currentOpacity: baseOpacity,
                   opacitySpeed: (Math.random() * 0.005) + 0.002,
                   baseRadius: BASE_RADIUS,
                   currentRadius: BASE_RADIUS,
               });
           }
       }
       dotsRef.current = newDots;
       gridRef.current = newGrid;
   }, [DOT_SPACING, GRID_CELL_SIZE, BASE_OPACITY_MIN, BASE_OPACITY_MAX, BASE_RADIUS]);

   const handleResize = useCallback(() => {
       const canvas = canvasRef.current;
       if (!canvas) return;
       const container = canvas.parentElement;
       const width = container ? container.clientWidth : window.innerWidth;
       const height = container ? container.clientHeight : window.innerHeight;

       if (canvas.width !== width || canvas.height !== height ||
           canvasSizeRef.current.width !== width || canvasSizeRef.current.height !== height)
       {
           canvas.width = width;
           canvas.height = height;
           canvasSizeRef.current = { width, height };
           createDots();
       }
   }, [createDots]);

   const animateDots = useCallback(() => {
       const canvas = canvasRef.current;
       const ctx = canvas?.getContext('2d');
       const dots = dotsRef.current;
       const grid = gridRef.current;
       const { width, height } = canvasSizeRef.current;
       const { x: mouseX, y: mouseY } = mousePositionRef.current;

       if (!ctx || !dots || !grid || width === 0 || height === 0) {
           animationFrameId.current = requestAnimationFrame(animateDots);
           return;
       }

       ctx.clearRect(0, 0, width, height);

       const activeDotIndices = new Set<number>();
       if (mouseX !== null && mouseY !== null) {
           const mouseCellX = Math.floor(mouseX / GRID_CELL_SIZE);
           const mouseCellY = Math.floor(mouseY / GRID_CELL_SIZE);
           const searchRadius = Math.ceil(INTERACTION_RADIUS / GRID_CELL_SIZE);
           for (let i = -searchRadius; i <= searchRadius; i++) {
               for (let j = -searchRadius; j <= searchRadius; j++) {
                   const checkCellX = mouseCellX + i;
                   const checkCellY = mouseCellY + j;
                   const cellKey = `${checkCellX}_${checkCellY}`;
                   if (grid[cellKey]) {
                       grid[cellKey].forEach(dotIndex => activeDotIndices.add(dotIndex));
                   }
               }
           }
       }

       dots.forEach((dot, index) => {
           dot.currentOpacity += dot.opacitySpeed;
           if (dot.currentOpacity >= dot.targetOpacity || dot.currentOpacity <= BASE_OPACITY_MIN) {
               dot.opacitySpeed = -dot.opacitySpeed;
               dot.currentOpacity = Math.max(BASE_OPACITY_MIN, Math.min(dot.currentOpacity, BASE_OPACITY_MAX));
               dot.targetOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
           }

           let interactionFactor = 0;
           dot.currentRadius = dot.baseRadius;

           if (mouseX !== null && mouseY !== null && activeDotIndices.has(index)) {
               const dx = dot.x - mouseX;
               const dy = dot.y - mouseY;
               const distSq = dx * dx + dy * dy;

               if (distSq < INTERACTION_RADIUS_SQ) {
                   const distance = Math.sqrt(distSq);
                   interactionFactor = Math.max(0, 1 - distance / INTERACTION_RADIUS);
                   interactionFactor = interactionFactor * interactionFactor;
               }
           }

           const finalOpacity = Math.min(1, dot.currentOpacity + interactionFactor * OPACITY_BOOST);
           dot.currentRadius = dot.baseRadius + interactionFactor * RADIUS_BOOST;

           const colorMatch = dot.baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
           const r = colorMatch ? colorMatch[1] : '0';
           const g = colorMatch ? colorMatch[2] : '212';
           const b = colorMatch ? colorMatch[3] : '164';

           ctx.beginPath();
           ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity.toFixed(3)})`;
           ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
           ctx.fill();
       });

       animationFrameId.current = requestAnimationFrame(animateDots);
   }, [GRID_CELL_SIZE, INTERACTION_RADIUS, INTERACTION_RADIUS_SQ, OPACITY_BOOST, RADIUS_BOOST, BASE_OPACITY_MIN, BASE_OPACITY_MAX, BASE_RADIUS]);

   useEffect(() => {
       handleResize();
       const canvasElement = canvasRef.current;
        const handleMouseLeave = () => {
            mousePositionRef.current = { x: null, y: null };
        };

       window.addEventListener('mousemove', handleMouseMove, { passive: true });
       window.addEventListener('resize', handleResize);
       document.documentElement.addEventListener('mouseleave', handleMouseLeave);


       animationFrameId.current = requestAnimationFrame(animateDots);

       return () => {
           window.removeEventListener('resize', handleResize);
           window.removeEventListener('mousemove', handleMouseMove);
           document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
           if (animationFrameId.current) {
               cancelAnimationFrame(animationFrameId.current);
           }
       };
   }, [handleResize, handleMouseMove, animateDots]);

   useEffect(() => {
       if (isMobileMenuOpen) {
           document.body.style.overflow = 'hidden';
       } else {
           document.body.style.overflow = 'unset';
       }
       return () => { document.body.style.overflow = 'unset'; };
   }, [isMobileMenuOpen]);

   const mobileMenuVariants: Variants = {
       hidden: { opacity: 0, y: -20 },
       visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
       exit: { opacity: 0, y: -20, transition: { duration: 0.15, ease: "easeIn" } }
   };

    const contentDelay = 0.3;
    const itemDelayIncrement = 0.1;

   const headlineVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement } }
    };
    const subHeadlineVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 2 } }
    };
    const formVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 3 } }
    };
    const trialTextVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 4 } }
    };
    const worksWithVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5, delay: contentDelay + itemDelayIncrement * 5 } }
    };
    const imageVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, delay: contentDelay + itemDelayIncrement * 6, ease: [0.16, 1, 0.3, 1] } }
    };

  return (
    <div id="hero" className="relative bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] min-h-screen flex flex-col overflow-x-hidden">
        <div className="fixed top-0 w-full z-50 pointer-events-none" style={{boxSizing: 'border-box'}}>
            <div className="relative flex items-center justify-center py-2">
                {/* Dock — centred */}
                <div className="pointer-events-auto">
                    <Dock items={[
                        { label: "Flowtex", onClick: () => {}, isLogo: true },
                        { label: "How it works", onClick: () => {
                            const section = document.getElementById('how-it-works');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        } },
                        { label: "Pricing", onClick: () => {
                            const pricingSection = document.getElementById('pricing');
                            pricingSection?.scrollIntoView({ behavior: 'smooth' });
                        } },
                        isLoggedIn
                            ? { label: "Go to Flowtex", onClick: () => {
                                posthog?.capture('cta_clicked', { button_label: 'Go to Flowtex', position: 'nav' });
                                window.location.href = '/app';
                            }, isButton: true }
                            : { label: "Get Early Access", onClick: () => {
                                posthog?.capture('cta_clicked', { button_label: 'Get Early Access', position: 'nav' });
                                window.location.href = '/login';
                            }, isButton: true }
                    ]} />
                </div>
                {/* Theme switch — pinned right, independent element */}
                {mounted && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-auto">
                      <ThemeSwitch />
                  </div>
                )}
            </div>
        </div>

        <div className="absolute inset-0 z-1 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, transparent 0%, var(--color-bg-base) 90%), radial-gradient(ellipse at center, transparent 40%, var(--color-bg-base) 95%)'
        }}></div>

        <main className="h-screen flex flex-col lg:flex-row items-center justify-center gap-12 text-left px-6 md:px-16 relative z-10 max-w-full overflow-x-hidden">

            <div className="flex-1 flex flex-col mt-8 min-w-0">

<motion.h1
                variants={headlineVariants}
                initial="hidden"
                animate="visible"
                className="text-3xl sm:text-4xl lg:text-6xl text-[var(--color-text-primary)] leading-tight max-w-5xl mb-4"
                style={{ fontWeight: 700 }}
            >
                You spend half your day explaining context.
                <span className="block text-[var(--color-accent)] mt-2">Flowtex already knows it.</span>
            </motion.h1>

            <motion.p
                variants={subHeadlineVariants}
                initial="hidden"
                animate="visible"
                className="text-base sm:text-lg lg:text-xl text-[var(--color-text-secondary)] max-w-2xl mb-8"
                style={{ fontWeight: 400 }}
            >
                The AI workspace that knows your business, your clients, and your pipeline, and acts on it.
            </motion.p>

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row items-start gap-4 justify-start w-full mb-12"
            >
                <motion.a
                    href={isLoggedIn ? "/app" : "/login"}
                    onClick={() => posthog?.capture('cta_clicked', { button_label: isLoggedIn ? 'Go to Flowtex' : 'Get Early Access', position: 'hero' })}
                    className="px-8 py-3 rounded-md text-base transition-colors duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
                    style={{ backgroundColor: "var(--color-accent)", color: "var(--color-bg)", fontWeight: 600 }}
                    onHoverStart={e => ((e.target as HTMLElement).style.backgroundColor = "var(--color-accent-dark)")}
                    onHoverEnd={e => ((e.target as HTMLElement).style.backgroundColor = "var(--color-accent)")}
                     whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                    {isLoggedIn ? "Go to Flowtex" : "Get Early Access"}
                </motion.a>
                <motion.a
                    href="#how-it-works"
                    onClick={() => posthog?.capture('cta_clicked', { button_label: 'Learn More', position: 'hero' })}
                    className="text-[var(--color-text-secondary)] px-6 py-3 rounded-md text-base font-medium border border-[var(--color-border-default)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                    Learn More
                </motion.a>
            </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex-1 hidden lg:flex items-center justify-center self-center min-w-0"
            >
                {/* Framed like a static screenshot, not a live widget — the top bar reads
                    as a browser window, and pointer-events-none kills any of the mockup's
                    own hover/interactive affordances so it can't be mistaken for real UI. */}
                <div className="w-full max-w-4xl mr-0 rounded-2xl border border-[var(--color-border-default)] shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-error)]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
                    </div>
                    <div className="pointer-events-none select-none">
                        <AppDashboardMockup />
                    </div>
                </div>
            </motion.div>

        </main>
    </div>
  );
};

export default HeroFlowtex;
