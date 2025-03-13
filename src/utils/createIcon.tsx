import type { JSX } from "preact";

export interface IconProps {
  primaryFill?: string;
  className?: string;
  filled?: boolean;
  title?: string;
}
const parser = new DOMParser();
export function createIcon(name: string, width: string, svgPathArray: any) {
  const viewBoxWidth = width === "1em" ? "20" : width;
  const doc = parser.parseFromString(svgPathArray, "text/xml");
  const svgElem = doc.querySelector("svg");
  if (!svgElem) {
    throw new Error("Invalid svg source");
  }
  // const paths = Array.from(svgPathArray).map((dString, idx) => (
  //   <path key={`${name}${idx}`} d={dString as string} />
  // ));
  const SvgIcon = (props: JSX.SVGAttributes<SVGSVGElement>) => {
    return (
      <svg
        {...props}
        width={width}
        height={width}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxWidth}`}
        xmlns={"http://www.w3.org/2000/svg"}
        dangerouslySetInnerHTML={{ __html: svgElem.innerHTML }}
      ></svg>
    );
  };
  Object.defineProperty(SvgIcon, "name", { value: name, writable: false });
  return SvgIcon;
}
