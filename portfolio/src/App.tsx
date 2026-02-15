import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import ExperienceScene from "./experience-scene";
import { experienceSections } from "./data/experience";
import { Physics } from "@react-three/rapier";
import { OverlayScreen } from "@/modules/loading/OverlayScreen";
import gsap from "gsap";

function LoadingProgressBridge({
  onProgress,
}: {
  onProgress: (value: number) => void;
}) {
  const { progress } = useProgress();

  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);

  return null;
}

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingBarEnded, setLoadingBarEnded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(
    experienceSections[0]?.id ?? "",
  );

  const activeSection = useMemo(
    () => experienceSections.find((section) => section.id === activeSectionId),
    [activeSectionId],
  );

  const checkpointPanels = useMemo(
    () => ({
      projects: {
        title: "Projects",
        subtitle: "Current Highlights",
        type: "projects" as const,
        items: [
          {
            title: "Shopify Headless Frontend",
            description: "A headless React Shop Frontend for Shopify.",
            tags: ["Next.js", "React", "GraphQL"],
            href: "https://rappid-on-shopify.vercel.app/",
          },
          {
            title: "Restaurant (Coming Soon)",
            description: "",
            tags: ["GLSL", "Shaders", "ThreeJS"],
            href: "https://piazzablu.com",
          },
          {
            title: "AI Prompt Analyzer",
            description:
              "An Analyzer to calculate the electricity and water consumed for an AI prompt.",
            tags: ["AI", "React", "NextJS"],
            href: "https://green-ai-prototype-wnd3.vercel.app/",
          },
          {
            title: "Company Dashboard",
            description: "The company information of piazza blu",
            tags: ["NextJS", "REST API", "rechart", "tanstack"],
            href: "http://localhost:3001",
          },
        ],
      },
      accounts: {
        title: "Accounts",
        subtitle: "Find Me Online",
        type: "accounts" as const,
        items: [
          {
            label: "LinkedIn",
            handle: "baha-sen",
            href: "https://www.linkedin.com/in/baha-sen/",
          },
          {
            label: "GitHub",
            handle: "baha120",
            href: "https://github.com/baha120",
          },
          {
            label: "Instagram",
            handle: "@baho_201",
            href: "https://instagram.com/baho_201",
          },
        ],
      },
    }),
    [],
  );

  const overlay =
    checkpointPanels[activeSectionId as keyof typeof checkpointPanels];
  const overlayRange = 0.08;
  const overlayActive = useMemo(() => {
    if (!overlay || !activeSection) return false;
    const center = (activeSection.tStart + activeSection.tEnd) / 2;
    return Math.abs(scrollProgress - center) <= overlayRange;
  }, [overlay, activeSection, scrollProgress, overlayRange]);

  const handleProgress = useCallback((value: number, sectionId: string) => {
    setScrollProgress(value);
    setActiveSectionId(sectionId);
  }, []);

  const checkpoints = useMemo(
    () => [0, ...experienceSections.map((s) => (s.tStart + s.tEnd) / 2)],
    [],
  );
  const checkpointIndex = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const targetProgressRef = useRef(0);

  const stepProgress = useCallback(
    (direction: "forward" | "backward") => {
      if (isAnimating) return;

      const nextIndex =
        direction === "forward"
          ? Math.min(checkpointIndex.current + 1, checkpoints.length - 1)
          : Math.max(checkpointIndex.current - 1, 0);

      if (nextIndex === checkpointIndex.current) return;
      checkpointIndex.current = nextIndex;

      if (tweenRef.current) tweenRef.current.kill();
      setIsAnimating(true);

      const obj = { value: targetProgressRef.current };
      tweenRef.current = gsap.to(obj, {
        value: checkpoints[nextIndex],
        duration: 1.8,
        ease: "power2.inOut",
        onUpdate: () => {
          targetProgressRef.current = obj.value;
          setTargetProgress(obj.value);
        },
        onComplete: () => setIsAnimating(false),
      });
    },
    [checkpoints, isAnimating],
  );

  const scaleX = Math.max(0, Math.min(1, loadingProgress / 100));

  useEffect(() => {
    if (loadingProgress < 100) {
      setLoadingBarEnded(false);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setLoadingBarEnded(true);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [loadingProgress]);
  return (
    <div className="relative min-h-screen w-full bg-[#080910] text-white">
      <header
        className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="pointer-events-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/70 sm:text-xs">
          Bahas · Journey Rail
        </div>
      </header>

      <section className="relative h-screen w-full overflow-hidden">
        <Canvas
          shadows
          gl={{ antialias: true }}
          camera={{ fov: 45 }}
          dpr={[1, 1.6]}
        >
          <LoadingProgressBridge onProgress={setLoadingProgress} />
          <OverlayScreen progress={loadingProgress} />
          <Physics debug={false} gravity={[0, -9.08, 0]}>
            <ExperienceScene
              onProgress={handleProgress}
              targetProgress={targetProgress}
            />
          </Physics>
        </Canvas>
        <div
          className={`loading-bar pointer-events-none ${
            loadingBarEnded ? "ended" : ""
          }`}
          style={
            loadingBarEnded ? undefined : { transform: `scaleX(${scaleX})` }
          }
        />
        <div className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3">
          <button
            type="button"
            disabled={isAnimating}
            onClick={() => stepProgress("forward")}
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 ${isAnimating ? "opacity-30 cursor-not-allowed" : ""}`}
            aria-label="Move forward"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={isAnimating}
            onClick={() => stepProgress("backward")}
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 ${isAnimating ? "opacity-30 cursor-not-allowed" : ""}`}
            aria-label="Move backward"
          >
            ↓
          </button>
        </div>
        <div
          className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 py-6 transition-opacity duration-500 sm:px-6 ${
            overlayActive ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          {overlay && (
            <div className="pointer-events-none relative w-full max-w-2xl rounded-[28px] p-6">
              <div className="ml-16 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.3em] text-white/50">
                <span>{overlay.title}</span>
              </div>
              <div className="mt-4 flex w-full flex-col items-center pointer-events-auto">
                {overlay.type === "projects" && (
                  <ul className="mx-auto grid w-full max-w-md gap-3 text-center">
                    {overlay.items.map((item, index) => (
                      <li
                        key={item.title}
                        className={`rounded-2xl p-3 transition-all duration-500 ease-out ${
                          overlayActive
                            ? "opacity-70 translate-x-0"
                            : "opacity-0 translate-x-36"
                        }`}
                        style={{ transitionDelay: `${index * 200}ms` }}
                      >
                        <div className="flex flex-col items-center gap-1 text-center">
                          <a
                            href={item.href}
                            target="_blank"
                            className="text-sm font-semibold text-white"
                          >
                            {item.title}
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4 flex w-full flex-col items-center pointer-events-auto">
                {overlay.type === "accounts" && (
                  <ul className="mx-auto grid w-full max-w-md gap-3 text-center">
                    {overlay.items.map((item, index) => (
                      <li
                        key={item.label}
                        className={`rounded-2xl p-3 transition-all duration-500 ease-out ${
                          overlayActive
                            ? "opacity-70 translate-x-0"
                            : "opacity-0 translate-x-36"
                        }`}
                        style={{ transitionDelay: `${index * 200}ms` }}
                      >
                        <div className="flex flex-col items-center gap-1 text-center">
                          <a
                            href={item.href}
                            target="_blank"
                            className="text-sm font-semibold text-white"
                          >
                            {item.label}
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
