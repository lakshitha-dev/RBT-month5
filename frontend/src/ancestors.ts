// Each article's subject has a 19th-century ancestor: a US patent drawing of the machine that did
// the same job before software did. The fixed stage shows the ancestor of what you are reading.

export type AncestorKey = 'switchboard' | 'telegraph' | 'lock' | 'gauge' | 'railway' | 'crate' | 'press';

export interface Ancestor {
  key: AncestorKey;
  src: string;
  /** what the drawing is, for the caption and alt text */
  name: string;
  year: number;
  /** the group the article is filed under in the contents */
  group: string;
  /** what it stands for on this page */
  role: string;
}

export const ANCESTORS: Record<AncestorKey, Ancestor> = {
  switchboard: { key: 'switchboard', src: '/ancestors/switchboard.jpg', name: 'Clausen’s telephone switchboard plug', year: 1902, group: 'Routing', role: 'routing requests' },
  telegraph: { key: 'telegraph', src: '/ancestors/telegraph.jpg', name: 'Sawyer’s autographic telegraph', year: 1877, group: 'Signals', role: 'messages in real time' },
  lock: { key: 'lock', src: '/ancestors/lock.jpg', name: 'Prützmann’s lever key and lock', year: 1836, group: 'Security', role: 'proving who you are' },
  gauge: { key: 'gauge', src: '/ancestors/gauge.jpg', name: 'Anderson’s steam-pressure gauge', year: 1872, group: 'Measurement', role: 'measuring a running system' },
  railway: { key: 'railway', src: '/ancestors/railway-switch.jpg', name: 'Cram’s railway switch', year: 1871, group: 'Delivery', role: 'branches and merges' },
  crate: { key: 'crate', src: '/ancestors/shipping-crate.jpg', name: 'Wyman’s shipping crate', year: 1911, group: 'Shipping', role: 'packing software to travel' },
  press: { key: 'press', src: '/ancestors/printing-press.jpg', name: 'Venney’s printing press', year: 1907, group: 'Craft', role: 'putting words in front of readers' },
};

// first match wins, so the specific subjects come before the broad ones
const RULES: [RegExp, AncestorKey][] = [
  [/docker|container|kubernetes|image/i, 'crate'],
  [/ci\/cd|github actions|pipeline|\bgit\b|workflow|branch|deploy/i, 'railway'],
  [/jwt|oauth|auth|login|security|password|token|encrypt/i, 'lock'],
  [/websocket|real[- ]?time|async|await|event|stream|queue/i, 'telegraph'],
  [/monitor|metric|perform|postgres|database|index|redis|cach|sql|log/i, 'gauge'],
  [/express|rest|api|graphql|microservice|node|rout|scal|server/i, 'switchboard'],
];

export function ancestorFor(title: string): Ancestor {
  const hit = RULES.find(([re]) => re.test(title));
  return ANCESTORS[hit ? hit[1] : 'press'];
}

export const GROUP_ORDER: AncestorKey[] = ['switchboard', 'telegraph', 'gauge', 'lock', 'railway', 'crate', 'press'];
