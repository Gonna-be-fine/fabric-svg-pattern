export interface JerseyPartConfig {
  id: string;
  name: string;
  ename: string;
  defaultColor: string;
  side: 'front' | 'back' | 'both';
  description: string;
}

export const ColorPrevList: JerseyPartConfig[] = [
  {
    name: '基础色',
    id: 'COLOUR_BASE',
    ename: 'Base Color',
    defaultColor: '#1E293B',
    side: 'front',
    description: '前身主体躯干区域',
  },
  {
    name: '肩部与袖子',
    id: 'COLOUR_SECONDARY',
    ename: 'Shoulder & Sleeves',
    defaultColor: '#3B82F6',
    side: 'front',
    description: '插肩袖及前肩部区域',
  },
  {
    name: '辅助色',
    id: 'COLOUR_PRIMARY',
    ename: 'Accent Color',
    defaultColor: '#EF4444',
    side: 'front',
    description: '侧身拼接饰条及外领包边',
  },
  {
    name: '下摆边色',
    id: 'COLOUR_HEM',
    ename: 'Hem Color',
    defaultColor: '#0F172A',
    side: 'both',
    description: '下摆防滑边条及袖口包边',
  },
  {
    name: '第三颜色',
    id: 'COLOUR_TERTIARY',
    ename: 'Tertiary Color',
    defaultColor: '#F59E0B',
    side: 'front',
    description: '领口V型内衬与前胸装饰块',
  },
  {
    name: '背面基础色',
    id: 'COLOUR_BASE_REVERSE',
    ename: 'Reverse Base Color',
    defaultColor: '#1E293B',
    side: 'back',
    description: '后身主体背板区域',
  },
  {
    name: '背面肩部与袖子',
    id: 'COLOUR_SECONDARY_REVERSE',
    ename: 'Reverse Shoulder & Sleeves',
    defaultColor: '#3B82F6',
    side: 'back',
    description: '后背肩胛与后衣袖',
  },
  {
    name: '背面辅助色',
    id: 'COLOUR_PRIMARY_REVERSE',
    ename: 'Reverse Accent Color',
    defaultColor: '#EF4444',
    side: 'back',
    description: '后身两侧拼接护翼',
  },
];
