const parser = new DOMParser();
export function createIcon(name: string, svgSource: string) {
  const doc = parser.parseFromString(svgSource, "text/xml");
  const svgElem = doc.querySelector("svg");
  if (!svgElem) {
    throw new Error("Invalid svg source");
  }
  const viewBoxStr = svgElem.getAttribute("viewBox") ?? "";
  const widthStr = svgElem.getAttribute("width") ?? "";
  const heightStr = svgElem.getAttribute("height") ?? "";
  const xmlnsStr =
    svgElem.getAttribute("xmlns") ?? "http://www.w3.org/2000/svg";
  const paths = Array.from(svgElem.querySelectorAll("path")).map((path) => (
    <path d={path.getAttribute("d") ?? ""} />
  ));
  const SvgIcon = (props: any) => {
    return (
      <svg
        viewBox={viewBoxStr}
        width={widthStr}
        height={heightStr}
        xmlns={xmlnsStr}
      >
        {paths}
      </svg>
    );
  };
  Object.defineProperty(SvgIcon, "name", { value: name, writable: false });
  return SvgIcon;
}
