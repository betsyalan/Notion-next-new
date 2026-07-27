/**
 * Notion 选项色 → 文字颜色类名。
 * 样式表(styles/notion.css)中没有 .notion-green 文字类,
 * 绿色文字在 react-notion-x 中名为 teal(色值与 Notion 绿色文字一致);
 * default 无文字类,回退 gray。
 * @param {string} color Notion select/multi_select 选项色
 * @returns {string} 文字颜色类名
 */
export const notionTextColorClass = color => {
  if (color === 'green') return 'notion-teal'
  if (!color || color === 'default') return 'notion-gray'
  return `notion-${color}`
}
