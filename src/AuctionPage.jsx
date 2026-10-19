import { Fragment, useCallback, useEffect, useState } from 'react';
import { ChevronRight, Heart, MapPin, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import auction from './data/auction.json';
import Nav from './components/Nav.jsx';
import Countdown from './components/Countdown.jsx';
import SortHeader from './components/SortHeader.jsx';
import AssetDialog from './components/AssetDialog.jsx';
import InsightSummary from './components/InsightSummary.jsx';
import { Chips, ScorePill } from './components/InsightBits.jsx';
import { STATUS, TYPE_GROUP_ORDER, minimumBid, specSummary, statusKey, statusOf, typeGroup } from './lib/asset.js';
import { formatDigits, formatVnd } from './lib/format.js';
import { inPriceRange, sortRows, useSort } from './lib/sort.js';
import { loadFollowed, saveFollowed } from './lib/follow.js';
import { buildInsights } from './lib/insights.js';
import { modelOf } from './lib/models.js';

const STATUS_RANK = { binh_thuong: 0, hu_hong: 1, linh_kien: 2, chua_ro: 3 };
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

// The data is static, so the suggestion analysis is computed once.
const INSIGHTS = buildInsights(auction.assets, { modelOf, capturedAt: auction.captured_at });
const ASSET_BY_ID = new Map(auction.assets.map(a => [a.id, a]));
const CATEGORY_INDEX = Object.fromEntries(TYPE_GROUP_ORDER.map((c, i) => [c, i]));

// Suggestions list: grouped by category; inside each, by the chosen column or else by suggestion rank.
function suggestionOrder(rows, sort) {
  const base = sort.column
    ? sortRows(rows, sort.column, sort.direction, sortValue)
    : [...rows].sort((a, b) => INSIGHTS.byId.get(a.id).rank - INSIGHTS.byId.get(b.id).rank);
  return base.sort((a, b) => CATEGORY_INDEX[typeGroup(a.asset_type)] - CATEGORY_INDEX[typeGroup(b.asset_type)]);
}

function sortValue(asset, column) {
  switch (column) {
    case 'loai':
      return asset.asset_type || '';
    case 'sku':
      return asset.sku;
    case 'office':
      return asset.office || '';
    case 'name':
      return asset.name;
    case 'tinh_trang':
      return STATUS_RANK[statusKey(asset)] ?? 9;
    case 'khoi_diem':
      return asset.starting_price ?? 0;
    case 'hien_tai':
      return asset.current_price;
    case 'bids':
      return asset.bid_count;
    case 'diem':
      return INSIGHTS.byId.get(asset.id).score;
    default:
      return 0;
  }
}

// The original closes the session via a server event at the deadline; this copy closes it on a timer.
function useAuctionEnded() {
  const deadlineMs = new Date(auction.deadline).getTime();
  const [ended, setEnded] = useState(() => auction.status !== 'active' || Date.now() >= deadlineMs);
  useEffect(() => {
    if (ended) return;
    let id;
    const schedule = () => {
      const left = deadlineMs - Date.now();
      if (left <= 0) {
        setEnded(true);
        toast.info('Phiên đấu giá đã kết thúc');
        return;
      }
      id = setTimeout(schedule, Math.min(left, MAX_TIMEOUT_MS));
    };
    schedule();
    return () => clearTimeout(id);
  }, [ended, deadlineMs]);
  return ended;
}

export default function AuctionPage() {
  const assets = auction.assets;
  const ended = useAuctionEnded();
  const sort = useSort();

  const [openId, setOpenId] = useState(null);
  const [bidInputs, setBidInputs] = useState({});
  const [search, setSearch] = useState('');
  const [interest, setInterest] = useState('all');
  const [office, setOffice] = useState('all');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [priceFocused, setPriceFocused] = useState(false);
  const [followed, setFollowed] = useState(loadFollowed);
  const [suggest, setSuggest] = useState(false);

  function toggleFollow(id) {
    setFollowed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFollowed(next);
      return next;
    });
  }

  function placeBid(asset) {
    const amount = parseInt(bidInputs[asset.id] || String(minimumBid(asset)), 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Giá phải lớn hơn 0');
      return;
    }
    if (asset.bid_count > 0 && amount < minimumBid(asset)) {
      toast.error(`Giá tối thiểu: ${formatVnd(minimumBid(asset))}`);
      return;
    }
    toast.info('Đây là bản sao chỉ để xem, không đặt giá được', {
      description: 'Muốn đặt giá, hãy vào bid.saigontechnology.vn',
    });
  }

  const typeCounts = assets.reduce((acc, a) => {
    const g = typeGroup(a.asset_type);
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const typeOptions = TYPE_GROUP_ORDER.filter(g => (typeCounts[g] || 0) > 0).map(g => [g, typeCounts[g]]);
  const offices = Array.from(new Set(assets.map(a => a.office).filter(Boolean))).sort();
  const statusCounts = assets.reduce((acc, a) => {
    const k = statusKey(a);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.sku.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.office || '').toLowerCase().includes(q) ||
      Object.values(a.spec || {}).some(v => String(v).toLowerCase().includes(q));
    const matchesInterest =
      interest === 'all' ||
      (interest === 'has_bids' && a.bid_count > 0) ||
      (interest === 'no_bids' && a.bid_count === 0) ||
      (interest === 'theo_doi' && followed.has(a.id));
    return (
      matchesSearch &&
      matchesInterest &&
      (office === 'all' || (a.office || '') === office) &&
      (status === 'all' || statusKey(a) === status) &&
      (type === 'all' || typeGroup(a.asset_type) === type) &&
      inPriceRange(a.current_price, priceFrom, priceTo) &&
      (!suggest || INSIGHTS.byId.get(a.id).eligible)
    );
  });
  const rows = suggest ? suggestionOrder(filtered, sort) : sortRows(filtered, sort.column, sort.direction, sortValue);
  const showCategoryHeads = suggest && type === 'all';
  const shownPerCategory = rows.reduce((acc, a) => {
    const c = typeGroup(a.asset_type);
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const isCategoryStart = (i, a) =>
    showCategoryHeads && (i === 0 || typeGroup(rows[i - 1].asset_type) !== typeGroup(a.asset_type));

  const hasFilter =
    suggest ||
    search !== '' ||
    type !== 'all' ||
    office !== 'all' ||
    status !== 'all' ||
    interest !== 'all' ||
    priceFrom !== '' ||
    priceTo !== '';
  function clearFilters() {
    setSuggest(false);
    setSearch('');
    setType('all');
    setOffice('all');
    setStatus('all');
    setInterest('all');
    setPriceFrom('');
    setPriceTo('');
  }
  const priceRangeInvalid = !priceFocused && priceFrom !== '' && priceTo !== '' && Number(priceFrom) > Number(priceTo);

  const openAsset = assets.find(a => a.id === openId) || null;
  const closeDialog = useCallback(() => setOpenId(null), []);

  return (
    <div className="min-h-screen bg-canvas">
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-t-primary">{auction.name}</h1>
            <p className="text-xs text-t-muted mt-0.5">
              Kết thúc: {new Date(auction.deadline).toLocaleString('vi-VN')} · Bước giá: {formatVnd(1e4)}đ cho mọi tài
              sản
            </p>
          </div>
          <Countdown deadline={auction.deadline} dongRoi={ended} className="shrink-0" data-huong-dan="dong-ho" />
        </div>

        {ended && (
          <div className="mb-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
            <div className="text-xs font-semibold text-warning">PHIÊN ĐẤU GIÁ ĐÃ KẾT THÚC</div>
            <div className="mt-0.5 text-[11px] text-t-secondary">
              Không nhận thêm lượt đặt giá. Xem giá cuối của từng tài sản ở tab Kết quả.
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2" data-huong-dan="bo-loc">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-t-micro" />
            <input
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-t-primary placeholder:text-t-micro focus:outline-none focus:border-primary"
              placeholder="Tìm theo tên, SKU, cấu hình..."
              aria-label="Tìm tài sản"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={suggest}
            className={`ins-switch ${suggest ? 'is-on' : ''}`}
            onClick={() => setSuggest(on => !on)}
            title="Chỉ hiện máy còn tốt và dễ thắng, xếp theo điểm trong từng loại"
          >
            <span className="ins-switch-track" aria-hidden="true" />
            Gợi ý dễ thắng
          </button>
          <select
            className={`flex-1 sm:flex-none rounded-lg border bg-surface px-3 py-2 text-xs focus:outline-none ${
              type === 'all' ? 'border-border text-t-secondary' : 'border-primary/40 text-primary'
            }`}
            value={type}
            onChange={e => setType(e.target.value)}
            title="Lọc theo loại thiết bị"
          >
            <option value="all">Loại thiết bị</option>
            {typeOptions.map(([g, n]) => (
              <option key={g} value={g}>
                {g} ({n})
              </option>
            ))}
          </select>
          <select
            className="flex-1 sm:flex-none bg-surface border border-border rounded-lg px-3 py-2 text-xs text-t-secondary focus:outline-none"
            value={office}
            onChange={e => setOffice(e.target.value)}
            title="Nơi nhận máy"
          >
            <option value="all">Văn phòng</option>
            {offices.map(o => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            className={`flex-1 sm:flex-none rounded-lg border bg-surface px-3 py-2 text-xs focus:outline-none ${
              status === 'linh_kien'
                ? 'border-danger/40 text-danger'
                : status === 'hu_hong'
                  ? 'border-warning/40 text-warning'
                  : status === 'binh_thuong'
                    ? 'border-success/30 text-success'
                    : 'border-border text-t-secondary'
            }`}
            value={status}
            onChange={e => setStatus(e.target.value)}
            title="Lọc theo tình trạng máy"
          >
            <option value="all">Tình trạng</option>
            {['binh_thuong', 'hu_hong', 'linh_kien', 'chua_ro']
              .filter(k => (statusCounts[k] || 0) > 0)
              .map(k => (
                <option key={k} value={k}>
                  {STATUS[k].nhan} ({statusCounts[k]})
                </option>
              ))}
          </select>
          <select
            className={`flex-1 sm:flex-none rounded-lg border bg-surface px-3 py-2 text-xs focus:outline-none ${
              interest === 'all' ? 'border-border text-t-secondary' : 'border-primary/40 text-primary'
            }`}
            value={interest}
            onChange={e => setInterest(e.target.value)}
            title="Lọc theo máy đã có người trả giá hay chưa"
          >
            <option value="all">Mức quan tâm</option>
            <option value="theo_doi">Tôi đang theo dõi ({assets.filter(a => followed.has(a.id)).length})</option>
            <option value="has_bids">Đã có người trả giá</option>
            <option value="no_bids">Chưa ai trả giá</option>
          </select>
          <div className="flex w-full items-center gap-1 sm:w-auto" title="Lọc theo giá hiện tại, gồm cả hai đầu">
            {[
              { nhan: 'Giá từ', giaTri: priceFrom, doi: setPriceFrom },
              { nhan: 'Giá đến', giaTri: priceTo, doi: setPriceTo },
            ].map((field, i) => (
              <div key={field.nhan} className="flex flex-1 items-center gap-1 sm:flex-none">
                {i === 1 && <span className="text-xs text-t-micro">-</span>}
                <input
                  inputMode="numeric"
                  className={`w-full rounded-lg border bg-surface px-3 py-2 text-xs placeholder:text-t-micro focus:outline-none focus:border-primary sm:w-28 ${
                    priceRangeInvalid
                      ? 'border-danger/40 text-danger'
                      : field.giaTri === ''
                        ? 'border-border text-t-primary'
                        : 'border-primary/40 text-primary'
                  }`}
                  placeholder={field.nhan}
                  aria-label={field.nhan}
                  value={formatDigits(field.giaTri)}
                  onChange={e => field.doi(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setPriceFocused(true)}
                  onBlur={() => setPriceFocused(false)}
                />
              </div>
            ))}
          </div>
          {hasFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-border px-3 py-2 text-xs font-medium text-t-secondary transition-colors hover:border-danger/40 hover:text-danger"
              title="Bỏ mọi bộ lọc, hiện lại toàn bộ danh sách"
            >
              <X className="h-3.5 w-3.5" />
              Xoá bộ lọc
            </button>
          )}
        </div>

        {hasFilter && (
          <div className="-mt-2 mb-3 text-[11px] text-t-micro">
            Đang hiện {filtered.length} / {assets.length} tài sản
            {priceRangeInvalid && <span className="text-danger"> · Giá từ đang lớn hơn giá đến</span>}
          </div>
        )}

        {suggest && (
          <InsightSummary
            categories={INSIGHTS.categories}
            assetById={ASSET_BY_ID}
            insightsById={INSIGHTS.byId}
            capturedAt={auction.captured_at}
            activeType={type}
            onPickType={setType}
          />
        )}

        {/* Mobile: cards */}
        <div className="space-y-2 md:hidden">
          {rows.map((a, i) => {
            const st = statusOf(a);
            const isFollowed = followed.has(a.id);
            const insight = INSIGHTS.byId.get(a.id);
            return (
              <Fragment key={a.id}>
                {isCategoryStart(i, a) && (
                  <div className="ins-cat-head">
                    {typeGroup(a.asset_type)}
                    <span className="ins-cat-count">{shownPerCategory[typeGroup(a.asset_type)]} máy</span>
                  </div>
                )}
                <div
                  className="flex gap-2 rounded-lg border border-border bg-surface p-3"
                  data-huong-dan={i === 0 ? 'tai-san' : undefined}
                >
                  <button
                    type="button"
                    data-huong-dan={i === 0 ? 'theo-doi' : undefined}
                    onClick={() => toggleFollow(a.id)}
                    aria-pressed={isFollowed}
                    aria-label={isFollowed ? 'Bỏ theo dõi' : 'Theo dõi tài sản này'}
                    className="self-start rounded p-1 transition-colors hover:bg-card"
                  >
                    <Heart className={`h-4 w-4 ${isFollowed ? 'fill-danger text-danger' : 'text-t-micro'}`} />
                  </button>
                  <button type="button" onClick={() => setOpenId(a.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-t-primary">{a.name}</div>
                        <div className="truncate text-[11px] text-t-micro">{specSummary(a.spec)}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold tabular-nums text-success">
                          {formatVnd(a.current_price)}đ
                        </div>
                        <div className="text-[10px] text-t-micro">{a.bid_count} lượt đặt</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {suggest && <ScorePill score={insight.score} />}
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] ${st.lop}`}>
                        {st.nhan}
                      </span>
                      {a.office && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-t-secondary">
                          <MapPin className="h-3 w-3" />
                          {a.office}
                        </span>
                      )}
                      <span className="font-mono text-t-muted">{a.sku}</span>
                    </div>
                    {suggest && <Chips chips={insight.chips} />}
                  </button>
                </div>
              </Fragment>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-t-micro">
              Không có tài sản phù hợp
              {hasFilter && (
                <button onClick={clearFilters} className="ml-2 font-medium text-primary">
                  Xoá bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-[36px]" aria-label="Theo dõi" />
                  <SortHeader le="px-4" cot="loai" nhan="Loại" sort={sort} className="w-[110px]" />
                  <SortHeader le="px-4" cot="sku" nhan="SKU" sort={sort} className="w-[100px]" />
                  <SortHeader le="px-4" cot="office" nhan="Văn phòng" sort={sort} className="w-[100px]" />
                  <SortHeader le="px-4" cot="name" nhan="Tài sản" sort={sort} />
                  <SortHeader le="px-4" cot="tinh_trang" nhan="Tình trạng" sort={sort} className="w-[130px]" />
                  <SortHeader le="px-4" cot="khoi_diem" nhan="Giá đề xuất" sort={sort} canPhai className="w-[120px]" />
                  <SortHeader le="px-4" cot="hien_tai" nhan="Giá hiện tại" sort={sort} canPhai className="w-[120px]" />
                  <SortHeader le="px-4" cot="bids" nhan="Lượt đặt" sort={sort} canPhai className="w-[70px]" />
                  {suggest && <SortHeader le="px-4" cot="diem" nhan="Điểm" sort={sort} canPhai className="w-[70px]" />}
                  <th className="w-[40px]" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => {
                  const st = statusOf(a);
                  const isFollowed = followed.has(a.id);
                  const insight = INSIGHTS.byId.get(a.id);
                  return (
                    <Fragment key={a.id}>
                      {isCategoryStart(i, a) && (
                        <tr className="ins-cat-row">
                          <td colSpan={11}>
                            {typeGroup(a.asset_type)}
                            <span className="ins-cat-count">{shownPerCategory[typeGroup(a.asset_type)]} máy</span>
                          </td>
                        </tr>
                      )}
                      <tr
                        className="border-b border-border/50 hover:bg-card/30 cursor-pointer focus:outline-none focus-visible:bg-card/40"
                        onClick={() => setOpenId(a.id)}
                        onKeyDown={e => {
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            setOpenId(a.id);
                          }
                        }}
                        tabIndex={0}
                        title="Bấm để xem chi tiết và đặt giá"
                        data-huong-dan={i === 0 ? 'tai-san' : undefined}
                      >
                        <td className="py-3 pl-3 align-middle" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            data-huong-dan={i === 0 ? 'theo-doi' : undefined}
                            onClick={() => toggleFollow(a.id)}
                            aria-pressed={isFollowed}
                            title={isFollowed ? 'Bỏ theo dõi' : 'Theo dõi tài sản này'}
                            className="rounded p-1 transition-colors hover:bg-card"
                          >
                            <Heart className={`h-4 w-4 ${isFollowed ? 'fill-danger text-danger' : 'text-t-micro'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-t-secondary">{a.asset_type}</td>
                        <td className="px-4 py-3 text-[11px] font-mono text-t-muted">{a.sku}</td>
                        <td className="px-4 py-3 text-[11px]">
                          {a.office ? (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-card px-2 py-0.5 text-[10px] font-medium text-t-secondary border border-border">
                              <MapPin className="w-3 h-3" />
                              {a.office}
                            </span>
                          ) : (
                            <span className="text-t-micro">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-t-primary">{a.name}</div>
                          <div className="text-[11px] text-t-micro">{specSummary(a.spec)}</div>
                          {suggest && <Chips chips={insight.chips} />}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] ${st.lop}`}
                            title={a.note || ''}
                          >
                            {st.nhan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-t-micro tabular-nums">
                          {formatVnd(a.starting_price ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-success tabular-nums">
                          {formatVnd(a.current_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs tabular-nums text-t-secondary">{a.bid_count}</td>
                        {suggest && (
                          <td className="px-4 py-3 text-right">
                            <ScorePill score={insight.score} />
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="w-3.5 h-3.5 text-t-micro" />
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-t-micro">
              Không có tài sản phù hợp
              {hasFilter && (
                <button onClick={clearFilters} className="ml-2 text-primary hover:underline">
                  Bỏ hết bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {openAsset && (
        <AssetDialog
          asset={openAsset}
          deadline={auction.deadline}
          dongRoi={ended}
          giaNhap={bidInputs[openAsset.id] ?? String(minimumBid(openAsset))}
          giaToiThieu={minimumBid(openAsset)}
          onDoiGia={value => setBidInputs(prev => ({ ...prev, [openAsset.id]: value }))}
          onDatGia={() => placeBid(openAsset)}
          onDong={closeDialog}
          insight={INSIGHTS.byId.get(openAsset.id)}
          insightsById={INSIGHTS.byId}
          assetById={ASSET_BY_ID}
          onOpenAsset={setOpenId}
        />
      )}
    </div>
  );
}
