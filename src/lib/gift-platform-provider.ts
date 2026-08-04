import type { GiftRecord,GiftSource } from "./types";

export interface GiftPlatformProvider{readonly id:GiftSource;readonly name:string;readonly automatic:boolean;connect():Promise<void>;sync(since?:string):Promise<GiftRecord[]>}
export class ManualGiftProvider implements GiftPlatformProvider{readonly id="manual" as const;readonly name="手动记录";readonly automatic=false;async connect(){}async sync(){return []}}
export const futureGiftProviders:ReadonlyArray<Pick<GiftPlatformProvider,"id"|"name"|"automatic">>=[
 {id:"bilibili",name:"B站",automatic:true},{id:"douyin",name:"抖音",automatic:true},{id:"kuaishou",name:"快手",automatic:true},{id:"youtube",name:"YouTube Live",automatic:true},{id:"twitch",name:"Twitch",automatic:true},
];
export const giftPlatformProvider:GiftPlatformProvider=new ManualGiftProvider();
