import OBR, { buildImage } from "@owlbear-rodeo/sdk";
import { ParsedMonster } from "./types";

const BUBBLES_META = "com.owlbear-rodeo-bubbles-extension/metadata";
const BUBBLES_NAME = "com.owlbear-rodeo-bubbles-extension/name";
const INITIATIVE_META = "com.initiative-tracker/data";
const INITIATIVE_MODKEY = "com.initiative-tracker/dexMod";

function roll1d20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

// Probe actual image dimensions
function getImageSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 280, h: 280 }); // fallback
    img.src = url;
  });
}

export async function spawnMonster(monster: ParsedMonster) {
  const tokenUrl = monster.tokenUrl || `https://5e.kiwee.top/img/bestiary/tokens/MM/Commoner.webp`;

  const [vpWidth, vpHeight, vpPos, vpScale, imgSize] = await Promise.all([
    OBR.viewport.getWidth(),
    OBR.viewport.getHeight(),
    OBR.viewport.getPosition(),
    OBR.viewport.getScale(),
    getImageSize(tokenUrl),
  ]);

  const worldX = (-vpPos.x + vpWidth / 2) / vpScale;
  const worldY = (-vpPos.y + vpHeight / 2) / vpScale;
  const offsetX = (Math.random() - 0.5) * 200;
  const offsetY = (Math.random() - 0.5) * 200;

  const initiativeRoll = roll1d20();
  const halfW = imgSize.w / 2;
  const halfH = imgSize.h / 2;

  // DPI = image width → token occupies exactly 1 grid cell
  const item = buildImage(
    {
      width: imgSize.w,
      height: imgSize.h,
      url: tokenUrl,
      mime: "image/webp",
    },
    { dpi: imgSize.w, offset: { x: halfW, y: halfH } }
  )
    .position({ x: worldX + offsetX, y: worldY + offsetY })
    .name(monster.name)
    .visible(false)
    .layer("CHARACTER")
    .metadata({
      [BUBBLES_META]: {
        "health": monster.hp,
        "max health": monster.hp,
        "temporary health": 0,
        "armor class": monster.ac,
        "hide": true,
      },
      [BUBBLES_NAME]: monster.name,
      [INITIATIVE_META]: {
        count: initiativeRoll,
        active: false,
      },
      [INITIATIVE_MODKEY]: monster.dexMod,
    })
    .build();

  await OBR.scene.items.addItems([item]);

  const modStr = monster.dexMod >= 0 ? `+${monster.dexMod}` : `${monster.dexMod}`;
  OBR.notification.show(
    `${monster.name} 已加入 (隐藏) HP:${monster.hp} AC:${monster.ac} 先攻:${initiativeRoll}(${modStr})`
  );
}
