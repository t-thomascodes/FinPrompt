import html2canvas from "html2canvas";

type ScrollBackup = {
  overflow: string;
  height: string;
  maxHeight: string;
  scrollTop: number;
};

/**
 * html2canvas often draws only the top sliver of glyphs inside `overflow:hidden`
 * (Tailwind `truncate`, `line-clamp-*`). Strip those on the **clone** only so the
 * live UI is unchanged.
 */
function relaxTextClippingInClone(clonedRoot: HTMLElement) {
  const stripTruncate = (el: HTMLElement) => {
    el.classList.remove("truncate");
    el.style.setProperty("overflow", "visible", "important");
    el.style.setProperty("text-overflow", "clip", "important");
    el.style.setProperty("white-space", "normal", "important");
  };

  const stripLineClamp = (el: HTMLElement) => {
    const clampRe = /^line-clamp-(?:[1-9]|1[0-2])$/;
    Array.from(el.classList).forEach((c) => {
      if (clampRe.test(c)) el.classList.remove(c);
    });
    el.style.setProperty("overflow", "visible", "important");
    el.style.setProperty("display", "block", "important");
    el.style.setProperty("-webkit-line-clamp", "unset", "important");
    el.style.setProperty("-webkit-box-orient", "unset", "important");
  };

  if (clonedRoot.classList.contains("truncate")) stripTruncate(clonedRoot);
  clonedRoot.querySelectorAll(".truncate").forEach((n) => {
    stripTruncate(n as HTMLElement);
  });

  clonedRoot.querySelectorAll("[class*='line-clamp']").forEach((n) => {
    const el = n as HTMLElement;
    if (Array.from(el.classList).some((c) => /^line-clamp-/.test(c))) {
      stripLineClamp(el);
    }
  });
}

async function waitForFontsStable(): Promise<void> {
  try {
    if (typeof document !== "undefined" && document.fonts?.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise<void>((r) => setTimeout(r, 1500)),
      ]);
    }
  } catch {
    /* ignore */
  }
}

function readBackup(el: HTMLElement): ScrollBackup {
  return {
    overflow: el.style.overflow,
    height: el.style.height,
    maxHeight: el.style.maxHeight,
    scrollTop: el.scrollTop,
  };
}

function expand(el: HTMLElement) {
  el.style.overflow = "visible";
  el.style.height = "auto";
  el.style.maxHeight = "none";
  el.scrollTop = 0;
}

function restore(el: HTMLElement, b: ScrollBackup) {
  el.style.overflow = b.overflow;
  el.style.height = b.height;
  el.style.maxHeight = b.maxHeight;
  el.scrollTop = b.scrollTop;
}

function raf2(): Promise<void> {
  return new Promise((r) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => r());
    });
  });
}

const DASHBOARD_CAPTURE_SCALE = 2.75;
/** Lower scale for JSON/API exports (Word) to keep base64 payload reasonable. */
export const DASHBOARD_CAPTURE_SCALE_DOCX = 1.85;

export type CaptureDashboardOptions = {
  /** html2canvas scale; default high-res for PDF. */
  scale?: number;
};

/**
 * Single high-res PNG of metrics + charts for one PDF dashboard page.
 * Returns null if there is no dashboard element or nothing to capture.
 */
export async function captureDashboardPng(
  element: HTMLElement | null,
  options?: CaptureDashboardOptions,
): Promise<string | null> {
  if (!element || element.offsetHeight < 4) return null;

  const scale = options?.scale ?? DASHBOARD_CAPTURE_SCALE;

  const b = readBackup(element);
  expand(element);

  try {
    await waitForFontsStable();
    await raf2();
    await new Promise<void>((r) => setTimeout(r, 80));

    const w = element.scrollWidth;
    const h = element.scrollHeight;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: w,
      height: h,
      windowWidth: w,
      windowHeight: h,
      onclone: (_doc, cloned) => {
        relaxTextClippingInClone(cloned);
      },
    });

    return canvas.toDataURL("image/png", 1.0);
  } finally {
    restore(element, b);
  }
}
