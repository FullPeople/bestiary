import { render } from "preact";
import { useEffect, useState, useCallback, useRef } from "preact/compat";
import OBR from "@owlbear-rodeo/sdk";
import { ParsedMonster } from "./types";
import { loadAllMonsters, searchMonsters } from "./data";
import { spawnMonster } from "./spawn";
import "./styles.css";

function App() {
  const [monsters, setMonsters] = useState<ParsedMonster[]>([]);
  const [filtered, setFiltered] = useState<ParsedMonster[]>([]);
  const [query, setQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"GM" | "PLAYER">("PLAYER");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    OBR.player.getRole().then(setRole);

    loadAllMonsters().then((all) => {
      setMonsters(all);
      setFiltered(searchMonsters(all, "", false));
      setLoading(false);
    });
  }, []);

  const doSearch = useCallback(
    (q: string, desc: boolean) => {
      setFiltered(searchMonsters(monsters, q, desc));
    },
    [monsters]
  );

  const handleSearch = useCallback(
    (e: Event) => {
      const val = (e.target as HTMLInputElement).value;
      setQuery(val);
      doSearch(val, sortDesc);
    },
    [doSearch, sortDesc]
  );

  const toggleSort = useCallback(() => {
    const newDesc = !sortDesc;
    setSortDesc(newDesc);
    doSearch(query, newDesc);
  }, [sortDesc, query, doSearch]);

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

  return (
    <div class="app">
      <div class="header">
        <input
          ref={inputRef}
          type="text"
          class="search"
          placeholder="搜索怪物名称/类型/CR..."
          value={query}
          onInput={handleSearch}
        />
        <div class="header-row">
          <span class="count">
            {loading ? "加载中..." : `${monsters.length} 个怪物`}
          </span>
          <button class="sort-btn" onClick={toggleSort} title="按CR排序">
            CR {sortDesc ? "↓" : "↑"}
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
