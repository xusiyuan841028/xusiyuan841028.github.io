import { defineConfig, DefaultTheme } from 'vitepress'
import { SearchPlugin } from 'vitepress-plugin-search';

type Articles = DefaultTheme.NavItem & DefaultTheme.SidebarItem;

const articles: Articles[] = [
  { text: 'TypeScript',
    collapsed: true,
    items: [
      { text: 'Utility类型', link: '/typescript/utility-types' },
      { text: '重载函数的类型', link: '/typescript/overload-function-types' },
    ]
  },
  {
    text: 'JavaScript',
    collapsed: true,
    items: [
      { text: 'Promise的使用技巧', link: '/javascript/promise-tips' },
    ]
  },
];

//default options
const options = {
  previewLength: 62,
  buttonLabel: "Search",
  placeholder: "Search docs",
  allow: [],
  ignore: [],
  encode: false,
  tokenize: 'full' as 'full'
};


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Web3c",
  description: "Phoenix's Blog",
  base: '/',
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      ...articles,
    ],
    lastUpdatedText: 'Last updated',
    sidebar: [...articles],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xusiyuan841028' },
    ],
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
        return encodeURIComponent(str)
      }
    },
  },
  vite: { 
    plugins: [
      SearchPlugin(options),
    ],
  },
});
