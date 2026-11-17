"use client";

import { useState } from "react";
import MarketStreet, { SHOPS, type ShopDef } from "./MarketStreet";
import { ITEM_MAP, type ItemDef, type ItemId, type InventoryState, type InventoryApi } from "../world/inventory";
import { useT } from "../i18n/lang";

type Props = {
  inv: InventoryState;
  invApi: InventoryApi;
  onClose: () => void;
};

/** 市井浮层：3D 街市 + 货架式选购侧栏。铜钱/持有由 page 持有之 useInventory 注入。 */
export default function MarketView({ inv, invApi, onClose }: Props) {
  const t = useT();
  const [activeShop, setActiveShop] = useState<string | null>(null);
  /** 铜钱动效：购货时铜钱数闪红、并飘「−N 文」上浮 */
  const [coinFx, setCoinFx] = useState<{ n: number; key: number } | null>(null);
  const shop: ShopDef | undefined = SHOPS.find((s) => s.id === activeShop);

  return (
    <div className="market-overlay" role="dialog" aria-label={t("市井街市")}>
      <header className="market-head">
        <div className="market-title">
          <i className="market-glyph">市</i>
          <div>
            <h2>{t("市井街市")}</h2>
            <small>{t("棚肆幌子相招 · 点幌子或铺面选购")}</small>
          </div>
        </div>
        <div className="market-coins" title={t("铜钱")}>
          <i>◎</i>
          <b key={coinFx ? coinFx.key : 0} className={coinFx ? "coin-num flash" : "coin-num"}>{inv.coins}</b>
          <small>{t("文")}</small>
          {coinFx && (
            <span key={coinFx.key} className="coin-fx" onAnimationEnd={() => setCoinFx(null)}>
              {t("−{n} 文", { n: coinFx.n })}
            </span>
          )}
        </div>
        <button className="market-close" onClick={onClose} aria-label={t("离开市井")}>{t("离开 ×")}</button>
      </header>

      <div className="market-layout">
        <section className="market-scene" aria-label={t("街市全景")}>
          <MarketStreet activeShop={activeShop} onPickShop={setActiveShop} />
        </section>

        <aside className="market-shop-panel" aria-label={t("店铺货品")}>
          {!shop ? (
            <div className="shop-empty">
              <i>🪧</i>
              <p>{t("点街面任一幌子或铺面")}</p>
              <small>{t("杂货铺·酒楼·茶肆·肉铺·鱼摊·书坊")}</small>
            </div>
          ) : (
            <ShopPanel
              shop={shop}
              inv={inv}
              invApi={invApi}
              onBought={(def) => setCoinFx((c) => ({ n: def.price, key: (c?.key ?? 0) + 1 }))}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

/** 店铺货架面板：木墙为底，货品分列摆上木搁板，点货即购；购成有飘字、罐弹、钱响反馈。 */
function ShopPanel({
  shop,
  inv,
  invApi,
  onBought,
}: {
  shop: ShopDef;
  inv: InventoryState;
  invApi: InventoryApi;
  onBought: (def: ItemDef) => void;
}) {
  const t = useT();
  const rows: ItemId[][] = [];
  for (let i = 0; i < shop.items.length; i += 2) rows.push(shop.items.slice(i, i + 2));
  /** 飘字「购得 X」 */
  const [toast, setToast] = useState<{ glyph: string; name: string; key: number } | null>(null);
  /** 所购那罐轻弹 */
  const [bounce, setBounce] = useState<{ id: ItemId; key: number } | null>(null);

  function buy(def: ItemDef) {
    if (!invApi.buy(def)) return;
    setToast((t) => ({ glyph: def.glyph, name: def.name, key: (t?.key ?? 0) + 1 }));
    setBounce((b) => ({ id: def.id, key: (b?.key ?? 0) + 1 }));
    onBought(def);
  }

  return (
    <div className="shop-open">
      <div className="shop-head">
        <i className="shop-glyph" style={{ background: shop.facade }}>{shop.glyph}</i>
        <div>
          <h3>{t(shop.name)}</h3>
          <small>{t("{n} 样货品", { n: shop.items.length })}</small>
        </div>
      </div>
      <div className="shop-shelves">
        {rows.map((row, ri) => (
          <div className="shelf" key={ri}>
            <div className="shelf-goods">
              {row.map((id) => {
                const def: ItemDef = ITEM_MAP[id];
                const owned = inv.items[id] ?? 0;
                const afford = inv.coins >= def.price;
                const bought = bounce?.id === id;
                return (
                  <button
                    key={id}
                    className={`shelf-good ${afford ? "buy-on" : "buy-off"} ${bought ? "bought" : ""}`}
                    disabled={!afford}
                    onClick={() => buy(def)}
                    title={t(def.desc)}
                    aria-label={t("{name} {price}文", { name: t(def.name), price: def.price })}
                  >
                    <span className="good-tag"><i>◎</i>{def.price}</span>
                    <span
                      key={bought ? bounce!.key : "j"}
                      className="good-jar"
                      onAnimationEnd={() => { if (bounce?.id === id) setBounce(null); }}
                    >{def.glyph}</span>
                    <span className="good-name">{t(def.name)}</span>
                    <span className={`good-owned ${afford ? "" : "no"}`}>
                      {afford ? t("持 {n}", { n: owned }) : t("铜钱不足")}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="shelf-board" />
          </div>
        ))}
        <p className="shop-footnote">{t("点货品即购")}</p>
        {toast && (
          <span key={toast.key} className="buy-toast" onAnimationEnd={() => setToast(null)}>
            <i>{toast.glyph}</i> {t("购得")} <b>{t(toast.name)}</b>
          </span>
        )}
      </div>
    </div>
  );
}
