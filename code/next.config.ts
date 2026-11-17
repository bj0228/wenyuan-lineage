import type { NextConfig } from "next";

/**
 * 子路径部署用 `NEXT_PUBLIC_BASE_PATH` 一处定调：
 *   NEXT_PUBLIC_BASE_PATH=/zhuzi-world-v1 npm run build
 * 不设则为根路径部署。两处要一致——`basePath` 管框架自己吐的那些
 * （页面路由、打包后的 js/css），`app/world/assetPath.ts` 的 `asset()`
 * 管 public/ 下写死的绝对路径（模型、肖像、解码器、片源），
 * 两者读同一个变量，才不会一边带前缀一边不带。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  // 页面是系统入口，不能让浏览器长期保留一份引用旧目录、旧 bundle 的 HTML。
  // 带内容哈希的 /assets/* 由独立静态服务长期缓存；这里的动态页面始终重新验证。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
