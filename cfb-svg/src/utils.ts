import type { Element } from "npm:@svgdotjs/svg.js@^3.2.0";

import { v4 } from "npm:uuid@^11.0.2";
import { SVG } from "npm:@svgdotjs/svg.js@^3.2.0";

export function getMaskId(alias: string): string {
  return `${alias}.mask`;
}

export function walkTreeSvg(elem: Element, callback: (elem: Element) => void) {
  callback(elem);
  elem.children && elem.children().each((item) => walkTreeSvg(item, callback));
}

/**
 * Get a 'unique' svg
 *
 * Sometimes ids / classes might be duplicated, which may cause issues when
 * rendering the svg. This function will use `uuid` to generate unique ids and
 * classes, replacing the original ones.
 *
 * @param svg The svg to be processed.
 * @returns The processed svg.
 */
export function getUniqueSvg<T extends Element>(svg: T): T {
  const ids: string[] = [];
  const classNames: string[] = [];
  walkTreeSvg(svg, (e: Element) => {
    const id = e.node.getAttribute("id");
    const classAttr = e.node.getAttribute("class");
    classAttr && classNames.push(...classAttr.split(" "));
    id && ids.push(id);
  });

  let svgStr = svg.svg();
  function replaceRef(str: string, ref: string, newRef: string) {
    const r = new RegExp(
      `(id=['"]|class=['"]|url\\((&quot;)?#|href=['"]#|\\.|#)(${ref})((&quot;\\))?|['"]|{)`,
      "g",
    );
    return str.replace(r, `$1${newRef}$4`);
  }
  ids.forEach((id) => {
    const newId = v4();
    svgStr = replaceRef(svgStr, id, newId);
  });
  classNames.forEach((className) => {
    const newClassName = "class" + v4();
    svgStr = replaceRef(svgStr, className, newClassName);
  });
  return SVG(svgStr) as T;
}
