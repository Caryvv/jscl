export default defineAppConfig({
  pages: [
    'pages/family/index',
    'pages/tree/index',
    'pages/servant/index',
    'pages/shop/index',
    'pages/add-child/index',
    'pages/member-detail/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFAF5',
    navigationBarTitleText: '家世昌隆',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#9B8B7E',
    selectedColor: '#A0826D',
    backgroundColor: '#FFFAF5',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/tree/index',
        text: '神树',
        iconPath: 'assets/tabbar/tree.svg',
        selectedIconPath: 'assets/tabbar/tree-selected.svg',
      },
      {
        pagePath: 'pages/family/index',
        text: '家族',
        iconPath: 'assets/tabbar/family.svg',
        selectedIconPath: 'assets/tabbar/family-selected.svg',
      },
      {
        pagePath: 'pages/servant/index',
        text: '家丁',
        iconPath: 'assets/tabbar/servant.svg',
        selectedIconPath: 'assets/tabbar/servant-selected.svg',
      },
    ],
  },
});
