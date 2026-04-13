import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import {
  Check, ChevronDown, ChevronUp, Circle, Globe,
  Link as LinkIcon, GripVertical, Pencil, Plus, Share2, Sparkles,
  Trash2, Users, Info, Clock3, Megaphone,
} from "lucide-react";

/* ── Unique ID ── */
let _idCounter = 0;
function uniqueId() { _idCounter += 1; return Date.now() * 1000 + _idCounter; }

/* ── Storage helpers ── */
const STORAGE_KEY = "cartly-lists";
function loadLists() {
  try {
    const result = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (result) return result;
  } catch {}
  return null;
}
function saveLists(lists) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lists)); } catch {}
}

/* ── UI Primitives ── */
function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center text-xs font-medium ${className}`}>{children}</span>;
}
function Button({ children, className = "", variant, onClick, type = "button", ...rest }) {
  const base = variant === "ghost" ? "bg-transparent hover:bg-slate-100" : variant === "outline" ? "border bg-transparent" : "";
  return <button type={type} onClick={onClick} className={`${base} ${className} inline-flex items-center justify-center`} {...rest}>{children}</button>;
}
function Card({ children, className = "" }) { return <div className={`rounded-2xl ${className}`}>{children}</div>; }
function CardContent({ children, className = "" }) { return <div className={`px-4 pb-4 ${className}`}>{children}</div>; }
function CardHeader({ children, className = "" }) { return <div className={`px-4 pt-4 ${className}`}>{children}</div>; }
function CardTitle({ children, className = "" }) { return <h3 className={className}>{children}</h3>; }
function Input({ className = "", ...props }) { return <input className={`w-full outline-none placeholder:text-slate-400 ${className}`} {...props} />; }
function Progress({ value = 0, className = "" }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ── Translations ── */
const translations = {
  ko: {
    appBadge: "Cartly MVP", appTitle: "카틀리",
    appSubtitle: "함께 담고 함께 체크하는 공유 장보기 앱",
    newListPlaceholder: "새 리스트 이름", createList: "추가하기", addItem: "품목 추가하기",
    myLists: "내 장보기 리스트", createdAt: "생성일", itemUnit: "개", items: "품목", done: "완료",
    estimatedAmount: "예상 금액", participants: "참여 인원", participantsSoon: "출시 예정",
    deleteList: "삭제", deleteListConfirmTitle: "리스트를 삭제할까요?",
    deleteListConfirmBody: "삭제하면 리스트와 품목이 모두 사라져요.", purchasedCount: "구매 완료",
    noItems: "아직 담긴 품목이 없어요.", purchaseLink: "구매 링크",
    sharedInfo: "실시간 공유 기능은 다음 업데이트에서 추가될 예정이에요.",
    total: "총액", detailItems: "상세 항목", close: "닫기", input: "입력", itemName: "품목명",
    quantity: "수량", pricePlaceholder: "예상 금액", memoPlaceholder: "구매 링크 입력",
    sharedScreenTitle: "리스트를 복사했어요!",
    sharedScreenDesc: "카카오톡, 문자, 메모 등에 바로 붙여넣기 하세요.",
    sharedFutureNotice: "실시간 공유 기능은 다음 업데이트에서 추가될 예정이에요.",
    sharedParticipantView: "복사된 내용 미리보기", sharedBadge: "복사 완료",
    share: "공유", totalSticky: "예상 총액", save: "저장", cancel: "취소",
    editingItem: "품목 수정 중", addLink: "+ 구매 링크",
    dragHint: "손잡이를 길게 눌러 순서를 바꿀 수 있어요.",
    adPlaceholder: "광고 영역",
  },
  en: {
    appBadge: "Cartly MVP", appTitle: "Cartly",
    appSubtitle: "A shared shopping list for couples, families, and roommates",
    newListPlaceholder: "New list name", createList: "Add", addItem: "Add item",
    myLists: "My shopping lists", createdAt: "Created", itemUnit: "", items: "Items", done: "Done",
    estimatedAmount: "Estimated", participants: "Members", participantsSoon: "Coming soon",
    deleteList: "Delete", deleteListConfirmTitle: "Delete this list?",
    deleteListConfirmBody: "This will remove the list and all items.", purchasedCount: "Purchased",
    noItems: "No items added yet.", purchaseLink: "Purchase link",
    sharedInfo: "Real-time sharing is coming in a future update.",
    total: "Total", detailItems: "Items", close: "Close", input: "Input", itemName: "Item name",
    quantity: "Qty", pricePlaceholder: "Amount", memoPlaceholder: "Purchase link",
    sharedScreenTitle: "List copied!",
    sharedScreenDesc: "Paste it into any messaging app, notes, or email.",
    sharedFutureNotice: "Real-time collaborative sharing is coming in a future update.",
    sharedParticipantView: "Copied content preview", sharedBadge: "Copied",
    share: "Share", totalSticky: "Estimated total", save: "Save", cancel: "Cancel",
    editingItem: "Editing item", addLink: "+ Purchase link",
    dragHint: "Long press the handle to reorder.",
    adPlaceholder: "Ad space",
  },
};

const defaultLists = [
  { id: 1, title: "우리집 장보기", createdAt: "2026-03-27", items: [
    { id: 101, name: "우유", qty: "2", price: 5400, checked: false, memo: "https://www.coupang.com" },
    { id: 102, name: "계란", qty: "1", price: 7200, checked: true, memo: "" },
    { id: 103, name: "삼겹살", qty: "2", price: 24000, checked: false, memo: "https://www.kurly.com" },
  ]},
  { id: 2, title: "주말 캠핑 장보기", createdAt: "2026-03-25", items: [
    { id: 201, name: "컵라면", qty: "6", price: 7200, checked: false, memo: "" },
    { id: 202, name: "물티슈", qty: "2", price: 4000, checked: false, memo: "https://shopping.naver.com" },
  ]},
];

/* ── Helpers ── */
function getT(l) { return translations[l] ?? translations.ko; }
function formatCurrency(v, c) {
  const n = Number(v || 0);
  return c === "USD" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : new Intl.NumberFormat("ko-KR").format(n) + "원";
}
function getCurrencySymbol(c) { return c === "USD" ? "$" : "₩"; }
function fmtNum(v) { const n = String(v || "").replace(/[^0-9]/g, ""); return n ? new Intl.NumberFormat("en-US").format(Number(n)) : ""; }
function calcSummary(items) {
  const total = items.reduce((s, i) => s + (i.price || 0), 0), done = items.filter(i => i.checked).length;
  return { total, done, progress: items.length ? Math.round((done / items.length) * 100) : 0, totalCount: items.length };
}
function fmtDate(d, l) { return d ? new Intl.DateTimeFormat(l === "en" ? "en-US" : "ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(d)) : ""; }
function normalizeLink(u) { if (!u) return ""; const t = u.trim(); return !t ? "" : /^https?:\/\//i.test(t) ? t : `https://${t}`; }
function displayQty(r, l) { const n = String(r || "").replace(/[^0-9]/g, "") || "1"; return l === "en" ? n : `${n}개`; }
function parseQty(v) { const q = String(v || "").replace(/[^0-9]/g, ""); return q ? Number(q) : 1; }
function buildShareText(list, c, l) {
  const t = getT(l), s = calcSummary(list?.items || []);
  const h = l === "en" ? `[Cartly]\n${list.title}` : `[카틀리]\n${list.title}`;
  const lines = (list?.items || []).map(i => `- ${i.name} ${displayQty(i.qty, l)} / ${formatCurrency(i.price, c)}`);
  return [h, ...lines, `\n${t.total}: ${formatCurrency(s.total, c)}`].join("\n");
}

/* ── Ad Banner Placeholder ── */
function AdBanner({ language }) {
  const t = getT(language);
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center">
      <div className="flex items-center justify-center gap-2 text-[13px] text-slate-400">
        <Megaphone className="h-4 w-4" />
        <span>{t.adPlaceholder}</span>
      </div>
    </div>
  );
}

/* ── Interstitial Ad Placeholder ── */
function InterstitialAd({ isOpen, onClose, language }) {
  const t = getT(language);
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/60 p-6" style={{ backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-[320px] rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}>
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{t.adPlaceholder}</span>
          <button type="button" onClick={onClose} className="text-[12px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100">{t.close} ✕</button>
        </div>
        <div className="p-8 flex flex-col items-center justify-center gap-3">
          <Megaphone className="h-10 w-10 text-slate-300" />
          <div className="text-[14px] font-semibold text-slate-400">{language === "en" ? "Interstitial Ad" : "전면 광고 영역"}</div>
          <div className="text-[12px] text-slate-400 text-center leading-5">{language === "en" ? "Google AdMob interstitial ad will appear here after app build." : "앱 빌드 후 Google AdMob 전면 광고가 여기에 표시됩니다."}</div>
        </div>
      </div>
    </div>
  );
}
function LanguageMenu({ language, setLanguage }) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <button type="button" onClick={() => setLanguage("ko")} className={`flex items-center gap-1 px-3.5 py-2.5 text-[13px] font-semibold ${language === "ko" ? "bg-slate-900 text-white" : "text-slate-500"}`}><Globe className="h-3.5 w-3.5" /> KR</button>
      <button type="button" onClick={() => setLanguage("en")} className={`px-3.5 py-2.5 text-[13px] font-semibold ${language === "en" ? "bg-slate-900 text-white" : "text-slate-500"}`}>EN</button>
    </div>
  );
}

function ParticipantComingSoon({ language }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-600">
      <Clock3 className="h-3 w-3" /> {getT(language).participantsSoon}
    </span>
  );
}

/* ── Draggable Item Card ── */
function DraggableItemCard({ item, currency, language, toggleItem, deleteItem, onEditItem }) {
  const t = getT(language);
  const link = normalizeLink(item.memo);
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} id={String(item.id)} dragListener={false} dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px rgba(15,23,42,0.12)" }}
      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition ${item.checked ? "border-slate-100 bg-slate-50/90 opacity-80" : "border-slate-100 bg-white"}`}
      style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
      <button onClick={() => toggleItem(item.id)} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.checked ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
        {item.checked ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-[15px] font-semibold tracking-tight text-slate-900 ${item.checked ? "line-through" : ""}`}>{item.name}</div>
        <div className="mt-0.5 text-[13px] text-slate-500">{displayQty(item.qty, language)} · {formatCurrency(item.price, currency)}</div>
        {link ? <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-[12px] font-medium text-amber-700 underline underline-offset-2"><LinkIcon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{t.purchaseLink}</span></a> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" className="h-9 w-9 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-700" onClick={() => onEditItem?.(item.id)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" className="h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500" onClick={() => deleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
        <button type="button" onPointerDown={(e) => controls.start(e)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 touch-none" aria-label="Drag to reorder">
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

function ItemCards({ items, currency, toggleItem, deleteItem, language, isSharedView = false, onEditItem, onReorderItems }) {
  const t = getT(language);
  return (
    <div className="space-y-2.5">
      {items.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-[14px] text-slate-500">{t.noItems}</div>}
      {items.length > 1 && !isSharedView && <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-[13px] leading-5 text-amber-700">{t.dragHint}</div>}
      {isSharedView ? (
        <div className="space-y-2.5">{items.map(item => (
          <div key={item.id} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${item.checked ? "border-slate-100 bg-slate-50/90 opacity-80" : "border-slate-100 bg-white"}`} style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.checked ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
              {item.checked ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-[15px] font-semibold tracking-tight text-slate-900 ${item.checked ? "line-through" : ""}`}>{item.name}</div>
              <div className="mt-0.5 text-[13px] text-slate-500">{displayQty(item.qty, language)} · {formatCurrency(item.price, currency)}</div>
            </div>
          </div>
        ))}</div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={onReorderItems} className="space-y-2.5">
          {items.map(item => <DraggableItemCard key={item.id} item={item} currency={currency} language={language} toggleItem={toggleItem} deleteItem={deleteItem} onEditItem={onEditItem} />)}
        </Reorder.Group>
      )}
      {isSharedView && <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-[13px] leading-5 text-emerald-700">{t.sharedInfo}</div>}
    </div>
  );
}

/* ── List Screen ── */
function ListScreen({ lists, newListTitle, setNewListTitle, handleCreateList, openListDetail, requestDeleteList, currency, language, setLanguage }) {
  const t = getT(language);
  return (
    <>
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 px-1.5 pt-1.5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/90 px-3 py-1.5 text-[12px] font-semibold tracking-wide text-amber-700" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}><Sparkles className="h-3.5 w-3.5" />{t.appBadge}</div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.appTitle}</h1>
            <p className="mt-1 max-w-[260px] text-[13px] leading-5 text-slate-500">{t.appSubtitle}</p>
          </div>
          <LanguageMenu language={language} setLanguage={setLanguage} />
        </div>

        {/* 광고 배너 영역 */}
        <AdBanner language={language} />

        <Card className="w-full border border-amber-100/80 bg-white/95" style={{ boxShadow: "0 12px 30px rgba(251,146,60,0.08)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 rounded-xl border border-amber-50 bg-gradient-to-r from-amber-50 via-orange-50 to-white p-2">
              <Input value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} placeholder={t.newListPlaceholder} onKeyDown={(e) => e.key === "Enter" && handleCreateList()} className="h-11 rounded-lg border-0 bg-white text-[14px] px-3" />
              <Button onClick={handleCreateList} className="h-11 shrink-0 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white hover:bg-slate-800"><Plus className="mr-1 h-4 w-4" />{t.createList}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border border-amber-100/80 bg-white/95" style={{ boxShadow: "0 14px 36px rgba(15,23,42,0.06)" }}>
        <CardHeader className="pb-3"><CardTitle className="text-[16px] font-semibold tracking-tight text-slate-900">{t.myLists}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lists.map(list => {
            const s = calcSummary(list.items);
            return (
              <motion.div key={list.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.995 }} onClick={() => openListDetail(list.id)} className="group w-full cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-amber-200" style={{ boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold tracking-tight text-slate-900">{list.title}</div>
                    <div className="mt-1 text-[13px] text-slate-500">{t.createdAt} {fmtDate(list.createdAt, language)}</div>
                    <div className="mt-0.5 text-[13px] text-slate-400">{t.items} {list.items.length}{t.itemUnit} · {t.done} {s.done}{t.itemUnit}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge className="rounded-full bg-amber-50 px-2.5 py-1 text-[13px] font-semibold text-amber-700">{s.done}/{s.totalCount}</Badge>
                    <Button variant="ghost" className="h-11 w-11 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); requestDeleteList(list.id); }}><Trash2 className="h-5 w-5" /></Button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-3">
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-amber-500">{getCurrencySymbol(currency)} {t.estimatedAmount}</div>
                    <div className="truncate text-[15px] font-semibold text-slate-900">{formatCurrency(s.total, currency)}</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-slate-400"><Users className="h-3.5 w-3.5" /> {t.participants}</div>
                    <ParticipantComingSoon language={language} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

/* ── Detail Screen ── */
function DetailScreen({ selectedList, selectedSummary, setCurrentScreen, itemName, setItemName, itemQty, setItemQty, itemPrice, setItemPrice, itemMemo, setItemMemo, currency, setCurrency, handleSubmitItem, toggleItem, deleteItem, openSharedPreview, isEditing, setIsEditing, language, editingItemId, startEditItem, cancelEditingItem, reorderSelectedListItems }) {
  const t = getT(language);
  const [showLinkField, setShowLinkField] = useState(false);
  const handleOpenEdit = () => { setShowLinkField(false); setIsEditing(true); };
  const handleCloseEdit = () => { setShowLinkField(false); cancelEditingItem(); };
  const handleStartEditItem = (itemId) => {
    startEditItem(itemId);
    const item = selectedList.items.find(e => e.id === itemId);
    setShowLinkField(item?.memo ? true : false);
  };
  return (
    <div className="flex min-h-full flex-col gap-3 pb-24">
      <Card className="border border-amber-100/80 bg-white/95" style={{ boxShadow: "0 14px 36px rgba(15,23,42,0.06)" }}>
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-start gap-3 px-1.5 pt-1.5">
            <button type="button" onClick={() => setCurrentScreen("list")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-semibold text-slate-700">←</button>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-[18px] font-semibold tracking-tight text-slate-900">{selectedList.title}</CardTitle>
              <p className="mt-1 text-[13px] text-slate-500">{t.createdAt} {fmtDate(selectedList.createdAt, language)} · {t.items} {selectedList.items.length}{t.itemUnit}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 text-center"><div className="text-[11px] font-medium uppercase tracking-widest text-amber-500">{t.total}</div><div className="mt-1 truncate text-[14px] font-semibold text-slate-900">{formatCurrency(selectedSummary.total, currency)}</div></div>
            <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-2.5 text-center"><div className="text-[11px] font-medium uppercase tracking-widest text-emerald-500">{t.purchasedCount}</div><div className="mt-1 text-[14px] font-semibold text-slate-900">{selectedSummary.done}/{selectedSummary.totalCount}</div></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center"><div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">{t.participants}</div><div className="mt-1 flex justify-center"><ParticipantComingSoon language={language} /></div></div>
          </div>
          <Progress value={selectedSummary.progress} className="h-2 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="text-[14px] font-semibold tracking-tight text-slate-700">{t.detailItems}</div>
              <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button type="button" onClick={() => setCurrency("KRW")} className={`px-2.5 py-1 text-[11px] font-semibold ${currency === "KRW" ? "bg-slate-900 text-white" : "text-slate-400"}`}>원</button>
                <button type="button" onClick={() => setCurrency("USD")} className={`px-2.5 py-1 text-[11px] font-semibold ${currency === "USD" ? "bg-slate-900 text-white" : "text-slate-400"}`}>$</button>
              </div>
            </div>
            <Button variant={isEditing ? "secondary" : "outline"} onClick={() => { if (isEditing) handleCloseEdit(); else handleOpenEdit(); }} className={`h-11 rounded-xl px-5 text-[13px] font-semibold ${isEditing ? "bg-amber-100 text-amber-800" : "border-amber-200 text-amber-700 hover:bg-amber-50"}`}>{isEditing ? t.close : t.addItem}</Button>
          </div>
          {isEditing && (
            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-3" style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)" }}>
              <div className="grid grid-cols-[1fr_100px] gap-2">
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder={t.itemName} onKeyDown={(e) => e.key === "Enter" && handleSubmitItem()} className="h-11 rounded-lg border border-white bg-white text-[14px] px-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} />
                <div className="flex items-center rounded-lg border border-white bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <button type="button" onClick={() => setItemQty(p => Math.max(1, (Number(p) || 1) - 1))} className="flex h-11 w-8 items-center justify-center text-amber-600"><ChevronDown className="h-4 w-4" /></button>
                  <Input value={itemQty} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setItemQty(v === "" ? "" : Math.max(1, Number(v))); }} placeholder={t.quantity} inputMode="numeric" className="h-11 border-0 bg-transparent px-0 text-center text-[14px] font-medium" />
                  <button type="button" onClick={() => setItemQty(p => (Number(p) || 0) + 1)} className="flex h-11 w-8 items-center justify-center text-amber-600"><ChevronUp className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-white bg-white px-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <span className="text-[14px] font-medium text-amber-500">{getCurrencySymbol(currency)}</span>
                  <Input value={fmtNum(itemPrice)} onChange={(e) => setItemPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder={t.pricePlaceholder} inputMode="numeric" className="h-11 border-0 bg-transparent px-0 text-[14px]" onKeyDown={(e) => e.key === "Enter" && handleSubmitItem()} />
                </div>
                <Button onClick={handleSubmitItem} className="h-11 rounded-xl bg-slate-900 px-5 text-[13px] font-semibold text-white hover:bg-slate-800"><Plus className="mr-1 h-4 w-4" />{t.save}</Button>
              </div>
              {!showLinkField ? (
                <button type="button" onClick={() => setShowLinkField(true)} className="mt-2 text-[13px] font-medium text-amber-600 hover:text-amber-700">{t.addLink}</button>
              ) : (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-white bg-white px-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <LinkIcon className="h-4 w-4 shrink-0 text-amber-500" />
                  <Input value={itemMemo} onChange={(e) => setItemMemo(e.target.value)} placeholder={t.memoPlaceholder} className="h-11 border-0 bg-transparent px-0 text-[14px]" onKeyDown={(e) => e.key === "Enter" && handleSubmitItem()} />
                </div>
              )}
            </div>
          )}
          <ItemCards items={selectedList.items} currency={currency} toggleItem={toggleItem} deleteItem={deleteItem} language={language} onEditItem={handleStartEditItem} onReorderItems={reorderSelectedListItems} />
        </CardContent>
      </Card>
      <div className="sticky bottom-0 z-20 mt-auto rounded-t-2xl border border-amber-100 bg-white/95" style={{ boxShadow: "0 -4px 28px rgba(251,146,60,0.10)" }}>
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0"><div className="text-[12px] font-medium text-amber-500">{t.totalSticky}</div><div className="truncate text-xl font-bold tracking-tight text-slate-900">{formatCurrency(selectedSummary.total, currency)}</div></div>
          <Button onClick={openSharedPreview} className="h-12 rounded-xl bg-amber-500 px-6 text-[14px] font-semibold text-white hover:bg-amber-600"><Share2 className="mr-2 h-4 w-4" /> {t.share}</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Share Slide-up Panel ── */
function ShareSlideUpPanel({ isOpen, onClose, selectedList, selectedSummary, currency, language }) {
  const t = getT(language);
  const copiedText = buildShareText(selectedList, currency, language);
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40" style={{ backdropFilter: "blur(3px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="relative z-10 max-h-[85%] overflow-y-auto rounded-t-[24px] bg-white" style={{ boxShadow: "0 -20px 60px rgba(15,23,42,0.18)" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex justify-center bg-white pb-2 pt-3 rounded-t-[24px]"><div className="h-1 w-10 rounded-full bg-slate-300" /></div>
        <div className="px-4 pb-6 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><Check className="h-5 w-5 text-emerald-600" /><span className="text-[15px] font-semibold text-emerald-700">{t.sharedScreenTitle}</span></div>
                <div className="mt-1.5 text-[13px] leading-5 text-emerald-800">{t.sharedScreenDesc}</div>
              </div>
              <Badge className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[12px] font-semibold text-white">{t.sharedBadge}</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-slate-400">{t.sharedParticipantView}</div>
            <pre className="whitespace-pre-wrap text-[13px] leading-5 text-slate-700" style={{ fontFamily: "inherit" }}>{copiedText}</pre>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 text-center"><div className="text-[11px] font-medium uppercase tracking-widest text-amber-500">{t.total}</div><div className="mt-1 truncate text-[13px] font-semibold text-slate-900">{formatCurrency(selectedSummary.total, currency)}</div></div>
            <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-2.5 text-center"><div className="text-[11px] font-medium uppercase tracking-widest text-emerald-500">{t.purchasedCount}</div><div className="mt-1 text-[13px] font-semibold text-slate-900">{selectedSummary.done}/{selectedSummary.totalCount}</div></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center"><div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">{t.participants}</div><div className="mt-1 flex justify-center"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"><Clock3 className="h-3 w-3" /> {t.participantsSoon}</span></div></div>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-[13px] leading-5 text-amber-700">{t.sharedFutureNotice}</div>
          <Button onClick={onClose} className="h-12 w-full rounded-xl bg-slate-900 text-[14px] font-semibold text-white hover:bg-slate-800">{t.close}</Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main App ── */
export default function ShoppingCartMVP() {
  const [lists, setLists] = useState(defaultLists);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedListId, setSelectedListId] = useState(defaultLists[0].id);
  const [newListTitle, setNewListTitle] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState("");
  const [itemMemo, setItemMemo] = useState("");
  const [currentScreen, setCurrentScreen] = useState("list");
  const [currency, setCurrency] = useState("KRW");
  const [language, setLanguage] = useState("ko");
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [pendingDeleteListId, setPendingDeleteListId] = useState(null);
  const [showCreateListAlert, setShowCreateListAlert] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const saved = loadLists();
    if (saved && saved.length > 0) {
      setLists(saved);
      setSelectedListId(saved[0].id);
    }
    setIsLoaded(true);
  }, []);

  // Auto-save whenever lists change (after initial load)
  useEffect(() => {
    if (isLoaded) saveLists(lists);
  }, [lists, isLoaded]);

  const selectedList = useMemo(() => lists.find(l => l.id === selectedListId) || lists[0], [lists, selectedListId]);
  const selectedSummary = calcSummary(selectedList?.items || []);
  const t = getT(language);

  const resetForm = () => { setItemName(""); setItemQty(1); setItemPrice(""); setItemMemo(""); setEditingItemId(null); };

  const handleCreateList = () => {
    if (!newListTitle.trim()) { setShowCreateListAlert(true); return; }
    const nl = { id: uniqueId(), title: newListTitle.trim(), createdAt: new Date().toISOString().slice(0, 10), items: [] };
    setLists(p => [nl, ...p]); setSelectedListId(nl.id); setCurrentScreen("detail"); setIsEditing(true); setNewListTitle(""); resetForm();
  };

  const handleSubmitItem = () => {
    if (!itemName.trim()) return;
    if (editingItemId) {
      setLists(p => p.map(l => l.id === selectedListId ? { ...l, items: l.items.map(i => i.id === editingItemId ? { ...i, name: itemName.trim(), qty: `${itemQty || 1}`, price: Number(itemPrice) || 0, memo: itemMemo.trim() } : i) } : l));
    } else {
      const ni = { id: uniqueId(), name: itemName.trim(), qty: `${itemQty || 1}`, price: Number(itemPrice) || 0, checked: false, memo: itemMemo.trim() };
      setLists(p => p.map(l => l.id === selectedListId ? { ...l, items: [ni, ...l.items] } : l));
    }
    resetForm(); setIsEditing(false);
  };

  const confirmDeleteList = () => {
    const id = pendingDeleteListId; if (!id) return;
    const filtered = lists.filter(l => l.id !== id);
    if (!filtered.length) {
      const fb = { id: uniqueId(), title: language === "en" ? "My shopping list" : "새 장보기 리스트", createdAt: new Date().toISOString().slice(0, 10), items: [] };
      setLists([fb]); setSelectedListId(fb.id); setCurrentScreen("list");
    } else {
      setLists(filtered);
      if (selectedListId === id) { setSelectedListId(filtered[0].id); setCurrentScreen("list"); setIsEditing(false); resetForm(); }
    }
    setPendingDeleteListId(null);
  };

  const startEditItem = (itemId) => {
    const item = selectedList.items.find(e => e.id === itemId); if (!item) return;
    setItemName(item.name); setItemQty(parseQty(item.qty)); setItemPrice(String(item.price || "")); setItemMemo(item.memo || ""); setEditingItemId(itemId); setIsEditing(true);
  };
  const cancelEditingItem = () => { resetForm(); setIsEditing(false); };
  const reorderItems = useCallback((o) => { setLists(p => p.map(l => l.id === selectedListId ? { ...l, items: o } : l)); }, [selectedListId]);
  const toggleItem = (id) => { setLists(p => p.map(l => l.id !== selectedListId ? l : { ...l, items: l.items.map(i => i.id === id ? { ...i, checked: !i.checked } : i) })); };
  const deleteItem = (id) => { setLists(p => p.map(l => l.id === selectedListId ? { ...l, items: l.items.filter(i => i.id !== id) } : l)); if (editingItemId === id) cancelEditingItem(); };

  const openSharedPreview = async () => {
    const text = buildShareText(selectedList, currency, language);
    try { if (navigator?.share) { await navigator.share({ title: selectedList.title, text }); return; } } catch {}
    try { if (navigator?.clipboard?.writeText) { await navigator.clipboard.writeText(text); } } catch {}
    setShowSharePanel(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-orange-50/40 to-slate-100 flex items-center justify-center">
        <div className="text-[15px] text-slate-400 animate-pulse">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-orange-50/40 to-slate-100">
      <div className="relative overflow-y-auto bg-gradient-to-b from-[#fffdf9] via-[#f8fafc] to-[#f8fafc] p-3.5 min-h-screen">
        {currentScreen === "list" ? (
          <ListScreen lists={lists} newListTitle={newListTitle} setNewListTitle={setNewListTitle} handleCreateList={handleCreateList} openListDetail={(id) => { setSelectedListId(id); setCurrentScreen("detail"); setIsEditing(false); resetForm(); }} requestDeleteList={(id) => setPendingDeleteListId(id)} currency={currency} language={language} setLanguage={setLanguage} />
        ) : (
          <DetailScreen selectedList={selectedList} selectedSummary={selectedSummary} setCurrentScreen={setCurrentScreen} itemName={itemName} setItemName={setItemName} itemQty={itemQty} setItemQty={setItemQty} itemPrice={itemPrice} setItemPrice={setItemPrice} itemMemo={itemMemo} setItemMemo={setItemMemo} currency={currency} setCurrency={setCurrency} handleSubmitItem={handleSubmitItem} toggleItem={toggleItem} deleteItem={deleteItem} openSharedPreview={openSharedPreview} isEditing={isEditing} setIsEditing={setIsEditing} language={language} editingItemId={editingItemId} startEditItem={startEditItem} cancelEditingItem={cancelEditingItem} reorderSelectedListItems={reorderItems} />
        )}
        <ShareSlideUpPanel isOpen={showSharePanel} onClose={() => setShowSharePanel(false)} selectedList={selectedList} selectedSummary={selectedSummary} currency={currency} language={language} />
        {pendingDeleteListId && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" style={{ backdropFilter: "blur(2px)" }}>
            <div className="w-full max-w-[320px] rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>
              <div className="text-[16px] font-semibold tracking-tight text-slate-900">{t.deleteListConfirmTitle}</div>
              <p className="mt-2 text-[13px] leading-5 text-slate-500">{t.deleteListConfirmBody}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setPendingDeleteListId(null)} className="h-11 rounded-xl border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">{t.cancel}</Button>
                <Button onClick={confirmDeleteList} className="h-11 rounded-xl bg-rose-500 text-[13px] font-semibold text-white hover:bg-rose-600">{t.deleteList}</Button>
              </div>
            </div>
          </div>
        )}
        {showCreateListAlert && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" style={{ backdropFilter: "blur(2px)" }}>
            <div className="w-full max-w-[320px] rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>
              <div className="text-[16px] font-semibold tracking-tight text-slate-900">{language === "en" ? "Please enter a list name" : "새 리스트 이름을 입력해주세요"}</div>
              <p className="mt-2 text-[13px] leading-5 text-slate-500">{language === "en" ? "Add a name first, then tap Add again." : "리스트 이름을 입력한 뒤 다시 추가하기를 눌러주세요."}</p>
              <div className="mt-5"><Button onClick={() => setShowCreateListAlert(false)} className="h-11 w-full rounded-xl bg-slate-900 text-[13px] font-semibold text-white hover:bg-slate-800">{t.close}</Button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
