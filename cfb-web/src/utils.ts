import { replaceAll } from "@carefree0910/cfb-core";

export const smartReplaceSpace = (line: string) =>
  replaceAll(
    replaceAll(
      line.replace(/ +/g, (match) => "&nbsp;".repeat(match.length - 1) + " "),
      "<",
      "&lt;",
    ),
    ">",
    "&gt;",
  );
export const textToHtml = (text: string) =>
  text.split("\n").map(smartReplaceSpace).join("<br>");

interface IGetAutoFontSize {
  w: number;
  h: number;
  content: string;
  maxFontSize: number;
  minFontSize?: number;
  wordBreak?: string;
  lineHeight?: number;
}
const createAutoFontSizeDom = () => {
  const autoFontSizeWrapper = document.createElement("div");
  const autoFontSizeSpan = document.createElement("span");
  autoFontSizeSpan.style.display = "table";
  autoFontSizeSpan.style.visibility = "hidden";
  autoFontSizeWrapper.appendChild(autoFontSizeSpan);
  return {
    autoFontSizeWrapper,
    autoFontSizeSpan,
  };
};
export function getAutoFontSize({
  w,
  h,
  content,
  maxFontSize,
  minFontSize = 1,
  wordBreak = "break-word",
  lineHeight = 1.5,
}: IGetAutoFontSize): number {
  const { autoFontSizeWrapper, autoFontSizeSpan } = createAutoFontSizeDom();
  const wrapper = autoFontSizeWrapper;
  const span = autoFontSizeSpan;
  wrapper.style.width = `${w}px`;
  wrapper.style.height = `${h}px`;
  wrapper.style.lineHeight = `${lineHeight}`;
  span.style.wordBreak = wordBreak;
  span.innerHTML = textToHtml(content);
  document.body.appendChild(wrapper);
  while (maxFontSize - minFontSize > 1) {
    const fontSize = Math.floor(0.5 * (maxFontSize + minFontSize));
    span.style.fontSize = `${fontSize}px`;
    const rect = span.getBoundingClientRect();
    if (rect.height > h || rect.width > w) {
      maxFontSize = fontSize;
    } else {
      minFontSize = fontSize;
    }
  }
  document.body.removeChild(wrapper);
  return minFontSize;
}
