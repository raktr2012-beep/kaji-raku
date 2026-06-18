import { useState, useEffect, useCallback } from "react";

const TABS = ["蜈･蜉�", "螳ｶ險�", "蜀ｷ阡ｵ蠎ｫ", "雋ｷ縺�黄"];
const TAB_ICONS = ["笨擾ｸ�", "腸", "ｧ�", "將"];

const CATEGORY_COLORS = {
  "鬟溯ｲｻ": "#48B287",
  "譌･逕ｨ蜩�": "#3B82C4",
  "縺昴�莉�": "#9B8AB8",
};

export default function KajiRaku() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [fridge, setFridge] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recipes, setRecipes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [newShopItem, setNewShopItem] = useState("");
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Load data from storage
  useEffect(() => {
    async function load() {
      try {
        const keys = ["purchases", "fridge", "shoppingList", "favorites"];
        const setters = [setPurchases, setFridge, setShoppingList, setFavorites];
        for (let i = 0; i < keys.length; i++) {
          try {
            const result = await window.storage.get(`kaji:${keys[i]}`);
            if (result && result.value) {
              setters[i](JSON.parse(result.value));
            }
          } catch (e) {
            // Key doesn't exist yet
          }
        }
      } catch (e) {
        console.error("Load error:", e);
      }
      setInitialized(true);
    }
    load();
  }, []);

  // Save data to storage
  const save = useCallback(async (key, data) => {
    try {
      await window.storage.set(`kaji:${key}`, JSON.stringify(data));
    } catch (e) {
      console.error("Save error:", e);
    }
  }, []);

  useEffect(() => { if (initialized) save("purchases", purchases); }, [purchases, initialized, save]);
  useEffect(() => { if (initialized) save("fridge", fridge); }, [fridge, initialized, save]);
  useEffect(() => { if (initialized) save("shoppingList", shoppingList); }, [shoppingList, initialized, save]);
  useEffect(() => { if (initialized) save("favorites", favorites); }, [favorites, initialized, save]);

  // Parse input with AI
  const parseInput = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `莉･荳九�雋ｷ縺�黄繝｡繝｢繧谷SON縺ｫ螟画鋤縺励※縺上□縺輔＞縲�JSON縺ｮ縺ｿ霑斐＠縺ｦ縺上□縺輔＞縲ゅ�繝ｼ繧ｯ繝繧ｦ繝ｳ縺ｮ繝舌ャ繧ｯ繧ｯ繧ｩ繝ｼ繝医ｂ荳崎ｦ√〒縺吶�

蜈･蜉�: "${input}"

繝輔か繝ｼ繝槭ャ繝�:
[{"name":"蜩∝錐","quantity":謨ｰ驥�,"price":驥鷹｡�(謨ｰ蟄励�縺ｿ),"category":"鬟溯ｲｻ or 譌･逕ｨ蜩� or 縺昴�莉�"}]

繝ｫ繝ｼ繝ｫ:
- "繝斐�繝槭Φ2.280" 縺ｯ name:"繝斐�繝槭Φ", quantity:2, price:280
- "邀ｳ3980" 縺ｯ name:"邀ｳ", quantity:1, price:3980
- 鬟溷刀繝ｻ鬟ｲ譁吶�隱ｿ蜻ｳ譁� 竊� "鬟溯ｲｻ"
- 豢怜王繝ｻ豁ｯ逎ｨ縺咲ｲ峨�繝�ぅ繝�す繝･繝ｻ繧ｷ繝｣繝ｳ繝励�遲� 竊� "譌･逕ｨ蜩�"
- 縺昴ｌ莉･螟� 竊� "縺昴�莉�"
- 驥鷹｡阪′荳肴�縺ｪ繧� price:0`
          }],
        }),
      });
      const data = await response.json();
      const text = data.content[0].text.replace(/```json|```/g, "").trim();
      const items = JSON.parse(text);
      const now = new Date().toISOString();
      const dated = items.map((item, i) => ({
        ...item,
        id: `${Date.now()}-${i}`,
        date: now,
      }));

      setPurchases(prev => [...prev, ...dated]);

      // Add to fridge (food items only)
      const foodItems = dated.filter(d => d.category === "鬟溯ｲｻ").map(d => ({
        id: d.id,
        name: d.name,
        quantity: d.quantity,
        addedDate: now,
      }));
      if (foodItems.length > 0) {
        setFridge(prev => [...prev, ...foodItems]);
      }

      // Remove from shopping list if matched
      setShoppingList(prev =>
        prev.filter(s => !items.some(item => item.name.includes(s.name) || s.name.includes(item.name)))
      );

      setInput("");
    } catch (e) {
      console.error("Parse error:", e);
      alert("蜈･蜉帙�隗｣譫舌↓螟ｱ謨励＠縺ｾ縺励◆縲ゅｂ縺�ｸ蠎ｦ隧ｦ縺励※縺上□縺輔＞縲�");
    }
    setLoading(false);
  };

  // Get recipe suggestions
  const getRecipes = async () => {
    if (fridge.length === 0) return;
    setLoadingRecipes(true);
    setRecipes(null);
    try {
      const items = fridge.map(f => f.name).join("縲�");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `蜀ｷ阡ｵ蠎ｫ縺ｫ縺ゅｋ繧ゅ�: ${items}

縺薙ｌ縺ｧ菴懊ｌ繧狗ｰ｡蜊倥↑譁咏炊繧�3縺､謠先｡医＠縺ｦ縺上□縺輔＞縲�JSON縺ｮ縺ｿ霑斐＠縺ｦ縺上□縺輔＞縲ゅ�繝ｼ繧ｯ繝繧ｦ繝ｳ縺ｮ繝舌ャ繧ｯ繧ｯ繧ｩ繝ｼ繝医ｂ荳崎ｦ√〒縺吶�

繝輔か繝ｼ繝槭ャ繝�:
[{"title":"譁咏炊蜷�","ingredients":["菴ｿ縺�｣滓攝1","菴ｿ縺�｣滓攝2"],"steps":"邁｡蜊倥↑謇矩��ｼ�3陦御ｻ･蜀�ｼ�","time":"逶ｮ螳画凾髢�"}]`
          }],
        }),
      });
      const data = await response.json();
      const text = data.content[0].text.replace(/```json|```/g, "").trim();
      setRecipes(JSON.parse(text));
    } catch (e) {
      console.error("Recipe error:", e);
      alert("繝ｬ繧ｷ繝斐�蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆縲�");
    }
    setLoadingRecipes(false);
  };

  // Add to favorites
  const addFavorite = (item) => {
    if (!favorites.find(f => f.name === item.name)) {
      setFavorites(prev => [...prev, { name: item.name, price: item.price, category: item.category }]);
    }
  };

  // Use favorite (add to input)
  const useFavorite = (fav) => {
    const text = `${fav.name}${fav.price}`;
    setInput(prev => prev ? `${prev}縲�${text}` : text);
    setShowFavorites(false);
  };

  // Remove fridge item
  const removeFridgeItem = (id) => {
    setFridge(prev => prev.filter(f => f.id !== id));
  };

  // Use recipe ingredients
  const useRecipeIngredients = (recipe) => {
    setFridge(prev =>
      prev.filter(f => !recipe.ingredients.some(ing => f.name.includes(ing) || ing.includes(f.name)))
    );
    setRecipes(null);
  };

  // Budget calculations
  const getMonthPurchases = () => {
    return purchases.filter(p => p.date && p.date.startsWith(viewMonth));
  };

  const getWeekPurchases = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return purchases.filter(p => p.date && new Date(p.date) >= weekAgo);
  };

  const sumByCategory = (items) => {
    const sums = { "鬟溯ｲｻ": 0, "譌･逕ｨ蜩�": 0, "縺昴�莉�": 0 };
    items.forEach(item => {
      sums[item.category] = (sums[item.category] || 0) + item.price;
    });
    return sums;
  };

  const total = (items) => items.reduce((s, i) => s + i.price, 0);

  // Days since added
  const daysSince = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const monthLabel = viewMonth.replace("-", "蟷ｴ") + "譛�";
  const canGoNext = viewMonth < `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const changeMonth = (dir) => {
    const [y, m] = viewMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  if (!initialized) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.logo}>叉</span>
        <span style={styles.title}>縺九§繝ｩ繧ｯ</span>
      </div>

      <div style={styles.content}>
        {/* Tab 0: Input */}
        {tab === 0 && (
          <div style={styles.page}>
            <p style={styles.hint}>雋ｷ縺｣縺溘ｂ縺ｮ繧貞�蜉幢ｼ井ｾ�: 繝斐�繝槭Φ2.280縲∫ｱｳ3980��</p>
            <div style={styles.inputRow}>
              <textarea
                style={styles.textarea}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="繝斐�繝槭Φ2.280縲∫央荵ｳ198"
                rows={3}
              />
            </div>
            <div style={styles.buttonRow}>
              <button
                style={{ ...styles.primaryBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}
                onClick={parseInput}
                disabled={loading || !input.trim()}
              >
                {loading ? "隗｣譫蝉ｸｭ..." : "險倬鹸縺吶ｋ"}
              </button>
              <button
                style={styles.secondaryBtn}
                onClick={() => setShowFavorites(!showFavorites)}
              >
                箝� 縺頑ｰ励↓蜈･繧�
              </button>
            </div>

            {showFavorites && (
              <div style={styles.favSection}>
                <p style={styles.sectionLabel}>縺頑ｰ励↓蜈･繧奇ｼ医ち繝��縺ｧ蜈･蜉帙↓霑ｽ蜉���</p>
                {favorites.length === 0 ? (
                  <p style={styles.emptyText}>縺ｾ縺�縺頑ｰ励↓蜈･繧翫�縺ゅｊ縺ｾ縺帙ｓ縲ょｮｶ險育判髱｢縺九ｉ霑ｽ蜉�縺ｧ縺阪∪縺吶�</p>
                ) : (
                  <div style={styles.chipRow}>
                    {favorites.map((fav, i) => (
                      <button
                        key={i}
                        style={styles.chip}
                        onClick={() => useFavorite(fav)}
                      >
                        {fav.name} ﾂ･{fav.price.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent purchases */}
            {purchases.length > 0 && (
              <div style={styles.recentSection}>
                <p style={styles.sectionLabel}>譛霑代�蜈･蜉�</p>
                {[...purchases].reverse().slice(0, 8).map((p) => (
                  <div key={p.id} style={styles.recentItem}>
                    <span style={{ ...styles.catDot, background: CATEGORY_COLORS[p.category] }} />
                    <span style={styles.recentName}>{p.name}</span>
                    {p.quantity > 1 && <span style={styles.recentQty}>ﾃ養p.quantity}</span>}
                    <span style={styles.recentPrice}>ﾂ･{p.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Budget */}
        {tab === 1 && (
          <div style={styles.page}>
            <div style={styles.monthNav}>
              <button style={styles.monthBtn} onClick={() => changeMonth(-1)}>笳</button>
              <span style={styles.monthLabel}>{monthLabel}</span>
              <button
                style={{ ...styles.monthBtn, opacity: canGoNext ? 1 : 0.3 }}
                onClick={() => canGoNext && changeMonth(1)}
              >笆ｶ</button>
            </div>

            <div style={styles.totalCard}>
              <div style={styles.totalLabel}>譛医�蜷郁ｨ�</div>
              <div style={styles.totalAmount}>ﾂ･{total(getMonthPurchases()).toLocaleString()}</div>
            </div>

            <div style={styles.catRow}>
              {Object.entries(sumByCategory(getMonthPurchases())).map(([cat, sum]) => (
                <div key={cat} style={styles.catCard}>
                  <div style={{ ...styles.catIndicator, background: CATEGORY_COLORS[cat] }} />
                  <div style={styles.catName}>{cat}</div>
                  <div style={styles.catAmount}>ﾂ･{sum.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div style={styles.weekCard}>
              <div style={styles.weekLabel}>逶ｴ霑�7譌･髢�</div>
              <div style={styles.weekAmount}>ﾂ･{total(getWeekPurchases()).toLocaleString()}</div>
            </div>

            {/* Purchase history for the month */}
            <div style={styles.historySection}>
              <p style={styles.sectionLabel}>譏守ｴｰ</p>
              {getMonthPurchases().length === 0 ? (
                <p style={styles.emptyText}>縺薙�譛医�險倬鹸縺ｯ縺ゅｊ縺ｾ縺帙ｓ</p>
              ) : (
                [...getMonthPurchases()].reverse().map((p) => (
                  <div key={p.id} style={styles.historyItem}>
                    <span style={{ ...styles.catDot, background: CATEGORY_COLORS[p.category] }} />
                    <span style={styles.historyName}>{p.name}</span>
                    <span style={styles.historyPrice}>ﾂ･{p.price.toLocaleString()}</span>
                    <button
                      style={styles.favBtn}
                      onClick={() => addFavorite(p)}
                      title="縺頑ｰ励↓蜈･繧翫↓霑ｽ蜉�"
                    >
                      {favorites.find(f => f.name === p.name) ? "箝�" : "笘�"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Fridge */}
        {tab === 2 && (
          <div style={styles.page}>
            <button
              style={{ ...styles.recipeBtn, opacity: fridge.length === 0 || loadingRecipes ? 0.5 : 1 }}
              onClick={getRecipes}
              disabled={fridge.length === 0 || loadingRecipes}
            >
              {loadingRecipes ? "閠�∴荳ｭ..." : "鎖�� 莉頑律縺ｪ縺ｫ菴懊ｋ��"}
            </button>

            {recipes && (
              <div style={styles.recipeSection}>
                {recipes.map((r, i) => (
                  <div key={i} style={styles.recipeCard}>
                    <div style={styles.recipeTitle}>{r.title}</div>
                    <div style={styles.recipeTime}>竢ｱ {r.time}</div>
                    <div style={styles.recipeIngredients}>
                      {r.ingredients.join("縲�")}
                    </div>
                    <div style={styles.recipeSteps}>{r.steps}</div>
                    <button
                      style={styles.useRecipeBtn}
                      onClick={() => useRecipeIngredients(r)}
                    >
                      縺薙ｌ菴懊ｋ�磯｣滓攝繧呈ｶ郁ｲｻ��
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.fridgeHeader}>
              <p style={styles.sectionLabel}>蜀ｷ阡ｵ蠎ｫ縺ｮ荳ｭ霄ｫ��{fridge.length}蜩�ｼ�</p>
            </div>

            {fridge.length === 0 ? (
              <p style={styles.emptyText}>蜀ｷ阡ｵ蠎ｫ縺ｯ遨ｺ縺ｧ縺吶ょ�蜉帷判髱｢縺九ｉ雋ｷ縺�黄繧定ｨ倬鹸縺吶ｋ縺ｨ縲�｣溷刀縺瑚�蜍輔〒霑ｽ蜉�縺輔ｌ縺ｾ縺吶�</p>
            ) : (
              [...fridge]
                .sort((a, b) => new Date(a.addedDate) - new Date(b.addedDate))
                .map((item) => {
                  const days = daysSince(item.addedDate);
                  const isOld = days >= 5;
                  return (
                    <div key={item.id} style={styles.fridgeItem}>
                      <button
                        style={styles.checkBtn}
                        onClick={() => removeFridgeItem(item.id)}
                        title="菴ｿ縺｣縺�"
                      >
                        笘�
                      </button>
                      <span style={styles.fridgeName}>{item.name}</span>
                      {item.quantity > 1 && <span style={styles.fridgeQty}>ﾃ養item.quantity}</span>}
                      <span style={{ ...styles.fridgeDays, color: isOld ? "#E64444" : "#999" }}>
                        {days === 0 ? "莉頑律" : `${days}譌･蜑港}
                      </span>
                      <button
                        style={styles.toShopBtn}
                        onClick={() => {
                          if (!shoppingList.find(s => s.name === item.name)) {
                            setShoppingList(prev => [...prev, { name: item.name, id: Date.now().toString() }]);
                          }
                        }}
                        title="雋ｷ縺�黄繝ｪ繧ｹ繝医↓霑ｽ蜉�"
                      >
                        將
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* Tab 3: Shopping List */}
        {tab === 3 && (
          <div style={styles.page}>
            <p style={styles.sectionLabel}>雋ｷ縺�ｶｳ縺励Μ繧ｹ繝�</p>

            <div style={styles.addShopRow}>
              <input
                style={styles.shopInput}
                value={newShopItem}
                onChange={e => setNewShopItem(e.target.value)}
                placeholder="霑ｽ蜉�縺吶ｋ繧ゅ�"
                onKeyDown={e => {
                  if (e.key === "Enter" && newShopItem.trim()) {
                    setShoppingList(prev => [...prev, { name: newShopItem.trim(), id: Date.now().toString() }]);
                    setNewShopItem("");
                  }
                }}
              />
              <button
                style={styles.addShopBtn}
                onClick={() => {
                  if (newShopItem.trim()) {
                    setShoppingList(prev => [...prev, { name: newShopItem.trim(), id: Date.now().toString() }]);
                    setNewShopItem("");
                  }
                }}
              >
                霑ｽ蜉�
              </button>
            </div>

            {shoppingList.length === 0 ? (
              <p style={styles.emptyText}>雋ｷ縺�黄繝ｪ繧ｹ繝医�遨ｺ縺ｧ縺吶ょ�阡ｵ蠎ｫ逕ｻ髱｢縺ｮ將繝懊ち繝ｳ縺九√％縺薙〒逶ｴ謗･霑ｽ蜉�縺ｧ縺阪∪縺吶�</p>
            ) : (
              shoppingList.map((item) => (
                <div key={item.id} style={styles.shopItem}>
                  <button
                    style={styles.checkBtn}
                    onClick={() => setShoppingList(prev => prev.filter(s => s.id !== item.id))}
                  >
                    笘�
                  </button>
                  <span style={styles.shopName}>{item.name}</span>
                </div>
              ))
            )}

            {/* Quick add from favorites */}
            {favorites.length > 0 && (
              <div style={styles.favSection}>
                <p style={styles.sectionLabel}>縺頑ｰ励↓蜈･繧翫°繧芽ｿｽ蜉�</p>
                <div style={styles.chipRow}>
                  {favorites.map((fav, i) => (
                    <button
                      key={i}
                      style={styles.chip}
                      onClick={() => {
                        if (!shoppingList.find(s => s.name === fav.name)) {
                          setShoppingList(prev => [...prev, { name: fav.name, id: Date.now().toString() }]);
                        }
                      }}
                    >
                      + {fav.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={styles.nav}>
        {TABS.map((t, i) => (
          <button
            key={t}
            style={{
              ...styles.navBtn,
              color: tab === i ? "#3B82C4" : "#999",
              borderTop: tab === i ? "2px solid #3B82C4" : "2px solid transparent",
            }}
            onClick={() => setTab(i)}
          >
            <span style={styles.navIcon}>{TAB_ICONS[i]}</span>
            <span style={styles.navLabel}>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#FAFBFC",
    fontFamily: "'M PLUS Rounded 1c', 'Zen Maru Gothic', -apple-system, sans-serif",
    color: "#333D47",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "14px 20px",
    background: "#fff",
    borderBottom: "1px solid #EEEEF0",
  },
  logo: { fontSize: 22 },
  title: { fontSize: 18, fontWeight: 700, color: "#333D47" },
  content: {
    flex: 1,
    overflow: "auto",
    paddingBottom: 8,
  },
  page: { padding: "16px 20px" },
  loading: { padding: 40, textAlign: "center", color: "#999" },

  // Input tab
  hint: { fontSize: 13, color: "#888", marginBottom: 10 },
  inputRow: { marginBottom: 12 },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 16,
    border: "2px solid #E0E4E8",
    borderRadius: 12,
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "#fff",
  },
  buttonRow: { display: "flex", gap: 10, marginBottom: 16 },
  primaryBtn: {
    flex: 1,
    padding: "12px 0",
    background: "#3B82C4",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "12px 16px",
    background: "#F5F0E8",
    color: "#333D47",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
  },

  // Favorites
  favSection: { marginTop: 16, padding: "12px 0" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    padding: "8px 14px",
    background: "#fff",
    border: "1px solid #E0E4E8",
    borderRadius: 20,
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
    color: "#333D47",
  },

  // Recent
  recentSection: { marginTop: 20 },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 10 },
  recentItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 0",
    borderBottom: "1px solid #F0F0F2",
  },
  catDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  recentName: { flex: 1, fontSize: 14 },
  recentQty: { fontSize: 12, color: "#999" },
  recentPrice: { fontSize: 14, fontWeight: 600 },

  // Budget tab
  monthNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 16,
  },
  monthBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#3B82C4",
    padding: "4px 8px",
  },
  monthLabel: { fontSize: 16, fontWeight: 700 },
  totalCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "20px 24px",
    textAlign: "center",
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  totalLabel: { fontSize: 13, color: "#888", marginBottom: 4 },
  totalAmount: { fontSize: 32, fontWeight: 700, color: "#333D47" },
  catRow: { display: "flex", gap: 8, marginBottom: 12 },
  catCard: {
    flex: 1,
    background: "#fff",
    borderRadius: 12,
    padding: "14px 10px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  catIndicator: { width: 24, height: 4, borderRadius: 2, margin: "0 auto 8px" },
  catName: { fontSize: 11, color: "#888", marginBottom: 4 },
  catAmount: { fontSize: 16, fontWeight: 700 },
  weekCard: {
    background: "#F5F9FD",
    borderRadius: 12,
    padding: "14px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  weekLabel: { fontSize: 13, color: "#666" },
  weekAmount: { fontSize: 18, fontWeight: 700, color: "#3B82C4" },
  historySection: { marginTop: 8 },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 0",
    borderBottom: "1px solid #F0F0F2",
  },
  historyName: { flex: 1, fontSize: 14 },
  historyPrice: { fontSize: 14, fontWeight: 600 },
  favBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    padding: "2px 4px",
  },

  // Fridge tab
  fridgeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  recipeBtn: {
    width: "100%",
    padding: "14px 0",
    background: "#48B287",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    marginBottom: 8,
  },
  recipeSection: { marginBottom: 16 },
  recipeCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  recipeTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  recipeTime: { fontSize: 12, color: "#888", marginBottom: 8 },
  recipeIngredients: {
    fontSize: 13,
    color: "#48B287",
    marginBottom: 8,
    padding: "6px 10px",
    background: "#F0FAF5",
    borderRadius: 8,
  },
  recipeSteps: { fontSize: 13, color: "#555", lineHeight: 1.6, whiteSpace: "pre-line", marginBottom: 10 },
  useRecipeBtn: {
    width: "100%",
    padding: "10px 0",
    background: "#F5F0E8",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    color: "#333D47",
  },
  fridgeItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 0",
    borderBottom: "1px solid #F0F0F2",
  },
  checkBtn: {
    background: "none",
    border: "2px solid #CCC",
    borderRadius: 6,
    width: 28,
    height: 28,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#999",
  },
  fridgeName: { flex: 1, fontSize: 14 },
  fridgeQty: { fontSize: 12, color: "#999" },
  fridgeDays: { fontSize: 12, marginRight: 4 },
  toShopBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    padding: "2px 4px",
  },

  // Shopping tab
  addShopRow: { display: "flex", gap: 8, marginBottom: 16 },
  shopInput: {
    flex: 1,
    padding: "12px 14px",
    fontSize: 15,
    border: "2px solid #E0E4E8",
    borderRadius: 10,
    outline: "none",
    fontFamily: "inherit",
    background: "#fff",
  },
  addShopBtn: {
    padding: "12px 20px",
    background: "#3B82C4",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  shopItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 0",
    borderBottom: "1px solid #F0F0F2",
  },
  shopName: { flex: 1, fontSize: 15 },
  emptyText: { fontSize: 13, color: "#999", lineHeight: 1.6, marginTop: 8 },

  // Bottom nav
  nav: {
    display: "flex",
    background: "#fff",
    borderTop: "1px solid #EEEEF0",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  navBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "10px 0 8px",
    background: "none",
    border: "none",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 10, fontWeight: 600 },
};