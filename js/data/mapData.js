/**
 * Diplomacy Map Data & Definitions
 * Standard 1901 Classic Europe Board
 */

export const POWERS = {
  england: {
    id: 'england',
    name: 'England',
    leader: 'Lord Salisbury',
    title: 'Prime Minister of the United Kingdom',
    color: '#2563eb',
    lightColor: '#60a5fa',
    darkColor: '#1e40af',
    textColor: '#ffffff',
    homeSCs: ['lon', 'lvp', 'edi'],
    flag: '🇬🇧',
    description: 'Maritime empire shielded by the seas. Dominates North Sea and Norwegian Sea.',
    personality: 'Pragmatic naval strategist, cautious about French fleets in the Channel.'
  },
  france: {
    id: 'france',
    name: 'France',
    leader: 'Théophile Delcassé',
    title: 'Minister of Foreign Affairs',
    color: '#0284c7',
    lightColor: '#38bdf8',
    darkColor: '#0369a1',
    textColor: '#ffffff',
    homeSCs: ['par', 'bre', 'mar'],
    flag: '🇫🇷',
    description: 'Central western giant with access to Atlantic, Mediterranean, and German borders.',
    personality: 'Diplomatic balancer, seeks early Iberian expansion and security in Burgundy.'
  },
  germany: {
    id: 'germany',
    name: 'Germany',
    leader: 'Kaiser Wilhelm II',
    title: 'German Emperor',
    color: '#475569',
    lightColor: '#94a3b8',
    darkColor: '#1e293b',
    textColor: '#ffffff',
    homeSCs: ['ber', 'kie', 'mun'],
    flag: '🇩🇪',
    description: 'Central powerhouse surrounded by rivals. Requires strong alliances to avoid two-front war.',
    personality: 'Assertive industrial tactician, aims for Low Countries and Danish straits.'
  },
  italy: {
    id: 'italy',
    name: 'Italy',
    leader: 'Giovanni Giolitti',
    title: 'Prime Minister of Italy',
    color: '#16a34a',
    lightColor: '#4ade80',
    darkColor: '#15803d',
    textColor: '#ffffff',
    homeSCs: ['rom', 'ven', 'nap'],
    flag: '🇮🇹',
    description: 'Peninsular power looking to expand into Tunis, the Mediterranean, or Tyrolia.',
    personality: 'Opportunistic Mediterranean trader, weighs Lepanto against Western advances.'
  },
  austria: {
    id: 'austria',
    name: 'Austria-Hungary',
    leader: 'Emperor Franz Joseph I',
    title: 'Emperor of Austria & King of Hungary',
    color: '#dc2626',
    lightColor: '#f87171',
    darkColor: '#991b1b',
    textColor: '#ffffff',
    homeSCs: ['vie', 'bud', 'tri'],
    flag: '🇦🇹',
    description: 'Volatile central realm bordered by four powers. High early danger, massive Balkan potential.',
    personality: 'Aristocratic survivor, desperately values alliances with Italy or Russia against Turkey.'
  },
  russia: {
    id: 'russia',
    name: 'Russia',
    leader: 'Tsar Nicholas II',
    title: 'Emperor and Autocrat of All the Russias',
    color: '#7c3aed',
    lightColor: '#a78bfa',
    darkColor: '#5b21b6',
    textColor: '#ffffff',
    homeSCs: ['mos', 'war', 'sev', 'stp'],
    flag: '🇷🇺',
    description: 'Expansive empire starting with 4 units across two distinct theaters (North and South).',
    personality: 'Expansive colossus, seeks Balkan influence, Swedish growth, and Black Sea security.'
  },
  turkey: {
    id: 'turkey',
    name: 'Turkey',
    leader: 'Sultan Abdul Hamid II',
    title: 'Sultan of the Ottoman Empire',
    color: '#d97706',
    lightColor: '#fbbf24',
    darkColor: '#b45309',
    textColor: '#ffffff',
    homeSCs: ['con', 'ank', 'smy'],
    flag: '🇹🇷',
    description: 'Corner fortress behind the Bosporus. Hard to breach, slow to start, lethal late game.',
    personality: 'Patient eastern diplomat, seeks Black Sea control and Balkan footholds.'
  }
};

export const INITIAL_UNITS = [
  // England
  { power: 'england', type: 'F', province: 'edi' },
  { power: 'england', type: 'A', province: 'lvp' },
  { power: 'england', type: 'F', province: 'lon' },
  // France
  { power: 'france', type: 'F', province: 'bre' },
  { power: 'france', type: 'A', province: 'par' },
  { power: 'france', type: 'A', province: 'mar' },
  // Germany
  { power: 'germany', type: 'F', province: 'kie' },
  { power: 'germany', type: 'A', province: 'ber' },
  { power: 'germany', type: 'A', province: 'mun' },
  // Italy
  { power: 'italy', type: 'A', province: 'ven' },
  { power: 'italy', type: 'A', province: 'rom' },
  { power: 'italy', type: 'F', province: 'nap' },
  // Austria-Hungary
  { power: 'austria', type: 'A', province: 'vie' },
  { power: 'austria', type: 'A', province: 'bud' },
  { power: 'austria', type: 'F', province: 'tri' },
  // Russia
  { power: 'russia', type: 'A', province: 'mos' },
  { power: 'russia', type: 'A', province: 'war' },
  { power: 'russia', type: 'F', province: 'sev' },
  { power: 'russia', type: 'F', province: 'stp', coast: 'sc' },
  // Turkey
  { power: 'turkey', type: 'A', province: 'con' },
  { power: 'turkey', type: 'F', province: 'ank' },
  { power: 'turkey', type: 'A', province: 'smy' }
];

export const INITIAL_SUPPLY_CENTERS = {
  // England
  lon: 'england', lvp: 'england', edi: 'england',
  // France
  par: 'france', bre: 'france', mar: 'france',
  // Germany
  ber: 'germany', kie: 'germany', mun: 'germany',
  // Italy
  rom: 'italy', ven: 'italy', nap: 'italy',
  // Austria
  vie: 'austria', bud: 'austria', tri: 'austria',
  // Russia
  mos: 'russia', war: 'russia', sev: 'russia', stp: 'russia',
  // Turkey
  con: 'turkey', ank: 'turkey', smy: 'turkey',
  // Neutrals
  bel: null, bul: null, den: null, gre: null, hol: null,
  nwy: null, por: null, rum: null, ser: null, spa: null,
  swe: null, tun: null
};

/**
 * 75 Provinces with canonical adjacencies
 * Army neighbors (land) vs Fleet neighbors (sea/coast)
 */
export const PROVINCES = {
  // --- Sea Provinces ---
  nao: {
    id: 'nao', name: 'North Atlantic Ocean', type: 'sea', isSC: false,
    labelPos: [150, 180],
    seaNeighbors: ['nwg', 'cly', 'lvp', 'iri', 'mao']
  },
  nwg: {
    id: 'nwg', name: 'Norwegian Sea', type: 'sea', isSC: false,
    labelPos: [460, 100],
    seaNeighbors: ['bar', 'nwy', 'nth', 'edi', 'cly', 'nao']
  },
  bar: {
    id: 'bar', name: 'Barents Sea', type: 'sea', isSC: false,
    labelPos: [880, 50],
    seaNeighbors: ['nwg', 'nwy', 'stp/nc']
  },
  nth: {
    id: 'nth', name: 'North Sea', type: 'sea', isSC: false,
    labelPos: [460, 340],
    seaNeighbors: ['nwg', 'nwy', 'ska', 'den', 'hel', 'hol', 'bel', 'eng', 'lon', 'yor', 'edi']
  },
  ska: {
    id: 'ska', name: 'Skagerrak', type: 'sea', isSC: false,
    labelPos: [565, 335],
    seaNeighbors: ['nth', 'nwy', 'swe', 'den']
  },
  bal: {
    id: 'bal', name: 'Baltic Sea', type: 'sea', isSC: false,
    labelPos: [665, 415],
    seaNeighbors: ['den', 'swe', 'bot', 'lvn', 'pru', 'ber', 'kie']
  },
  bot: {
    id: 'bot', name: 'Gulf of Bothnia', type: 'sea', isSC: false,
    labelPos: [730, 240],
    seaNeighbors: ['swe', 'fin', 'stp/sc', 'lvn', 'bal']
  },
  hel: {
    id: 'hel', name: 'Helgoland Bight', type: 'sea', isSC: false,
    labelPos: [505, 400],
    seaNeighbors: ['nth', 'den', 'kie', 'hol']
  },
  eng: {
    id: 'eng', name: 'English Channel', type: 'sea', isSC: false,
    labelPos: [320, 480],
    seaNeighbors: ['iri', 'wal', 'lon', 'nth', 'bel', 'pic', 'bre', 'mao']
  },
  iri: {
    id: 'iri', name: 'Irish Sea', type: 'sea', isSC: false,
    labelPos: [230, 430],
    seaNeighbors: ['nao', 'lvp', 'wal', 'eng', 'mao']
  },
  mao: {
    id: 'mao', name: 'Mid-Atlantic Ocean', type: 'sea', isSC: false,
    labelPos: [110, 560],
    seaNeighbors: ['nao', 'iri', 'eng', 'bre', 'gas', 'spa/nc', 'spa/sc', 'por', 'wes', 'naf']
  },
  wes: {
    id: 'wes', name: 'Western Mediterranean', type: 'sea', isSC: false,
    labelPos: [370, 780],
    seaNeighbors: ['mao', 'spa/sc', 'lyo', 'tys', 'tun', 'naf']
  },
  lyo: {
    id: 'lyo', name: 'Gulf of Lyon', type: 'sea', isSC: false,
    labelPos: [430, 690],
    seaNeighbors: ['spa/sc', 'mar', 'pie', 'tys', 'wes']
  },
  tys: {
    id: 'tys', name: 'Tyrrhenian Sea', type: 'sea', isSC: false,
    labelPos: [565, 760],
    seaNeighbors: ['lyo', 'tus', 'rom', 'nap', 'ion', 'tun', 'wes']
  },
  adr: {
    id: 'adr', name: 'Adriatic Sea', type: 'sea', isSC: false,
    labelPos: [665, 680],
    seaNeighbors: ['ven', 'tri', 'alb', 'ion', 'apu']
  },
  ion: {
    id: 'ion', name: 'Ionian Sea', type: 'sea', isSC: false,
    labelPos: [700, 840],
    seaNeighbors: ['tys', 'nap', 'apu', 'adr', 'alb', 'gre', 'aeg', 'eas', 'tun']
  },
  aeg: {
    id: 'aeg', name: 'Aegean Sea', type: 'sea', isSC: false,
    labelPos: [850, 800],
    seaNeighbors: ['gre', 'bul/sc', 'con', 'smy', 'eas', 'ion']
  },
  eas: {
    id: 'eas', name: 'Eastern Mediterranean', type: 'sea', isSC: false,
    labelPos: [960, 890],
    seaNeighbors: ['ion', 'aeg', 'smy', 'syr']
  },
  bla: {
    id: 'bla', name: 'Black Sea', type: 'sea', isSC: false,
    labelPos: [990, 630],
    seaNeighbors: ['sev', 'arm', 'ank', 'con', 'bul/ec', 'rum']
  },

  // --- British Isles ---
  cly: {
    id: 'cly', name: 'Clyde', type: 'coast', isSC: false,
    labelPos: [320, 240],
    landNeighbors: ['edi', 'lvp'],
    seaNeighbors: ['nao', 'nwg', 'edi', 'lvp']
  },
  edi: {
    id: 'edi', name: 'Edinburgh', type: 'coast', isSC: true, home: 'england',
    labelPos: [360, 260],
    landNeighbors: ['cly', 'lvp', 'yor'],
    seaNeighbors: ['nwg', 'nth', 'cly', 'yor']
  },
  lvp: {
    id: 'lvp', name: 'Liverpool', type: 'coast', isSC: true, home: 'england',
    labelPos: [325, 340],
    landNeighbors: ['cly', 'edi', 'yor', 'wal'],
    seaNeighbors: ['nao', 'iri', 'cly', 'wal']
  },
  yor: {
    id: 'yor', name: 'Yorkshire', type: 'coast', isSC: false,
    labelPos: [375, 345],
    landNeighbors: ['edi', 'lvp', 'wal', 'lon'],
    seaNeighbors: ['nth', 'edi', 'lon']
  },
  wal: {
    id: 'wal', name: 'Wales', type: 'coast', isSC: false,
    labelPos: [305, 410],
    landNeighbors: ['lvp', 'yor', 'lon'],
    seaNeighbors: ['iri', 'eng', 'lvp', 'lon']
  },
  lon: {
    id: 'lon', name: 'London', type: 'coast', isSC: true, home: 'england',
    labelPos: [370, 420],
    landNeighbors: ['wal', 'yor'],
    seaNeighbors: ['nth', 'eng', 'yor', 'wal']
  },

  // --- Western Europe / France ---
  bre: {
    id: 'bre', name: 'Brest', type: 'coast', isSC: true, home: 'france',
    labelPos: [290, 540],
    landNeighbors: ['pic', 'par', 'gas'],
    seaNeighbors: ['eng', 'mao', 'pic', 'gas']
  },
  pic: {
    id: 'pic', name: 'Picardy', type: 'coast', isSC: false,
    labelPos: [395, 490],
    landNeighbors: ['bre', 'par', 'bur', 'bel'],
    seaNeighbors: ['eng', 'bre', 'bel']
  },
  par: {
    id: 'par', name: 'Paris', type: 'land', isSC: true, home: 'france',
    labelPos: [380, 560],
    landNeighbors: ['bre', 'pic', 'bur', 'gas'],
    seaNeighbors: []
  },
  bur: {
    id: 'bur', name: 'Burgundy', type: 'land', isSC: false,
    labelPos: [450, 570],
    landNeighbors: ['par', 'pic', 'bel', 'ruh', 'mun', 'mar', 'gas'],
    seaNeighbors: []
  },
  gas: {
    id: 'gas', name: 'Gascony', type: 'coast', isSC: false,
    labelPos: [340, 640],
    landNeighbors: ['bre', 'par', 'bur', 'mar', 'spa'],
    seaNeighbors: ['mao', 'bre', 'spa/nc']
  },
  mar: {
    id: 'mar', name: 'Marseilles', type: 'coast', isSC: true, home: 'france',
    labelPos: [440, 650],
    landNeighbors: ['gas', 'bur', 'pie', 'spa'],
    seaNeighbors: ['lyo', 'spa/sc', 'pie']
  },

  // --- Iberian Peninsula ---
  por: {
    id: 'por', name: 'Portugal', type: 'coast', isSC: true, home: null,
    labelPos: [150, 680],
    landNeighbors: ['spa'],
    seaNeighbors: ['mao', 'spa/nc', 'spa/sc']
  },
  spa: {
    id: 'spa', name: 'Spain', type: 'split_coast', isSC: true, home: null,
    labelPos: [250, 710],
    landNeighbors: ['por', 'gas', 'mar'],
    coasts: {
      nc: {
        name: 'Spain (North Coast)',
        seaNeighbors: ['mao', 'gas', 'por']
      },
      sc: {
        name: 'Spain (South Coast)',
        seaNeighbors: ['mao', 'wes', 'lyo', 'mar', 'por']
      }
    }
  },

  // --- Low Countries & Germany ---
  bel: {
    id: 'bel', name: 'Belgium', type: 'coast', isSC: true, home: null,
    labelPos: [435, 495],
    landNeighbors: ['pic', 'bur', 'ruh', 'hol'],
    seaNeighbors: ['eng', 'nth', 'pic', 'hol']
  },
  hol: {
    id: 'hol', name: 'Holland', type: 'coast', isSC: true, home: null,
    labelPos: [475, 465],
    landNeighbors: ['bel', 'ruh', 'kie'],
    seaNeighbors: ['nth', 'hel', 'bel', 'kie']
  },
  ruh: {
    id: 'ruh', name: 'Ruhr', type: 'land', isSC: false,
    labelPos: [490, 520],
    landNeighbors: ['bel', 'hol', 'kie', 'mun', 'bur'],
    seaNeighbors: []
  },
  kie: {
    id: 'kie', name: 'Kiel', type: 'coast', isSC: true, home: 'germany',
    labelPos: [535, 465],
    landNeighbors: ['hol', 'ruh', 'mun', 'ber', 'den'],
    seaNeighbors: ['hel', 'bal', 'den', 'hol', 'ber']
  },
  ber: {
    id: 'ber', name: 'Berlin', type: 'coast', isSC: true, home: 'germany',
    labelPos: [610, 470],
    landNeighbors: ['kie', 'mun', 'sil', 'pru'],
    seaNeighbors: ['bal', 'kie', 'pru']
  },
  pru: {
    id: 'pru', name: 'Prussia', type: 'coast', isSC: false,
    labelPos: [690, 465],
    landNeighbors: ['ber', 'sil', 'war', 'lvn'],
    seaNeighbors: ['bal', 'ber', 'lvn']
  },
  sil: {
    id: 'sil', name: 'Silesia', type: 'land', isSC: false,
    labelPos: [645, 525],
    landNeighbors: ['ber', 'mun', 'boh', 'gal', 'war', 'pru'],
    seaNeighbors: []
  },
  mun: {
    id: 'mun', name: 'Munich', type: 'land', isSC: true, home: 'germany',
    labelPos: [540, 560],
    landNeighbors: ['ruh', 'kie', 'ber', 'sil', 'boh', 'tyr', 'bur'],
    seaNeighbors: []
  },

  // --- Scandinavia ---
  den: {
    id: 'den', name: 'Denmark', type: 'coast', isSC: true, home: null,
    labelPos: [545, 385],
    landNeighbors: ['kie', 'swe'],
    seaNeighbors: ['nth', 'ska', 'bal', 'hel', 'kie', 'swe']
  },
  swe: {
    id: 'swe', name: 'Sweden', type: 'coast', isSC: true, home: null,
    labelPos: [650, 280],
    landNeighbors: ['den', 'nwy', 'fin'],
    seaNeighbors: ['ska', 'bal', 'bot', 'den', 'nwy', 'fin']
  },
  nwy: {
    id: 'nwy', name: 'Norway', type: 'coast', isSC: true, home: null,
    labelPos: [570, 220],
    landNeighbors: ['swe', 'fin', 'stp'],
    seaNeighbors: ['nwg', 'bar', 'nth', 'ska', 'swe', 'stp/nc']
  },
  fin: {
    id: 'fin', name: 'Finland', type: 'coast', isSC: false,
    labelPos: [780, 200],
    landNeighbors: ['swe', 'nwy', 'stp'],
    seaNeighbors: ['bot', 'swe', 'stp/sc']
  },

  // --- Russia & Eastern Europe ---
  stp: {
    id: 'stp', name: 'St. Petersburg', type: 'split_coast', isSC: true, home: 'russia',
    labelPos: [900, 220],
    landNeighbors: ['fin', 'nwy', 'mos', 'lvn'],
    coasts: {
      nc: {
        name: 'St. Petersburg (North Coast)',
        seaNeighbors: ['bar', 'nwy']
      },
      sc: {
        name: 'St. Petersburg (South Coast)',
        seaNeighbors: ['bot', 'fin', 'lvn']
      }
    }
  },
  mos: {
    id: 'mos', name: 'Moscow', type: 'land', isSC: true, home: 'russia',
    labelPos: [1020, 340],
    landNeighbors: ['stp', 'sev', 'war', 'lvn', 'ukr'],
    seaNeighbors: []
  },
  war: {
    id: 'war', name: 'Warsaw', type: 'land', isSC: true, home: 'russia',
    labelPos: [730, 520],
    landNeighbors: ['pru', 'sil', 'gal', 'ukr', 'mos', 'lvn'],
    seaNeighbors: []
  },
  lvn: {
    id: 'lvn', name: 'Livonia', type: 'coast', isSC: false,
    labelPos: [780, 390],
    landNeighbors: ['pru', 'war', 'mos', 'stp'],
    seaNeighbors: ['bal', 'bot', 'pru', 'stp/sc']
  },
  ukr: {
    id: 'ukr', name: 'Ukraine', type: 'land', isSC: false,
    labelPos: [870, 540],
    landNeighbors: ['war', 'mos', 'sev', 'rum', 'gal'],
    seaNeighbors: []
  },
  sev: {
    id: 'sev', name: 'Sevastopol', type: 'coast', isSC: true, home: 'russia',
    labelPos: [1020, 550],
    landNeighbors: ['ukr', 'mos', 'arm', 'rum'],
    seaNeighbors: ['bla', 'rum', 'arm']
  },
  arm: {
    id: 'arm', name: 'Armenia', type: 'coast', isSC: false,
    labelPos: [1150, 710],
    landNeighbors: ['sev', 'syr', 'smy', 'ank'],
    seaNeighbors: ['bla', 'sev', 'ank']
  },
  syr: {
    id: 'syr', name: 'Syria', type: 'coast', isSC: false,
    labelPos: [1150, 830],
    landNeighbors: ['arm', 'smy'],
    seaNeighbors: ['eas', 'smy']
  },

  // --- Ottoman Empire / Turkey ---
  con: {
    id: 'con', name: 'Constantinople', type: 'coast', isSC: true, home: 'turkey',
    labelPos: [930, 740],
    landNeighbors: ['bul', 'ank', 'smy'],
    seaNeighbors: ['bla', 'aeg', 'bul/ec', 'bul/sc', 'ank', 'smy']
  },
  ank: {
    id: 'ank', name: 'Ankara', type: 'coast', isSC: true, home: 'turkey',
    labelPos: [1050, 720],
    landNeighbors: ['con', 'smy', 'arm'],
    seaNeighbors: ['bla', 'con', 'arm']
  },
  smy: {
    id: 'smy', name: 'Smyrna', type: 'coast', isSC: true, home: 'turkey',
    labelPos: [990, 800],
    landNeighbors: ['con', 'ank', 'arm', 'syr'],
    seaNeighbors: ['aeg', 'eas', 'con', 'syr']
  },

  // --- Balkans ---
  bul: {
    id: 'bul', name: 'Bulgaria', type: 'split_coast', isSC: true, home: null,
    labelPos: [860, 690],
    landNeighbors: ['rum', 'ser', 'gre', 'con'],
    coasts: {
      ec: {
        name: 'Bulgaria (East Coast)',
        seaNeighbors: ['bla', 'rum', 'con']
      },
      sc: {
        name: 'Bulgaria (South Coast)',
        seaNeighbors: ['aeg', 'gre', 'con']
      }
    }
  },
  rum: {
    id: 'rum', name: 'Rumania', type: 'coast', isSC: true, home: null,
    labelPos: [860, 620],
    landNeighbors: ['ukr', 'sev', 'bul', 'ser', 'bud', 'gal'],
    seaNeighbors: ['bla', 'sev', 'bul/ec']
  },
  ser: {
    id: 'ser', name: 'Serbia', type: 'land', isSC: true, home: null,
    labelPos: [770, 690],
    landNeighbors: ['bud', 'rum', 'bul', 'gre', 'alb', 'tri'],
    seaNeighbors: []
  },
  gre: {
    id: 'gre', name: 'Greece', type: 'coast', isSC: true, home: null,
    labelPos: [790, 785],
    landNeighbors: ['alb', 'ser', 'bul'],
    seaNeighbors: ['ion', 'aeg', 'alb', 'bul/sc']
  },
  alb: {
    id: 'alb', name: 'Albania', type: 'coast', isSC: false,
    labelPos: [735, 730],
    landNeighbors: ['tri', 'ser', 'gre'],
    seaNeighbors: ['adr', 'ion', 'tri', 'gre']
  },

  // --- Central Europe / Austria-Hungary ---
  boh: {
    id: 'boh', name: 'Bohemia', type: 'land', isSC: false,
    labelPos: [610, 580],
    landNeighbors: ['mun', 'sil', 'gal', 'vie', 'tyr'],
    seaNeighbors: []
  },
  tyr: {
    id: 'tyr', name: 'Tyrolia', type: 'land', isSC: false,
    labelPos: [580, 630],
    landNeighbors: ['mun', 'boh', 'vie', 'tri', 'ven', 'pie'],
    seaNeighbors: []
  },
  gal: {
    id: 'gal', name: 'Galicia', type: 'land', isSC: false,
    labelPos: [760, 580],
    landNeighbors: ['sil', 'war', 'ukr', 'rum', 'bud', 'vie', 'boh'],
    seaNeighbors: []
  },
  vie: {
    id: 'vie', name: 'Vienna', type: 'land', isSC: true, home: 'austria',
    labelPos: [660, 605],
    landNeighbors: ['boh', 'gal', 'bud', 'tri', 'tyr'],
    seaNeighbors: []
  },
  bud: {
    id: 'bud', name: 'Budapest', type: 'land', isSC: true, home: 'austria',
    labelPos: [740, 635],
    landNeighbors: ['vie', 'gal', 'rum', 'ser', 'tri'],
    seaNeighbors: []
  },
  tri: {
    id: 'tri', name: 'Trieste', type: 'coast', isSC: true, home: 'austria',
    labelPos: [665, 650],
    landNeighbors: ['tyr', 'vie', 'bud', 'ser', 'alb', 'ven'],
    seaNeighbors: ['adr', 'ven', 'alb']
  },

  // --- Italy ---
  ven: {
    id: 'ven', name: 'Venice', type: 'coast', isSC: true, home: 'italy',
    labelPos: [580, 675],
    landNeighbors: ['pie', 'tyr', 'tri', 'apu', 'tus'],
    seaNeighbors: ['adr', 'tri', 'apu']
  },
  pie: {
    id: 'pie', name: 'Piedmont', type: 'coast', isSC: false,
    labelPos: [500, 655],
    landNeighbors: ['mar', 'tyr', 'ven', 'tus'],
    seaNeighbors: ['lyo', 'mar', 'tus']
  },
  tus: {
    id: 'tus', name: 'Tuscany', type: 'coast', isSC: false,
    labelPos: [545, 700],
    landNeighbors: ['pie', 'ven', 'rom'],
    seaNeighbors: ['lyo', 'tys', 'pie', 'rom']
  },
  rom: {
    id: 'rom', name: 'Rome', type: 'coast', isSC: true, home: 'italy',
    labelPos: [585, 730],
    landNeighbors: ['tus', 'ven', 'nap', 'apu'],
    seaNeighbors: ['tys', 'tus', 'nap']
  },
  nap: {
    id: 'nap', name: 'Naples', type: 'coast', isSC: true, home: 'italy',
    labelPos: [650, 775],
    landNeighbors: ['rom', 'apu'],
    seaNeighbors: ['tys', 'ion', 'rom', 'apu']
  },
  apu: {
    id: 'apu', name: 'Apulia', type: 'coast', isSC: false,
    labelPos: [655, 735],
    landNeighbors: ['ven', 'rom', 'nap'],
    seaNeighbors: ['adr', 'ion', 'ven', 'nap']
  },

  // --- North Africa ---
  tun: {
    id: 'tun', name: 'Tunis', type: 'coast', isSC: true, home: null,
    labelPos: [480, 860],
    landNeighbors: ['naf'],
    seaNeighbors: ['wes', 'tys', 'ion', 'naf']
  },
  naf: {
    id: 'naf', name: 'North Africa', type: 'coast', isSC: false,
    labelPos: [280, 890],
    landNeighbors: ['tun'],
    seaNeighbors: ['mao', 'wes', 'tun']
  }
};

/**
 * Helper to check adjacency between two locations
 * Supports split coasts (e.g., 'spa/nc', 'stp/sc')
 */
export function canMove(unitType, fromProv, fromCoast, toProv, toCoast) {
  const source = PROVINCES[fromProv];
  const dest = PROVINCES[toProv];
  if (!source || !dest) return false;

  if (unitType === 'A') {
    // Armies can only move to land or coast provinces (not pure sea)
    if (dest.type === 'sea') return false;
    return source.landNeighbors && source.landNeighbors.includes(toProv);
  }

  if (unitType === 'F') {
    // Fleets can move to sea, coast, or split coasts
    // Source sea neighbors:
    let validDestinations = [];
    if (source.type === 'split_coast' && fromCoast && source.coasts[fromCoast]) {
      validDestinations = source.coasts[fromCoast].seaNeighbors;
    } else {
      validDestinations = source.seaNeighbors || [];
    }

    // Check direct match or coast match
    const targetKey = toCoast ? `${toProv}/${toCoast}` : toProv;
    if (validDestinations.includes(targetKey)) return true;
    if (validDestinations.includes(toProv)) return true;

    // Check if dest has split coasts and our validDestinations includes any of them
    if (dest.type === 'split_coast') {
      if (toCoast) {
        return validDestinations.includes(`${toProv}/${toCoast}`);
      }
      return Object.keys(dest.coasts).some(c => validDestinations.includes(`${toProv}/${c}`));
    }
  }

  return false;
}

/**
 * Determine valid retreat destinations for a dislodged unit
 */
export function getValidRetreats(dislodgedUnit, attackersProvince, gameState) {
  const prov = PROVINCES[dislodgedUnit.province];
  if (!prov) return [];

  const candidates = [];
  const occupiedProvinces = new Set(gameState.units.map(u => u.province));

  // Determine potential provinces based on unit type
  let neighbors = [];
  if (dislodgedUnit.type === 'A') {
    neighbors = prov.landNeighbors || [];
  } else {
    if (prov.type === 'split_coast' && dislodgedUnit.coast && prov.coasts[dislodgedUnit.coast]) {
      neighbors = prov.coasts[dislodgedUnit.coast].seaNeighbors;
    } else {
      neighbors = prov.seaNeighbors || [];
    }
  }

  neighbors.forEach(neighborKey => {
    let nProv = neighborKey;
    let nCoast = null;
    if (neighborKey.includes('/')) {
      [nProv, nCoast] = neighborKey.split('/');
    }

    // Cannot retreat to where attacker came from
    if (nProv === attackersProvince) return;
    // Cannot retreat to occupied province
    if (occupiedProvinces.has(nProv)) return;
    // Cannot retreat to a province where a standoff occurred this turn
    if (gameState.standoffs && gameState.standoffs.includes(nProv)) return;

    candidates.push({ province: nProv, coast: nCoast });
  });

  return candidates;
}
