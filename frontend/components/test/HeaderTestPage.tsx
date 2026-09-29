"use client";

import React, { useState } from "react";
import {
  Header,
  HeaderLogo,
  HeaderNav,
  GenreDropdown,
  HeaderSearch,
  HeaderBookmark,
  HeaderWallet,
  HeaderUserAvatar,
  DEFAULT_GENRES,
  DEFAULT_NAV_ITEMS,
  DEFAULT_USER,
  DEFAULT_WALLET,
  DEFAULT_BOOKMARK,
  DEFAULT_LOGO,
  DEFAULT_SEARCH,
  type GenreItemData,
  type NavItem,
} from "@/components/layout/header";

export function HeaderTestPage() {
  // --- Live Interactive State Controls ---
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userName, setUserName] = useState("Hoàng");
  const [userInitial, setUserInitial] = useState("H");
  const [userRole, setUserRole] = useState("Độc giả VIP");
  const [useCustomAvatarImage, setUseCustomAvatarImage] = useState(false);

  const [coins, setCoins] = useState(55);
  const [coinUnit, setCoinUnit] = useState("Xu");
  const [showRechargeBtn, setShowRechargeBtn] = useState(true);

  const [bookmarkCount, setBookmarkCount] = useState(2);

  const [activeNavId, setActiveNavId] = useState("home");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Tìm tên truyện, tác giả...");
  const [logoTitle, setLogoTitle] = useState("Story");
  const [logoSuffix, setLogoSuffix] = useState("VN");
  const [logoSubtitle, setLogoSubtitle] = useState("TIỂU THUYẾT TRỰC TUYẾN");

  const [isSticky, setIsSticky] = useState(true);

  // Event feedback log
  const [lastEvent, setLastEvent] = useState<string | null>(
    "Sẵn sàng thử nghiệm. Thử bấm vào các nút trên Header!"
  );

  const logEvent = (msg: string) => {
    setLastEvent(`${new Date().toLocaleTimeString()}: ${msg}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-20 text-zinc-800 font-sans">
      {/* ========================================================
          PHẦN 1: HEADER TRỰC TIẾP VỚI THÔNG SỐ ĐÃ CHỈNH (LIVE PREVIEW)
      ======================================================== */}
      <div className="w-full bg-white shadow-xs">
        <Header
          sticky={isSticky}
          isLoggedIn={isLoggedIn}
          activeNavId={activeNavId}
          logo={{
            title: logoTitle,
            suffix: logoSuffix,
            subtitle: logoSubtitle,
            iconSrc: "/image/logo-icon.svg",
            href: "#",
          }}
          user={{
            name: userName,
            avatarInitial: userInitial,
            avatarUrl: useCustomAvatarImage ? "/image/avatar-h.svg" : undefined,
            role: userRole,
          }}
          wallet={{
            coins: coins,
            unit: coinUnit,
            coinIconSrc: "/icon/coin.svg",
            onRechargeClick: () => logEvent("Bấm nút nạp Xu (+)"),
          }}
          bookmark={{
            count: bookmarkCount,
            iconSrc: "/icon/bookmark.svg",
            onClick: () => logEvent("Bấm vào tủ truyện đã lưu"),
          }}
          search={{
            placeholder: searchPlaceholder,
            iconSrc: "/icon/search.svg",
            onSearch: (q) => logEvent(`Tìm kiếm từ khóa: "${q}"`),
          }}
          onNavItemClick={(item: NavItem) => {
            setActiveNavId(item.id);
            logEvent(`Chọn menu: "${item.label}" (id: ${item.id})`);
          }}
          onGenreClick={(genre: GenreItemData) => {
            logEvent(`Chọn thể loại: "${genre.name}" (${genre.count})`);
          }}
          onLoginClick={() => logEvent("Bấm nút Đăng nhập / Đăng ký")}
          onLogoutClick={() => {
            setIsLoggedIn(false);
            logEvent("Đã chọn Đăng xuất tài khoản");
          }}
        />
      </div>

      {/* Banner thông báo tương tác nhanh */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-amber-900">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold">Nhật ký sự kiện tương tác:</span>
            <span className="text-zinc-700 italic">{lastEvent}</span>
          </div>
          <button
            onClick={() => {
              setIsLoggedIn(true);
              setCoins(55);
              setCoinUnit("Xu");
              setBookmarkCount(2);
              setActiveNavId("home");
              setUserName("Hoàng");
              setUserInitial("H");
              setUseCustomAvatarImage(false);
              setSearchPlaceholder("Tìm tên truyện, tác giả...");
              setLogoTitle("Story");
              setLogoSuffix("VN");
              setLogoSubtitle("TIỂU THUYẾT TRỰC TUYẾN");
              logEvent("Đã đặt lại thông số mặc định");
            }}
            className="text-xs font-semibold px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 rounded-md transition-colors cursor-pointer"
          >
            ↺ Reset mặc định
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* ========================================================
            PHẦN 2: BẢNG ĐIỀU KHIỂN CHỈNH THÔNG SỐ (CONTROL PANEL)
        ======================================================== */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-200/80">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-100">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                🎛️ Bảng Điều Khiển Thông Số Test Header
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Thay đổi các giá trị bên dưới để xem Header trên đầu trang cập nhật theo thời gian thực (Live Preview).
              </p>
            </div>
            <span className="text-xs bg-orange-100 text-orange-800 font-semibold px-3 py-1 rounded-full">
              Test Page StoryVN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Cột 1: Người dùng & Đăng nhập */}
            <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/60 space-y-4">
              <h3 className="font-semibold text-sm text-zinc-900 border-b border-zinc-200/60 pb-2 flex items-center justify-between">
                <span>👤 Tài Khoản & Đăng Nhập</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isLoggedIn
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {isLoggedIn ? "Đã đăng nhập" : "Khách"}
                </span>
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-zinc-700">Trạng thái đăng nhập:</span>
                  <input
                    type="checkbox"
                    checked={isLoggedIn}
                    onChange={(e) => setIsLoggedIn(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                  />
                </label>

                <div>
                  <label className="block text-zinc-600 mb-1">Tên người dùng:</label>
                  <input
                    type="text"
                    disabled={!isLoggedIn}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-600 mb-1">Ký tự Avatar:</label>
                    <input
                      type="text"
                      maxLength={2}
                      disabled={!isLoggedIn}
                      value={userInitial}
                      onChange={(e) => setUserInitial(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm text-center font-bold disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1">Danh hiệu / Role:</label>
                    <input
                      type="text"
                      disabled={!isLoggedIn}
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between cursor-pointer pt-1">
                  <span className="text-zinc-700">Dùng ảnh SVG avatar từ public:</span>
                  <input
                    type="checkbox"
                    disabled={!isLoggedIn}
                    checked={useCustomAvatarImage}
                    onChange={(e) => setUseCustomAvatarImage(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded cursor-pointer disabled:opacity-50"
                  />
                </label>
              </div>
            </div>

            {/* Cột 2: Ví Tiền Xu & Tủ Truyện Bookmark */}
            <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/60 space-y-4">
              <h3 className="font-semibold text-sm text-zinc-900 border-b border-zinc-200/60 pb-2">
                💰 Ví Xu & Tủ Truyện
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-600">Số dư Xu:</label>
                    <span className="font-bold text-amber-700">{coins} {coinUnit}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="5"
                    value={coins}
                    onChange={(e) => setCoins(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {[10, 55, 100, 500].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCoins(amt)}
                        className="flex-1 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200/70 transition-colors"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-600 mb-1">Đơn vị:</label>
                    <input
                      type="text"
                      value={coinUnit}
                      onChange={(e) => setCoinUnit(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1">Badge Tủ truyện:</label>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={bookmarkCount}
                      onChange={(e) => setBookmarkCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 italic">
                  * Khi Badge = 0, vòng tròn số lượng màu cam trên icon tủ truyện sẽ tự động ẩn đi.
                </p>
              </div>
            </div>

            {/* Cột 3: Menu, Logo & Tìm kiếm */}
            <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/60 space-y-4">
              <h3 className="font-semibold text-sm text-zinc-900 border-b border-zinc-200/60 pb-2">
                🧭 Điều Hướng & Thương Hiệu
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block text-zinc-600 mb-1">Tab điều hướng đang chọn:</label>
                  <select
                    value={activeNavId}
                    onChange={(e) => setActiveNavId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm cursor-pointer"
                  >
                    <option value="home">Trang Chủ (Active pill)</option>
                    <option value="the-loai">Thể Loại</option>
                    <option value="bang-xep-hang">Bảng Xếp Hạng</option>
                    <option value="dien-dan">Diễn Đàn</option>
                    <option value="none">Không chọn tab nào</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-600 mb-1">Placeholder thanh tìm kiếm:</label>
                  <input
                    type="text"
                    value={searchPlaceholder}
                    onChange={(e) => setSearchPlaceholder(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-600 mb-1">Logo Title:</label>
                    <input
                      type="text"
                      value={logoTitle}
                      onChange={(e) => setLogoTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 mb-1">Logo Suffix:</label>
                    <input
                      type="text"
                      value={logoSuffix}
                      onChange={(e) => setLogoSuffix(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm text-orange-600 font-bold"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between cursor-pointer pt-1">
                  <span className="text-zinc-700">Cố định Header khi cuộn (Sticky):</span>
                  <input
                    type="checkbox"
                    checked={isSticky}
                    onChange={(e) => setIsSticky(e.target.checked)}
                    className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            PHẦN 3: TEST "NẾU KHÔNG TRUYỀN GÌ THÌ DEFAULT"
        ======================================================== */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-200/80 space-y-4">
          <div className="border-b border-zinc-100 pb-4">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
              ✓ Yêu cầu: &quot;Nếu không truyền gì thì default&quot;
            </div>
            <h2 className="text-lg font-bold text-zinc-900">
              Kiểm tra component: &lt;Header /&gt; (Không truyền bất kỳ props nào)
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Dưới đây là một Header độc lập được gọi đúng bằng cú pháp:{" "}
              <code className="text-xs bg-zinc-100 px-2 py-0.5 rounded text-orange-600 font-mono">
                &lt;Header /&gt;
              </code>
              . Toàn bộ thông số (Logo StoryVN, &quot;Trang Chủ&quot; active, Dropdown 9 thể loại với số lượng truyện, ví 55 Xu, icon public, avatar H) đều tự động hiển thị mặc định chính xác như ảnh mẫu.
            </p>
          </div>

          {/* Header render thuần với default props */}
          <div className="p-3 bg-zinc-100/50 rounded-xl border border-dashed border-zinc-300">
            <Header sticky={false} />
          </div>
        </section>

        {/* ========================================================
            PHẦN 4: HIỂN THỊ CHI TIẾT TỪNG COMPONENT CON ĐÃ TÁCH NHỎ
        ======================================================== */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-200/80 space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
              ✓ Yêu cầu: &quot;Tách càng nhỏ càng tốt&quot; &amp; &quot;Icon / image để ở public&quot;
            </div>
            <h2 className="text-lg font-bold text-zinc-900">
              Triển lãm các Sub-components độc lập (Atomic Components)
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Header được phân rã thành các khối micro-component độc lập. Bạn có thể tái sử dụng hoặc tùy biến từng khối ở bất kỳ trang nào.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Component 1: HeaderLogo */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  1. Component: &lt;HeaderLogo /&gt;
                </span>
                <p className="text-xs text-zinc-500 mb-4">
                  Icon squircle cam tải từ <code className="text-orange-600">/image/logo-icon.svg</code>, kèm typography thương hiệu.
                </p>
                <div className="p-3 bg-white rounded-lg border border-zinc-100 inline-block">
                  <HeaderLogo />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/60 text-[11px] text-zinc-400">
                Đường dẫn: <code>components/layout/header/HeaderLogo.tsx</code>
              </div>
            </div>

            {/* Component 2: GenreDropdown */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  2. Component: &lt;GenreDropdown /&gt;
                </span>
                <p className="text-xs text-zinc-500 mb-4">
                  Menu &quot;Thể Loại&quot; dạng popover 2 cột, số lượng truyện (4.2k, 5.3k...), chevron icons từ public.
                </p>
                <div className="p-3 bg-white rounded-lg border border-zinc-100 flex items-center">
                  <GenreDropdown
                    onGenreClick={(g) => logEvent(`Chọn thể loại: ${g.name}`)}
                  />
                  <span className="text-xs text-zinc-400 ml-2 italic">← Nhấp để xem popover</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/60 text-[11px] text-zinc-400">
                Đường dẫn: <code>components/layout/header/GenreDropdown.tsx</code>
              </div>
            </div>

            {/* Component 3: HeaderSearch */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  3. Component: &lt;HeaderSearch /&gt;
                </span>
                <p className="text-xs text-zinc-500 mb-4">
                  Thanh tìm kiếm bo tròn pill, kính lúp từ <code className="text-orange-600">/icon/search.svg</code>, nút xóa nhanh.
                </p>
                <div className="p-3 bg-white rounded-lg border border-zinc-100">
                  <HeaderSearch
                    onSearch={(q) => logEvent(`Tìm: "${q}"`)}
                    className="max-w-none"
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/60 text-[11px] text-zinc-400">
                Đường dẫn: <code>components/layout/header/HeaderSearch.tsx</code>
              </div>
            </div>

            {/* Component 4: HeaderBookmark */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  4. Component: &lt;HeaderBookmark /&gt;
                </span>
                <p className="text-xs text-zinc-500 mb-4">
                  Icon ribbon từ <code className="text-orange-600">/icon/bookmark.svg</code> kèm badge tròn cam &quot;2&quot;.
                </p>
                <div className="p-3 bg-white rounded-lg border border-zinc-100 flex items-center gap-4">
                  <HeaderBookmark
                    bookmark={{ count: 2, iconSrc: "/icon/bookmark.svg" }}
                    onClick={() => logEvent("Bấm bookmark test")}
                  />
                  <HeaderBookmark
                    bookmark={{ count: 18, iconSrc: "/icon/bookmark.svg" }}
                    onClick={() => logEvent("Bấm bookmark test (18)")}
                  />
                  <HeaderBookmark
                    bookmark={{ count: 0, iconSrc: "/icon/bookmark.svg" }}
                    onClick={() => logEvent("Bấm bookmark test (0)")}
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/60 text-[11px] text-zinc-400">
                Đường dẫn: <code>components/layout/header/HeaderBookmark.tsx</code>
              </div>
            </div>

            {/* Component 5: HeaderWallet */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  5. Component: &lt;HeaderWallet /&gt;
                </span>
                <p className="text-xs text-zinc-500 mb-4">
                  Khung viên thuốc vàng kem, icon 2 đồng xu <code className="text-orange-600">/icon/coin.svg</code>, nút cộng nạp xu.
                </p>
                <div className="p-3 bg-white rounded-lg border border-zinc-100 flex items-center gap-3">
                  <HeaderWallet
                    wallet={{
                      coins: 55,
                      unit: "Xu",
                      coinIconSrc: "/icon/coin.svg",
                      onRechargeClick: () => logEvent("Bấm nạp xu ví 55"),
                    }}
                  />
                  <HeaderWallet
                    wallet={{
                      coins: 1250,
                      unit: "Xu",
                      coinIconSrc: "/icon/coin.svg",
                      onRechargeClick: () => logEvent("Bấm nạp xu ví 1250"),
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/60 text-[11px] text-zinc-400">
                Đường dẫn: <code>components/layout/header/HeaderWallet.tsx</code>
              </div>
            </div>

            {/* Component 6: HeaderUserAvatar */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  6. Component: &lt;HeaderUserAvatar /&gt;
                </span>
                <p className="text-xs text-zinc-500 mb-4">
                  Avatar hình tròn màu đen chữ &quot;H&quot; trắng hoặc ảnh từ public, menu tài khoản khi nhấn vào.
                </p>
                <div className="p-3 bg-white rounded-lg border border-zinc-100 flex items-center gap-4">
                  <HeaderUserAvatar
                    user={{ name: "Hoàng", avatarInitial: "H" }}
                    isLoggedIn={true}
                    onLogoutClick={() => logEvent("Đăng xuất từ Avatar demo")}
                  />
                  <span className="text-xs text-zinc-400">← Bấm mở menu cá nhân</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-200/60 text-[11px] text-zinc-400">
                Đường dẫn: <code>components/layout/header/HeaderUserAvatar.tsx</code>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            PHẦN 5: BẢNG DANH MỤC CÁC ICON & ASSET TẠI /PUBLIC
        ======================================================== */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-200/80 space-y-4">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-lg font-bold text-zinc-900">
              📁 Danh mục Icons &amp; Images mặc định (đặt tại thư mục <code className="text-orange-600 font-mono">public/</code>)
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Tất cả icon và hình ảnh được lưu dưới dạng file vector SVG chuẩn trong thư mục public để dễ dàng tùy biến hoặc thay thế:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { path: "/image/logo-icon.svg", name: "logo-icon.svg", desc: "Logo StoryVN" },
              { path: "/image/logo.svg", name: "logo.svg", desc: "Logo full kèm text" },
              { path: "/image/avatar-h.svg", name: "avatar-h.svg", desc: "Avatar H nền đen" },
              { path: "/icon/coin.svg", name: "coin.svg", desc: "Đồng xu vàng" },
              { path: "/icon/bookmark.svg", name: "bookmark.svg", desc: "Tủ truyện bookmark" },
              { path: "/icon/search.svg", name: "search.svg", desc: "Kính lúp tìm kiếm" },
              { path: "/icon/chevron-down.svg", name: "chevron-down.svg", desc: "Mũi tên xuống" },
              { path: "/icon/chevron-up.svg", name: "chevron-up.svg", desc: "Mũi tên lên" },
              { path: "/icon/plus.svg", name: "plus.svg", desc: "Nút cộng nạp xu" },
              { path: "/icon/book.svg", name: "book.svg", desc: "Quyển sách mở" },
              { path: "/icon/menu.svg", name: "menu.svg", desc: "Menu mobile" },
              { path: "/icon/close.svg", name: "close.svg", desc: "Đóng modal / drawer" },
            ].map((item) => (
              <div
                key={item.name}
                className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 flex flex-col items-center text-center gap-2 hover:bg-orange-50/50 hover:border-orange-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white shadow-2xs border border-zinc-100 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.path} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <span className="font-mono text-xs font-semibold text-zinc-800 truncate w-full">
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            PHẦN 6: CODE SNIPPET ĐƯỢC SINH TỰ ĐỘNG
        ======================================================== */}
        <section className="bg-zinc-950 text-zinc-100 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                💻 Mã nguồn sử dụng (JSX Code Snippet)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Copy đoạn code dưới đây để dùng trong bất kỳ page nào của bạn
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`<Header />`);
                logEvent("Đã copy code snippet vào clipboard!");
              }}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Sao chép &lt;Header /&gt;
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-zinc-400 font-mono mb-1.5">// 1. Cách dùng đơn giản nhất (Dùng toàn bộ mặc định):</p>
              <pre className="bg-zinc-900/90 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
{`import { Header } from "@/components/layout/header";

export default function MyPage() {
  return <Header />; // Không truyền gì thì hiển thị mặc định chính xác như ảnh mẫu
}`}
              </pre>
            </div>

            <div>
              <p className="text-xs text-zinc-400 font-mono mb-1.5">// 2. Hoặc truyền các thông số tùy biến khi cần:</p>
              <pre className="bg-zinc-900/90 p-3 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto">
{`<Header
  isLoggedIn={${isLoggedIn}}
  activeNavId="${activeNavId}"
  wallet={{ coins: ${coins}, unit: "${coinUnit}" }}
  bookmark={{ count: ${bookmarkCount} }}
  user={{ name: "${userName}", avatarInitial: "${userInitial}" }}
  onGenreClick={(genre) => console.log(genre)}
/>`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
