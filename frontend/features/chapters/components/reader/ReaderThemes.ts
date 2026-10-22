export const CHAPTERS_PER_PAGE = 10;

export type ReaderThemeMode = "vintage" | "light" | "dark";

export function formatReaderDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

export const READER_THEMES = {
  vintage: {
    bg: "bg-[#fcfbf7]",
    cardBg: "bg-[#fbf9f4]",
    titleColor: "text-[#2c2725]",
    storyLink: "text-[#b42b24] hover:text-[#8b1e17]",
    textColor: "text-[#2b2b2b]",
    secondaryText: "text-[#736b63]",
    border: "border-[#ede7de]",
    divider: "border-stone-200/60",
    tagBg: "bg-[#f3eee6] text-[#736b63] border border-[#e6ded1]",
    topBackBtn: "text-stone-500 hover:text-stone-800",
    settingsBtn: "bg-white text-stone-700 hover:bg-stone-50 border-stone-200 shadow-2xs",
    settingsPopup: "bg-white border-stone-200 text-stone-700 shadow-xl",
    settingsLabel: "text-stone-700",
    settingsBtnSecondary: "bg-stone-100 hover:bg-stone-200 text-stone-800",
    rangeAccent: "accent-[#8b251e]",
    navPrevBtn: "bg-[#d69f95] hover:bg-[#c98e83] text-white shadow-xs",
    navNextBtn: "bg-[#8b1e17] hover:bg-[#721913] text-white shadow-xs",
    navDisabledBtn: "bg-stone-200/70 text-stone-400",
    navSelectorBtn: "bg-[#faedd9] hover:bg-[#f5e3ca] border-[#e8d2b7] text-stone-800 shadow-2xs",
    navScrollTopBtn: "bg-[#faedd9] hover:bg-[#f5e3ca] border-[#e8d2b7] text-stone-800 shadow-2xs",
    menuDropdown: "bg-white border-stone-200 divide-stone-100 text-stone-700 shadow-2xl",
    menuItemActive: "bg-[#ece5da] text-[#2c2725] font-semibold border border-[#ded5c7]",
    menuItemHover: "hover:bg-stone-100/70 text-stone-700 border border-transparent",
    menuHeader: "text-stone-400",
    selection: "selection:bg-amber-200 selection:text-stone-900",
  },
  light: {
    bg: "bg-white",
    cardBg: "bg-zinc-50",
    titleColor: "text-zinc-900",
    storyLink: "text-rose-600 hover:text-rose-700",
    textColor: "text-zinc-800",
    secondaryText: "text-zinc-500",
    border: "border-zinc-200",
    divider: "border-zinc-200",
    tagBg: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    topBackBtn: "text-zinc-500 hover:text-zinc-900",
    settingsBtn: "bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-2xs",
    settingsPopup: "bg-white border-zinc-200 text-zinc-700 shadow-xl",
    settingsLabel: "text-zinc-700",
    settingsBtnSecondary: "bg-zinc-100 hover:bg-zinc-200 text-zinc-800",
    rangeAccent: "accent-zinc-900",
    navPrevBtn: "bg-zinc-300 hover:bg-zinc-400 text-zinc-800 shadow-xs",
    navNextBtn: "bg-zinc-900 hover:bg-black text-white shadow-xs",
    navDisabledBtn: "bg-zinc-100 text-zinc-400",
    navSelectorBtn: "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800 shadow-2xs",
    navScrollTopBtn: "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800 shadow-2xs",
    menuDropdown: "bg-white border-zinc-200 divide-zinc-100 text-zinc-800 shadow-2xl",
    menuItemActive: "bg-zinc-100 text-zinc-900 font-semibold border border-zinc-200/80",
    menuItemHover: "hover:bg-zinc-50 text-zinc-700 border border-transparent",
    menuHeader: "text-zinc-400",
    selection: "selection:bg-zinc-200 selection:text-zinc-900",
  },
  dark: {
    bg: "bg-[#202228]",
    cardBg: "bg-[#282a32]",
    titleColor: "text-white",
    storyLink: "text-amber-400 hover:text-amber-300",
    textColor: "text-zinc-100",
    secondaryText: "text-zinc-400",
    border: "border-zinc-750",
    divider: "border-zinc-700/60",
    tagBg: "bg-[#282a32] text-zinc-300 border border-zinc-700/70",
    topBackBtn: "text-zinc-400 hover:text-zinc-100",
    settingsBtn: "bg-[#282a32] text-zinc-200 hover:bg-[#32353f] border-zinc-700 shadow-2xs",
    settingsPopup: "bg-[#282a32] border-zinc-700 text-zinc-200 shadow-2xl",
    settingsLabel: "text-zinc-200",
    settingsBtnSecondary: "bg-[#333642] hover:bg-[#3d414f] text-zinc-100",
    rangeAccent: "accent-amber-400",
    navPrevBtn: "bg-zinc-700 hover:bg-zinc-600 text-white shadow-xs",
    navNextBtn: "bg-[#9b2c23] hover:bg-[#b5342a] text-white shadow-xs",
    navDisabledBtn: "bg-zinc-800 text-zinc-600",
    navSelectorBtn: "bg-[#282a32] hover:bg-[#32353f] border-zinc-700 text-zinc-200 shadow-2xs",
    navScrollTopBtn: "bg-[#282a32] hover:bg-[#32353f] border-zinc-700 text-zinc-200 shadow-2xs",
    menuDropdown: "bg-[#282a32] border-zinc-700 divide-zinc-700/60 text-zinc-200 shadow-2xl",
    menuItemActive: "bg-[#333642] text-white font-semibold border border-zinc-700/80",
    menuItemHover: "hover:bg-[#2c2f38] text-zinc-300 border border-transparent",
    menuHeader: "text-zinc-400",
    selection: "selection:bg-amber-400/30 selection:text-amber-200",
  },
};
