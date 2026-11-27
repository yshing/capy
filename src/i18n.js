/**
 * 自動偵測瀏覽器語言並提供中／英雙語切換
 */
export const TRANSLATIONS = {
  zh: {
    htmlLang: 'zh-Hant',
    pageTitle: '卡皮巴拉の溫泉',
    loadingText: '正在準備溫熱的柚子溫泉⋯',
    navAria: '場景互動控制',
    petBtn: '摸摸頭',
    petTitle: '摸摸卡皮巴拉',
    timeTitle: '切換早中晚時段',
    petalsBtn: '櫻花飄落',
    petalsTitle: '開關櫻花花瓣',
    soundBtn: '音效',
    soundTitle: '開關療癒音效',
    langBtn: 'EN',
    langTitle: 'Switch to English',
    showUi: '👁️ 顯示介面',
    hideUi: '👁️ 隱藏介面',
    toggleUiTitle: '隱藏或顯示介面',
    timeNames: ['晨光溫泉', '夕陽黃昏', '星夜溫泉'],
    petMessages: [
      '卡皮巴拉覺得很舒服～ ♥',
      '情緒穩定度 +100% ✨',
      '好溫暖的柚子溫泉呀 ♨️',
      '卡皮巴拉開心地瞇起眼睛 ♪',
      '軟綿綿的好好摸 💛',
    ],
    babyPetMessage: '小卡皮巴拉寶寶開心地搖搖耳朵～ ♥',
    yuzuStack: (isBaby, count) =>
      `${isBaby ? '小卡皮巴拉' : '卡皮巴拉'}頭頂成功疊了 ${count} 顆柚子！平衡感滿分 🍊`,
    yuzuOverflow: (isBaby) =>
      `${isBaby ? '小卡皮巴拉' : '卡皮巴拉'}頭上的柚子疊太高掉進溫泉啦！重新疊起 🍊`,
    floatingYuzuSplash: '噗通！柚子在溫泉裡彈了一下 🍊',
    timeSwitched: (name, icon) => `已切換至「${name}」${icon}`,
  },
  en: {
    htmlLang: 'en',
    pageTitle: 'Capybara Onsen',
    loadingText: 'Warming up the yuzu onsen...',
    navAria: 'Scene controls',
    petBtn: 'Pet',
    petTitle: 'Pet the capybara',
    timeTitle: 'Switch time of day',
    petalsBtn: 'Petals',
    petalsTitle: 'Toggle sakura petals',
    soundBtn: 'Sound',
    soundTitle: 'Toggle sound effects',
    langBtn: '中文',
    langTitle: '切換至中文',
    showUi: '👁️ Show UI',
    hideUi: '👁️ Hide UI',
    toggleUiTitle: 'Show or hide controls',
    timeNames: ['Morning', 'Sunset', 'Starry Night'],
    petMessages: [
      'Capybara feels super cozy~ ♥',
      'Inner peace +100% ✨',
      'Such a warm yuzu onsen ♨️',
      'Capybara squints happily ♪',
      'So soft and squishy 💛',
    ],
    babyPetMessage: 'Baby capybara wiggles its ears happily~ ♥',
    yuzuStack: (isBaby, count) =>
      `Stacked ${count} yuzu on ${isBaby ? 'baby capybara' : 'capybara'}! Purrfect balance 🍊`,
    yuzuOverflow: (isBaby) =>
      `Too tall! The yuzu tumbled into the bath—starting over for ${isBaby ? 'baby capybara' : 'capybara'} 🍊`,
    floatingYuzuSplash: 'Plop! A yuzu bounced in the water 🍊',
    timeSwitched: (name, icon) => `Switched to ${name} ${icon}`,
  },
};

export function detectInitialLanguage() {
  try {
    const saved = localStorage.getItem('capy_lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // 忽略隱私模式存取限制
  }
  const preferred =
    (Array.isArray(navigator.languages) && navigator.languages[0]) ||
    navigator.language ||
    'en';
  return preferred.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function saveLanguage(lang) {
  try {
    localStorage.setItem('capy_lang', lang);
  } catch {
    // 忽略隱私模式存取限制
  }
}
