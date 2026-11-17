/**
 * 静态资源前缀 —— 子路径部署时给 public/ 下的资源补上 basePath。
 *
 * `next.config.ts` 的 `basePath` 只管框架自己吐出的那些（页面路由、打包后的
 * js/css），像 `useGLTF("/models/x.glb")`、`<img src="/character/x.jpg">` 这种
 * 写死的绝对路径它一概不改。于是根路径部署时好好的，一挂到
 * `/zhuzi-world-v1` 下就全成了 404 —— 十六座建筑与环境一个也载不进来，
 * 场景只能一路退回过程式兜底。
 *
 * 构建时由 `NEXT_PUBLIC_BASE_PATH` 注入（vinext 会把 `NEXT_PUBLIC_*` 内联成
 * 字面量），根路径部署不设此变量即为空串，两种部署共用同一份代码。
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 给 public/ 下的绝对路径补上部署前缀：`asset("/models/a.glb")` */
export function asset(path: string) {
  return `${BASE}${path}`;
}

/**
 * 给 Worker 路由补上部署前缀：`api("/api/chat")`。
 *
 * 与 `asset()` 同一个前缀，分成两个名字是因为来路不同：`asset()` 取的是
 * public/ 下的静态文件（经 frp 走静态口），`api()` 指的是 Worker 的
 * `/api/*`（经 frp 走应用口）。Worker 那端会把前缀剥掉再匹配路由，
 * 见 `worker/index.ts`——两头要一起改，不然一边带前缀一边不认。
 */
export function api(path: string) {
  return `${BASE}${path}`;
}
