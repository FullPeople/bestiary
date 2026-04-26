import { render } from "preact";
import { useEffect, useState, useCallback, useRef } from "preact/compat";
import OBR from "@owlbear-rodeo/sdk";
import { ParsedMonster, MonsterEdition } from "./types";
import { loadAllMonsters, searchMonsters } from "./data";
import { spawnMonster } from "./spawn";
import "./styles.css";

// Persisted UI state (keys are shared across panel opens / reloads).
const LS_PREFIX = "bestiary/";
const readLS = (k: string, d: string) => {
  try { return localStorage.getItem(LS_PREFIX + k) ?? d; } catch { return d; }
};
const writeLS = (k: string, v: string) => {
  try { localStorage.setItem(LS_PREFIX + k, v); } catch {}
};

function App() {
  const [monsters, setMonsters] = useState<ParsedMonster[]>([]);
  const [filtered, setFiltered] = useState<ParsedMonster[]>([]);
  const [query, setQuery] = useState(() => readLS("query", ""));
  const [sortDesc, setSortDesc] = useState(() => readLS("sortDesc", "0") === "1");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"GM" | "PLAYER">("PLAYER");
  const [show2014, setShow2014] = useState(() => readLS("show2014", "1") === "1");
  const [show2024, setShow2024] = useState(() => readLS("show2024", "1") === "1");
  // 弹窗 toggle — uses a different prefix because it's read by background.ts
  // too. Default ON.
  const [autoPopup, setAutoPopup] = useState(() => {
    try { return localStorage.getItem("com.bestiary/auto-popup") !== "0"; } catch { return true; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    OBR.player.getRole().then(setRole);

    loadAllMonsters().then((all) => {
      setMonsters(all);
      const initialEds = new Set<MonsterEdition>();
      if (show2014) initialEds.add("2014");
      if (show2024) initialEds.add("2024");
      setFiltered(searchMonsters(all, query, sortDesc, initialEds));
      setLoading(false);
    });
  }, []);

  const editions = (() => {
    const s = new Set<MonsterEdition>();
    if (show2014) s.add("2014");
    if (show2024) s.add("2024");
    return s;
  })();

  const doSearch = useCallback(
    (q: string, desc: boolean, eds: Set<MonsterEdition>) => {
      setFiltered(searchMonsters(monsters, q, desc, eds));
    },
    [monsters]
  );

  const handleSearch = useCallback(
    (e: Event) => {
      const val = (e.target as HTMLInputElement).value;
      setQuery(val);
      writeLS("query", val);
      doSearch(val, sortDesc, editions);
    },
    [doSearch, sortDesc, editions]
  );

  const toggleSort = useCallback(() => {
    const newDesc = !sortDesc;
    setSortDesc(newDesc);
    writeLS("sortDesc", newDesc ? "1" : "0");
    doSearch(query, newDesc, editions);
  }, [sortDesc, query, doSearch, editions]);

  const toggle2014 = useCallback(() => {
    const next = !show2014;
    setShow2014(next);
    writeLS("show2014", next ? "1" : "0");
    const eds = new Set<MonsterEdition>();
    if (next) eds.add("2014");
    if (show2024) eds.add("2024");
    doSearch(query, sortDesc, eds);
  }, [show2014, show2024, query, sortDesc, doSearch]);

  const toggle2024 = useCallback(() => {
    const next = !show2024;
    setShow2024(next);
    writeLS("show2024", next ? "1" : "0");
    const eds = new Set<MonsterEdition>();
    if (show2014) eds.add("2014");
    if (next) eds.add("2024");
    doSearch(query, sortDesc, eds);
  }, [show2014, show2024, query, sortDesc, doSearch]);

  const handleSpawn = useCallback(async (mon: ParsedMonster) => {
    await spawnMonster(mon);
  }, []);

  // Dynamic height
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = Math.min(entry.contentRect.height + 2, 700);
        OBR.action.setHeight(Math.max(h, 100));
      }
    });
    const root = document.getElementById("root");
    if (root) observer.observe(root);
    return () => observer.disconnect();
  }, []);

  if (role !== "GM") {
    return (
      <div class="app">
        <div class="empty">仅 DM 可用</div>
      </div>
    );
  }

  const handleClearSearch = useCallback(() => {
    setQuery("");
    writeLS("query", "");
    doSearch("", sortDesc, editions);
    inputRef.current?.focus();
  }, [doSearch, sortDesc, editions]);

  const handleAbout = useCallback(() => {
    OBR.modal.open({
      id: "com.bestiary/about",
      url: "https://obr.dnd.center/bestiary/about.html",
      width: 420,
      height: 560,
    });
  }, []);

  const toggleAutoPopup = useCallback(() => {
    const next = !autoPopup;
    setAutoPopup(next);
    try { localStorage.setItem("com.bestiary/auto-popup", next ? "1" : "0"); } catch {}
    // Notify background.ts so it can re-evaluate the current selection.
    try {
      OBR.broadcast.sendMessage(
        "com.bestiary/auto-popup-toggled",
        {},
        { destination: "LOCAL" }
      );
    } catch {}
  }, [autoPopup]);

  return (
    <div class="app">
      <div class="header">
        <div class="header-top">
          <input
            ref={inputRef}
            type="text"
            class="search"
            placeholder="搜索怪物名称/类型/CR..."
            value={query}
            onInput={handleSearch}
          />
          <button
            class="close-btn"
            onClick={handleClearSearch}
            title="清空搜索"
            disabled={!query}
            aria-label="清空搜索"
          >
            ✕
          </button>
        </div>
        <div class="header-row">
          <span class="count">
            {loading ? "加载中..." : `${filtered.length} / ${monsters.length}`}
          </span>
          <button
            class={`ed-btn${show2014 ? " on" : ""}`}
            onClick={toggle2014}
            title="2014 版怪物"
          >
            2014
          </button>
          <button
            class={`ed-btn${show2024 ? " on" : ""}`}
            onClick={toggle2024}
            title="2024 版怪物"
          >
            2024
          </button>
          <button class="sort-btn" onClick={toggleSort} title="按CR排序">
            CR {sortDesc ? "↓" : "↑"}
          </button>
          <button
            class={`ed-btn${autoPopup ? " on" : ""}`}
            onClick={toggleAutoPopup}
            title={autoPopup
              ? "已开启：选中怪物时自动弹出信息（点击关闭）"
              : "已关闭：选中怪物不会弹出信息（点击开启）"}
          >
            弹窗
          </button>
          <button class="about-btn" onClick={handleAbout} title="关于">
            关于
          </button>
        </div>
      </div>
      <div class="list">
        {filtered.map((mon) => (
          <MonsterCard key={`${mon.source}-${mon.engName}`} monster={mon} onSpawn={handleSpawn} />
        ))}
        {!loading && filtered.length === 0 && (
          <div class="empty">未找到匹配的怪物</div>
        )}
      </div>
    </div>
  );
}

function MonsterCard({
  monster,
  onSpawn,
}: {
  monster: ParsedMonster;
  onSpawn: (m: ParsedMonster) => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div class="card" onClick={() => onSpawn(monster)}>
      <div class="card-left">
        {!imgErr && monster.tokenUrl ? (
          <img
            src={monster.tokenUrl}
            alt=""
            class="token"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div class="token-placeholder">
            {monster.name.charAt(0)}
          </div>
        )}
      </div>
      <div class="card-info">
        <div class="card-name">{monster.name}</div>
        <div class="card-sub">{monster.engName}</div>
        <div class="card-tags">
          <span class="tag">{monster.size}</span>
          <span class="tag">{monster.type}</span>
          <span class="tag">CR {monster.cr}</span>
        </div>
      </div>
      <div class="card-stats">
        <div class="stat">
          <span class="stat-val hp">{monster.hp}</span>
          <span class="stat-label">HP</span>
        </div>
        <div class="stat">
          <span class="stat-val ac">{monster.ac}</span>
          <span class="stat-label">AC</span>
        </div>
        <div class="stat">
          <span class="stat-val dex">{monster.dexMod >= 0 ? `+${monster.dexMod}` : monster.dexMod}</span>
          <span class="stat-label">DEX</span>
        </div>
      </div>
    </div>
  );
}

function PluginGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    OBR.onReady(() => setReady(true));
  }, []);

  if (!ready) return <div class="app"><div class="empty">加载中...</div></div>;
  return <App />;
}

render(<PluginGate />, document.getElementById("root")!);
