const fs = require("fs"); const path = require("path");
const jaContent = fs.readFileSync("./lib/i18n/locales/ja.ts.bak", "utf8");
const fixed = jaContent.replace(/export const ja: TranslationValue = /g, "const ja: TranslationValue = ").replace(/} as const/g, "} as const

export default ja");
fs.writeFileSync("./lib/i18n/locales/ja.ts", fixed, "utf8");
console.log("Fixed ja.ts file");
