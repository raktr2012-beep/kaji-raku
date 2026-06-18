"use client";

import { useState, useEffect, useCallback } from "react";

// ========== Types ==========
interface Purchase {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  date: string;
}

interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  addedDate: string;
}

interface ShopItem {
  id: string;
  name: string;
}

interface Favorite {
  name: string;
  price: number;
  category: string;
}

// ========== Parser ==========
const FOOD_KW = [
  "米","肉","豚","牛","鶏","魚","鮭","鯖","えび","いか","たこ",
  "卵","たまご","牛乳","ミルク","パン","豆腐","納豆","味噌","みそ",
  "醤油","しょうゆ","酢","砂糖","塩","油","バター","マヨネーズ","ケチャップ",
  "ソース","みりん","酒","料理酒","だし","コンソメ","カレー",
  "キャベツ","レタス","トマト","きゅうり","なす","ピーマン",
  "にんじん","人参","玉ねぎ","たまねぎ","じゃがいも","さつまいも",
  "大根","白菜","ほうれん草","小松菜","もやし","ねぎ","長ねぎ",
  "にんにく","しょうが","生姜","きのこ","しめじ","えのき","舞茸",
  "りんご","バナナ","みかん","いちご","ぶどう",
  "こんにゃく","ちくわ","かまぼこ","ハム","ベーコン","ソーセージ","ウインナー",
  "チーズ","ヨーグルト","麺","うどん","そば","パスタ","スパゲッティ",
  "ラーメン","そうめん","餅","海苔","のり","わかめ",
  "ジュース","お茶","茶","コーヒー","水","炭酸",
  "冷凍","惣菜","弁当","おにぎり","サラダ","刺身","漬物",
  "ケーキ","お菓子","チョコ","アイス","せんべい","クッキー",
  "小麦粉","片栗粉","パン粉","マーガリン","ジャム","ドレッシング","ポン酢",
  "梅干し","ふりかけ","鰹節","昆布",
];

const DAILY_KW = [
  "歯磨き粉","歯ブラシ","洗剤","柔軟剤","シャンプー","リンス","コンディショナー",
  "ボディソープ","石鹸","せっけん","ティッシュ","トイレットペーパー",
  "キッチンペーパー","ラップ","アルミホイル","ゴミ袋","スポンジ",
  "ハンドソープ","消毒","マスク","綿棒","ナプキン","おむつ",
  "電池","電球","生理用品","化粧","リップ","日焼け止め",
];

function categorize(name: string): string {
  const n = name.toLowerCase();
  if (FOOD_KW.some(k => n.includes(k))) return "食費";
  if (DAILY_KW.some(k => n.includes(k))) return "日用品";
  if (n.includes("肉") || n.includes("魚") || n.includes("菜") || n.includes("飲")) return "食費";
  return "その他";
}

function parseItems(input: string): Omit<Purchase, "id" | "date">[] {
  const results: Omit<Purchase, "id" | "date">[] = [];
  const parts = input.split(/[,、\n]+/).map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const m1 = part.match(/^(.+?)(\d+)[\.・](\d+)$/);
    if (m1) { results.push({ name: m1[1].trim(), quantity: parseInt(m1[2]), price: parseInt(m1[3]), category: categorize(m1[1].trim()) }); continue; }
    const m2 = part.match(/^(.+?)(\d+)$/);
    if (m2 && m2[1].trim()) { results.push({ name: m2[1].trim(), quantity: 1, price: parseInt(m2[2]), category: categorize(m2[1].trim()) }); continue; }
    if (part.trim()) { results.push({ name: part.trim(), quantity: 1, price: 0, category: categorize(part.trim()) }); }
  }
  return results;
}

// ========== Storage ==========
function load<T>(key: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem("kaji:" + key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}

const CAT_COLORS: Record<string, string> = { "食費": "#48B287", "日用品": "#3B82C4", "その他": "#9B8AB8" };

export default function KajiRaku() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [fridge, setFridge] = useState<FridgeItem[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [showFav, setShowFav] = useState(false);
  const [newShop, setNewShop] = useState("");
  const [ready, setReady] = useState(false);
  const [parsed, setParsed] = useState<Omit<Purchase, "id" | "date">[] | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    setPurchases(load("purchases", []));
    setFridge(load("fridge", []));
    setShop(load("shop", []));
    setFavs(load("favs", []));
    setReady(true);
  }, []);

  const sv = useCallback((key: string, data: unknown) => {
    if (typeof window !== "undefined") try { localStorage.setItem("kaji:" + key, JSON.stringify(data)); } catch {}
  }, []);
  useEffect(() => { if (ready) sv("purchases", purchases); }, [purchases, ready, sv]);
  useEffect(() => { if (ready) sv("fridge", fridge); }, [fridge, ready, sv]);
  useEffect(() => { if (ready) sv("shop", shop); }, [shop, ready, sv]);
  useEffect(() => { if (ready) sv("favs", favs); }, [favs, ready, sv]);

  useEffect(() => { setParsed(input.trim() ? parseItems(input) : null); }, [input]);

  const record = () => {
    if (!parsed || parsed.length === 0) return;
    const now = new Date().toISOString();
    const dated = parsed.map((item, i) => ({ ...item, id: `${Date.now()}-${i}`, date: now }));
    setPurchases(prev => [...prev, ...dated]);
    const food = dated.filter(d => d.category === "食費").map(d => ({ id: d.id, name: d.name, quantity: d.quantity, addedDate: now }));
    if (food.length > 0) setFridge(prev => [...prev, ...food]);
    setShop(prev => prev.filter(s => !parsed!.some(p => p.name.includes(s.name) || s.name.includes(p.name))));
    setInput(""); setParsed(null);
  };

  const mp = purchases.filter(p => p.date.startsWith(viewMonth));
  const wp = (() => { const a = new Date(Date.now() - 7 * 864e5); return purchases.filter(p => new Date(p.date) >= a); })();
  const sumCat = (items: Purchase[]) => { const s: Record<string, number> = { "食費": 0, "日用品": 0, "その他": 0 }; items.forEach(i => (s[i.category] = (s[i.category] || 0) + i.price)); return s; };
  const tot = (items: Purchase[]) => items.reduce((s, i) => s + i.price, 0);
  const ds = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
  const ml = viewMonth.replace("-", "年") + "月";
  const nm = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const cm = (dir: number) => { const [y, m] = viewMonth.split("-").map(Number); const d = new Date(y, m - 1 + dir, 1); setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };

  if (!ready) return <div className="flex items-center justify-center h-screen text-gray-400">読み込み中...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>
      <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-gray-100">
        <span className="text-xl">🍳</span>
        <span className="text-lg font-bold text-gray-700">かじラク</span>
      </div>

      <div className="flex-1 overflow-auto pb-2">
        {tab === 0 && (
          <div className="p-4">
            <p className="text-xs text-gray-400 mb-2">買ったものを入力（例: ピーマン2.280、米3980）</p>
            <textarea className="w-full p-3 text-base border-2 border-gray-200 rounded-xl outline-none resize-none bg-white" value={input} onChange={e => setInput(e.target.value)} placeholder="ピーマン2.280、牛乳198" rows={3} />
            {parsed && parsed.length > 0 && (
              <div className="mt-2 p-3 bg-blue-50 rounded-xl text-sm">
                <p className="text-xs text-gray-500 mb-1">解析プレビュー</p>
                {parsed.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[p.category] }} />
                    <span className="flex-1">{p.name}</span>
                    {p.quantity > 1 && <span className="text-xs text-gray-400">×{p.quantity}</span>}
                    <span className="font-semibold">¥{p.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-40" onClick={record} disabled={!parsed || parsed.length === 0}>記録する</button>
              <button className="py-3 px-4 bg-amber-50 text-gray-700 rounded-xl font-semibold text-sm" onClick={() => setShowFav(!showFav)}>⭐ お気に入り</button>
            </div>
            {showFav && (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-400 mb-2">お気に入り（タップで入力に追加）</p>
                {favs.length === 0 ? <p className="text-xs text-gray-400">まだありません。家計画面から追加できます。</p> : (
                  <div className="flex flex-wrap gap-2">
                    {favs.map((f, i) => (
                      <button key={i} className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm"
                        onClick={() => { setInput(prev => prev ? `${prev}、${f.name}${f.price}` : `${f.name}${f.price}`); setShowFav(false); }}>
                        {f.name} ¥{f.price.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {purchases.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold text-gray-400 mb-2">最近の入力</p>
                {[...purchases].reverse().slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-100">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[p.category] }} />
                    <span className="flex-1 text-sm">{p.name}</span>
                    {p.quantity > 1 && <span className="text-xs text-gray-400">×{p.quantity}</span>}
                    <span className="text-sm font-semibold">¥{p.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="p-4">
            <div className="flex items-center justify-center gap-5 mb-4">
              <button className="text-blue-500 text-lg" onClick={() => cm(-1)}>◀</button>
              <span className="font-bold">{ml}</span>
              <button className="text-blue-500 text-lg disabled:opacity-30" onClick={() => viewMonth < nm && cm(1)} disabled={viewMonth >= nm}>▶</button>
            </div>
            <div className="bg-white rounded-2xl p-5 text-center mb-3 shadow-sm">
              <div className="text-xs text-gray-400 mb-1">月の合計</div>
              <div className="text-3xl font-bold text-gray-700">¥{tot(mp).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {Object.entries(sumCat(mp)).map(([cat, sum]) => (
                <div key={cat} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="w-6 h-1 rounded mx-auto mb-2" style={{ background: CAT_COLORS[cat] }} />
                  <div className="text-xs text-gray-400">{cat}</div>
                  <div className="font-bold">¥{sum.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center mb-5">
              <span className="text-sm text-gray-500">直近7日間</span>
              <span className="text-lg font-bold text-blue-500">¥{tot(wp).toLocaleString()}</span>
            </div>
            <p className="text-xs font-bold text-gray-400 mb-2">明細</p>
            {mp.length === 0 ? <p className="text-xs text-gray-400">この月の記録はありません</p> :
              [...mp].reverse().map(p => (
                <div key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-100">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[p.category] }} />
                  <span className="flex-1 text-sm">{p.name}</span>
                  <span className="text-sm font-semibold">¥{p.price.toLocaleString()}</span>
                  <button className="text-base" onClick={() => { if (!favs.find(f => f.name === p.name)) setFavs(prev => [...prev, { name: p.name, price: p.price, category: p.category }]); }}>
                    {favs.find(f => f.name === p.name) ? "⭐" : "☆"}
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {tab === 2 && (
          <div className="p-4">
            <p className="text-xs font-bold text-gray-400 mb-2">冷蔵庫の中身（{fridge.length}品）</p>
            {fridge.length === 0 ? <p className="text-xs text-gray-400 leading-relaxed">冷蔵庫は空です。入力画面から買い物を記録すると、食品が自動で追加されます。</p> :
              [...fridge].sort((a, b) => new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()).map(item => {
                const d = ds(item.addedDate);
                return (
                  <div key={item.id} className="flex items-center gap-2 py-3 border-b border-gray-100">
                    <button className="w-7 h-7 border-2 border-gray-300 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0"
                      onClick={() => setFridge(prev => prev.filter(f => f.id !== item.id))}>☐</button>
                    <span className="flex-1 text-sm">{item.name}</span>
                    {item.quantity > 1 && <span className="text-xs text-gray-400">×{item.quantity}</span>}
                    <span className={`text-xs ${d >= 5 ? "text-red-500 font-bold" : "text-gray-400"}`}>{d === 0 ? "今日" : `${d}日前`}</span>
                    <button className="text-sm" onClick={() => { if (!shop.find(s => s.name === item.name)) setShop(prev => [...prev, { name: item.name, id: Date.now().toString() }]); }}>🛒</button>
                  </div>
                );
              })
            }
          </div>
        )}

        {tab === 3 && (
          <div className="p-4">
            <p className="text-xs font-bold text-gray-400 mb-2">買い足しリスト</p>
            <div className="flex gap-2 mb-4">
              <input className="flex-1 p-3 text-sm border-2 border-gray-200 rounded-xl outline-none bg-white" value={newShop} onChange={e => setNewShop(e.target.value)} placeholder="追加するもの"
                onKeyDown={e => { if (e.key === "Enter" && newShop.trim()) { setShop(prev => [...prev, { name: newShop.trim(), id: Date.now().toString() }]); setNewShop(""); } }} />
              <button className="px-5 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm"
                onClick={() => { if (newShop.trim()) { setShop(prev => [...prev, { name: newShop.trim(), id: Date.now().toString() }]); setNewShop(""); } }}>追加</button>
            </div>
            {shop.length === 0 ? <p className="text-xs text-gray-400 leading-relaxed">買い物リストは空です。</p> :
              shop.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-100">
                  <button className="w-7 h-7 border-2 border-gray-300 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0"
                    onClick={() => setShop(prev => prev.filter(s => s.id !== item.id))}>☐</button>
                  <span className="flex-1 text-sm">{item.name}</span>
                </div>
              ))
            }
            {favs.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold text-gray-400 mb-2">お気に入りから追加</p>
                <div className="flex flex-wrap gap-2">
                  {favs.map((f, i) => (
                    <button key={i} className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm"
                      onClick={() => { if (!shop.find(s => s.name === f.name)) setShop(prev => [...prev, { name: f.name, id: Date.now().toString() }]); }}>+ {f.name}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex bg-white border-t border-gray-100" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {["入力", "家計", "冷蔵庫", "買い物"].map((t, i) => (
          <button key={t} className="flex-1 flex flex-col items-center gap-0.5 py-2.5"
            style={{ color: tab === i ? "#3B82C4" : "#999", borderTop: tab === i ? "2px solid #3B82C4" : "2px solid transparent" }}
            onClick={() => setTab(i)}>
            <span className="text-lg">{["✏️", "💰", "🧊", "🛒"][i]}</span>
            <span className="text-[10px] font-semibold">{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
