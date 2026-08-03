import fs from "node:fs";
import path from "node:path";
import { Converter } from "opencc-js";
const convert=Converter({from:"tw",to:"cn"});
const roots=["src/components","src/app","src/lib"];
for(const root of roots){for(const entry of fs.readdirSync(root,{recursive:true,withFileTypes:true})){if(!entry.isFile()||!/^.+\.(ts|tsx)$/.test(entry.name))continue;const file=path.join(entry.parentPath,entry.name);const source=fs.readFileSync(file,"utf8");const result=convert(source).replaceAll('zh-TW','zh-CN');if(result!==source)fs.writeFileSync(file,result,"utf8")}}
console.log("UI source converted to Simplified Chinese.");
