import { defineConfig, DefaultTheme } from 'vitepress';
import { SearchPlugin } from 'vitepress-plugin-search';
import { VitePWA } from 'vite-plugin-pwa';
import Segment from 'segment';

type Articles = DefaultTheme.NavItem & DefaultTheme.SidebarItem;

const articles: Articles[] = [
  // { text: 'AddreeForm', link: '/address-form/',
  // collapsed: true,
  // },
  {
    text: 'TypeScript',
    // collapsed: true,
    items: [
      { text: 'TypeScript重载函数的参数和返回值类型', link: '/typescript/overload-function-types' },
      { text: 'TypeScript Utility类型大全', link: '/typescript/utility-types' },
      {
        text: '版本发布 - TypeScript 5.2',
        collapsed: true,
        items: [
          { text: 'TypeScript 5.2 Beta', link: '/typescript/release/5-2' },
          { text: 'TypeScript 5.1', link: '/typescript/release/5-1' },
          { text: 'TypeScript 5.0', link: '/typescript/release/5-0' },
        ],
      },
      // { text: 'TypeScript Compiler API', link: '/typescript/compiler-api' },
      // { text: '类型运算的lodash库 - type-fest', link: '/typescript/type-fest' },
    ],
  },
  {
    text: 'JavaScript',
    // collapsed: true,
    items: [
      { text: 'JavaScript metaprogramming', link: '/javascript/metaprogramming' },
      { text: 'Promise的使用技巧', link: '/javascript/promise-tips' },
    ],
  },
  // {
  // text: 'Rust',
  // collapsed: true,
  // items: [
  // { text: '基于Neovim搭建Rust开发环境2023版', link: '/rust/ide' },
  // ]
  // },
];

//default options
const segment = new Segment();
segment.useDefault();

const options = {
  previewLength: 62,
  buttonLabel: 'Search',
  placeholder: 'Search docs',
  allow: [],
  ignore: [],
  // encode: false,
  // tokenize: 'full' as 'full',
  encode: str => segment.doSegment(str, { simple: true }),
  tokenize: 'forward' as 'forward',
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Web3c',
  description: "Phoenix's Blog",
  base: '/',
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: 'Home', link: '/' }, ...articles],
    lastUpdatedText: 'Last updated',
    sidebar: [...articles],
    socialLinks: [{ icon: 'github', link: 'https://github.com/xusiyuan841028' }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Phoenix Tsui',
    },
  },
  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true,

    // adjust how header anchors are generated,
    // useful for integrating with tools that use different conventions
    anchor: {
      slugify(str) {
        return encodeURIComponent(str);
      },
    },
  },
  vite: {
    plugins: [SearchPlugin(options), VitePWA()],
  },
});
