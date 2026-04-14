import html2canvas from "html2canvas";

type ScrollBackup = {
  overflow: string;
  height: string;
  maxHeight: string;
  scrollTop: number;
};

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
    await raf2();

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
    });

    return canvas.toDataURL("image/png", 1.0);
  } finally {
    restore(element, b);
  }
}
