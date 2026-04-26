import OBR from "@owlbear-rodeo/sdk";

const PLUGIN_ID = "com.bestiary";
const TOOL_ID = `${PLUGIN_ID}/tool`;
const POPOVER_ID = `${PLUGIN_ID}/popover`;
const INFO_POPOVER_ID = `${PLUGIN_ID}/info`;
const POPOVER_URL = "https://obr.dnd.center/bestiary/index.html";
const INFO_URL = "https://obr.dnd.center/bestiary/monster-info.html";
const ICON_URL = "https://obr.dnd.center/bestiary/icon.svg";

const BESTIARY_SLUG_KEY = "com.bestiary/slug";
const INFO_SHOW_MSG = `${PLUGIN_ID}/info-show`;

const POPOVER_WIDTH = 350;
const POPOVER_HEIGHT = 600;
const RIGHT_OFFSET = 60;  // pixels from right edge (clear of toolbar)
const TOP_OFFSET = 80;

const INFO_WIDTH = 520;
const INFO_HEIGHT = 340;
const INFO_TOP_OFFSET = 60; // clear of OBR's top toolbar

let isOpen = false;
let infoPopoverOpen = false;
let currentInfoSlug: string | null = null;

async function openPanel() {
  try {
    const vpWidth = await OBR.viewport.getWidth();
    await OBR.popover.open({
      id: POPOVER_ID,
      url: POPOVER_URL,
      width: POPOVER_WIDTH,
      height: POPOVER_HEIGHT,
      anchorReference: "POSITION",
      anchorPosition: { left: vpWidth - RIGHT_OFFSET, top: TOP_OFFSET },
      anchorOrigin: { horizontal: "RIGHT", vertical: "TOP" },
      transformOrigin: { horizontal: "RIGHT", vertical: "TOP" },
      disableClickAway: true,
    });
    isOpen = true;
  } catch (e) {
    console.error("[bestiary] open failed", e);
  }
}

async function closePanel() {
  try { await OBR.popover.close(POPOVER_ID); } catch {}
  isOpen = false;
}

// --- Monster info popover (DM-only) ---
// Open-on-demand: only open the popover while a monster is selected. When
// nothing is selected, the iframe doesn't exist at all, so the top-center
// region is fully click-through. While the popover is already open and the
// DM selects a different bestiary monster, we broadcast SHOW for an in-place
// 0-frame content swap instead of close/reopen.
async function openInfoPopoverFor(slug: string) {
  if (infoPopoverOpen) return;
  try {
    const vw = await OBR.viewport.getWidth();
    await OBR.popover.open({
      id: INFO_POPOVER_ID,
      url: `${INFO_URL}?slug=${encodeURIComponent(slug)}`,
      width: INFO_WIDTH,
      height: INFO_HEIGHT,
      anchorReference: "POSITION",
      anchorPosition: { left: Math.round(vw / 2), top: INFO_TOP_OFFSET },
      anchorOrigin: { horizontal: "CENTER", vertical: "TOP" },
      transformOrigin: { horizontal: "CENTER", vertical: "TOP" },
      hidePaper: true,
      disableClickAway: true,
    });
    infoPopoverOpen = true;
  } catch (e) {
    console.error("[bestiary] openInfoPopoverFor failed", e);
  }
}

async function closeInfoPopover() {
  try { await OBR.popover.close(INFO_POPOVER_ID); } catch {}
  infoPopoverOpen = false;
  currentInfoSlug = null;
}

async function showInfoFor(slug: string) {
  if (currentInfoSlug === slug && infoPopoverOpen) return;
  if (!infoPopoverOpen) {
    await openInfoPopoverFor(slug);
  } else {
    // Already open — in-place swap, 0 frames.
    try {
      await OBR.broadcast.sendMessage(INFO_SHOW_MSG, { slug }, { destination: "LOCAL" });
    } catch {}
  }
  currentInfoSlug = slug;
}

async function hideInfo() {
  if (!infoPopoverOpen && currentInfoSlug === null) return;
  await closeInfoPopover();
}

async function handleSelection(selection: string[] | undefined) {
  if (!selection || selection.length !== 1) {
    if (currentInfoSlug) await hideInfo();
    return;
  }
  let slug: string | null = null;
  try {
    const items = await OBR.scene.items.getItems(selection);
    const m = items[0]?.metadata?.[BESTIARY_SLUG_KEY];
    if (typeof m === "string") slug = m;
  } catch {}
  if (!slug) {
    if (currentInfoSlug) await hideInfo();
    return;
  }
  if (currentInfoSlug === slug) return;
  await showInfoFor(slug);
}

OBR.onReady(async () => {
  // Toolbar tool — GM only. Behaves like a real tool: clicking activates it
  // (panel opens), switching to another tool deactivates it (panel closes).
  await OBR.tool.create({
    id: TOOL_ID,
    icons: [
      {
        icon: ICON_URL,
        label: "怪物图鉴",
        filter: { roles: ["GM"] },
      },
    ],
    onClick: async () => {
      // Activating our own tool; onToolChange below opens the panel.
      await OBR.tool.activateTool(TOOL_ID);
      return false;
    },
  });

  // Bestiary needs at least one tool mode for cursor handling while active.
  // We don't consume any pointer events — just a passthrough mode.
  await OBR.tool.createMode({
    id: `${TOOL_ID}/mode`,
    icons: [
      {
        icon: ICON_URL,
        label: "浏览",
        filter: { activeTools: [TOOL_ID] },
      },
    ],
    cursors: [{ cursor: "default" }],
  });

  // Open / close panel based on which tool is active.
  OBR.tool.onToolChange(async (activeId) => {
    if (activeId === TOOL_ID) {
      if (!isOpen) await openPanel();
    } else {
      if (isOpen) await closePanel();
    }
  });

  // Listen for close requests from the panel iframe (close button) — switch
  // back to the default select tool so our tool deactivates cleanly.
  OBR.broadcast.onMessage(`${PLUGIN_ID}/close`, async () => {
    try { await OBR.tool.activateTool("rodeo.owlbear.tool/move"); } catch {
      await closePanel();
    }
  });

  // --- DM-only monster info popover ---
  let role: "GM" | "PLAYER" = "PLAYER";
  try { role = await OBR.player.getRole(); } catch {}
  if (role !== "GM") return;

  // Close info popover when the scene unloads so we don't leave a stale one.
  OBR.scene.onReadyChange(async (ready) => {
    if (!ready) await closeInfoPopover();
  });

  OBR.player.onChange(async (player) => {
    try { await handleSelection(player.selection); } catch {}
  });

  try {
    const sel = await OBR.player.getSelection();
    await handleSelection(sel);
  } catch {}

  // Hide if the bound monster item is deleted.
  OBR.scene.items.onChange(async () => {
    if (!currentInfoSlug) return;
    try {
      const sel = await OBR.player.getSelection();
      await handleSelection(sel);
    } catch {}
  });
});
