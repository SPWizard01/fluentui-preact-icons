import { $, build, type BuildOutput, write } from "bun";
import { readdir, } from "fs/promises";
await $`rm -rf dist`;
interface IconDefinition {
    Name: string;
    NameLower: string;
    Size: string;
    Variant: string;
    FileName: string;
}
function toCamelCase(str: string) {
    return str
        .split('_') // Split the string by underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(''); // Join the words together
}
function groupBy<T extends { [key: string]: any }>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((result, currentValue) => {
        const keyValue = currentValue[key];
        if (!result[keyValue]) {
            result[keyValue] = [];
        }
        result[keyValue].push(currentValue);
        return result;
    }, {} as { [key: string]: T[] });
}

const icons: IconDefinition[] = [];
const a = await readdir("node_modules/@fluentui/svg-icons/icons", { recursive: false, withFileTypes: true })
const nameParser = new RegExp(/(?<Name>.*)_(?<Size>\d{2})_(?<Variant>\w*)\.svg/);
for (const element of a) {
    if (element.isFile()) {
        const match = nameParser.exec(element.name);
        if (match && match.groups) {
            const Name = toCamelCase(match.groups["Name"] ?? "Unknown")
            const Size = match.groups["Size"] ?? "20"
            const Variant = toCamelCase(match.groups["Variant"] ?? "Regular")
            icons.push({
                Name,
                NameLower: Name.toLowerCase(),
                Size,
                Variant,
                FileName: element.name
            })
            // await write(`src/icons/${Name}${Size}${Variant}.tsx`, `export * from "@fluentui/svg-icons/icons/${element.name}"`)
        }
    }
}
const grouped = groupBy(icons, "NameLower");
// write source imports
for (const key in grouped) {
    const icons = grouped[key]!;
    const camelCaseName = icons[0]!.Name;
    let content = icons.map(icon => `import ${icon.Name}${icon.Size}${icon.Variant}Svg from "@fluentui/svg-icons/icons/${icon.FileName}" with { type: "text" }`).join("\n")
    //let content = "";
    content += `\nimport { createIcon } from "../utils/createIcon"`
    const createIconCalls = icons.map(icon => {
        const iconName = `${icon.Name}${icon.Size}${icon.Variant}`
        const iconNameNoSize = `${icon.Name}${icon.Variant}`;
        // const content `export const ${iconName} = createIcon("${iconName}", "${icon.Size}", import("@fluentui/svg-icons/icons/${icon.FileName}", { with: { type: "text" }}));`
        let exportContent = `export const ${iconName} = /** #__PURE__ */ createIcon("${iconName}", "${icon.Size}", ${iconName}Svg);`;
        if (icon.Size === "20") {
            exportContent += `\nexport const ${iconNameNoSize} = /** #__PURE__ */ createIcon("${iconNameNoSize}", "1em", ${iconName}Svg);`
        }
        return exportContent
    }).join("\n")
    content += `\n${createIconCalls}`
    await write(`src/icons/${camelCaseName}.tsx`, content)
}
// write index.ts

let indexTsContent = "";
for (const key in grouped) {
    const icons = grouped[key]!;
    const camelCaseName = icons[0]!.Name;
    indexTsContent += `export * from "./icons/${camelCaseName}";\n`
}
await write(`src/index.ts`, indexTsContent)

// let indexTsContent = "";
// let chunkedCount = 0;
// let chunkIndex = 0;
// const entryPointChunks: string[] = [];
// let indexExports = ``
// for (const key in grouped) {
//     const icons = grouped[key]!;
//     chunkedCount += icons.length;
//     const camelCaseName = icons[0]!.Name;
//     const exp = `export * from "./icons/${camelCaseName}";`
//     indexTsContent += `${exp}\n`
//     if(chunkedCount >= 1000) {
//         const chunkName = `chunk-${chunkIndex}.ts`;
//         indexExports += `export * from "./${chunkName}";\n`
//         const epChunk = `src/${chunkName}`;
//         await write(epChunk, indexTsContent)
//         entryPointChunks.push(epChunk);
//         indexTsContent = "";
//         chunkedCount = 0;
//         chunkIndex++;
//     }
// }
// if(chunkedCount > 0) {
//     const chunkName = `chunk-${chunkIndex}.ts`;
//     indexExports += `export * from "./${chunkName}";\n`
//     const epChunk = `src/${chunkName}`;
//     await write(epChunk, indexTsContent)
//     entryPointChunks.push(epChunk);
//     indexTsContent = "";
//     chunkedCount = 0;
// }

// //await write(`dist/index.js`, indexExports.replaceAll(`.ts";`, `.js";`))
// await write(`src/index.ts`, indexExports)
// // entryPointChunks.push("src/index.ts")

let AppTsxContent = `import React from "preact";\n`
let AppTsxRenderContent = ``
for (const key in grouped) {
    const icons = grouped[key]!;
    const camelCaseName = icons[0]!.Name;
    AppTsxContent += `import { ${icons.map(i => (`${i.Name}${i.Size}${i.Variant}`)).join(", ")} } from "../src/icons/${camelCaseName}";\n`
    AppTsxRenderContent += icons.map(i => (`<${i.Name}${i.Size}${i.Variant} />`)).join("\n")
}
AppTsxContent += `
export function App() {
  return (
    <div>
      ${AppTsxRenderContent}
    </div>
  );
}`
await write(`showcase/App.tsx`, AppTsxContent)



const result = await build({
    // entrypoints: entryPointChunks,
    entrypoints: ["src/index.ts"],
    sourcemap: "none",
    outdir: "./dist",
    naming: {
        entry: "[name].[ext]",
    },
    target: "browser",
    splitting: true,
    minify: false,
    format: "esm",
    external: ["preact"],
})
function printOutput(result: BuildOutput) {
    console.table(result.outputs.map((bldArt) => {
        return {
            name: bldArt.path,
            size: `${Math.floor(bldArt.size / 1024)}KB`,
        }
    }));
}
await $`tsc -p tsconfig.json`
printOutput(result);