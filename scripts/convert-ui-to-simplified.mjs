import fs from "node:fs";
import path from "node:path";
const replacements=new Map([
  ["怎幺","怎么"],["什幺","什么"],["设定","设置"],["资料","数据"],
  ["纪录","记录"],["搜寻","搜索"],["汇出","导出"],["汇入","导入"],
  ["介面","界面"],["套用","应用"],["装置","设备"],["档案","文件"],
  ["储存","保存"],["覆盘","复盘"],["本机","本地"],["字级","字号"],
  ["直播主","主播"],["使用者名称","用户名"],
]);
const convert=source=>[...replacements].reduce((text,[from,to])=>text.replaceAll(from,to),source);
const roots=["src/components","src/app","src/lib"];
for(const root of roots){for(const entry of fs.readdirSync(root,{recursive:true,withFileTypes:true})){if(!entry.isFile()||!/^.+\.(ts|tsx)$/.test(entry.name))continue;const file=path.join(entry.parentPath,entry.name);const source=fs.readFileSync(file,"utf8");const result=convert(source).replaceAll('zh-TW','zh-CN').replaceAll('zh-Hant','zh-CN');if(result!==source)fs.writeFileSync(file,result,"utf8")}}
console.log("UI source converted to Simplified Chinese.");
