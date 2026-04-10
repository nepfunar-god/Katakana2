export type KanaItem = {
  id: string;
  c: string;
  r: string;
  empty?: boolean;
  m?: string;
  n?: string;
};

export const RAW_DATA: Record<string, KanaItem[]> = {
  basic: [
    {id:'a',c:'ア',r:'a'}, {id:'i',c:'イ',r:'i'}, {id:'u',c:'ウ',r:'u'}, {id:'e',c:'エ',r:'e'}, {id:'o',c:'オ',r:'o'},
    {id:'ka',c:'カ',r:'ka'}, {id:'ki',c:'キ',r:'ki'}, {id:'ku',c:'ク',r:'ku'}, {id:'ke',c:'ケ',r:'ke'}, {id:'ko',c:'コ',r:'ko'},
    {id:'sa',c:'サ',r:'sa'}, {id:'shi',c:'シ',r:'shi'}, {id:'su',c:'ス',r:'su'}, {id:'se',c:'セ',r:'se'}, {id:'so',c:'ソ',r:'so'},
    {id:'ta',c:'タ',r:'ta'}, {id:'chi',c:'チ',r:'chi'}, {id:'tsu',c:'ツ',r:'tsu'}, {id:'te',c:'テ',r:'te'}, {id:'to',c:'ト',r:'to'},
    {id:'na',c:'ナ',r:'na'}, {id:'ni',c:'ニ',r:'ni'}, {id:'nu',c:'ヌ',r:'nu'}, {id:'ne',c:'ネ',r:'ne'}, {id:'no',c:'ノ',r:'no'},
    {id:'ha',c:'ハ',r:'ha'}, {id:'hi',c:'ヒ',r:'hi'}, {id:'fu',c:'フ',r:'fu'}, {id:'he',c:'ヘ',r:'he'}, {id:'ho',c:'ホ',r:'ho'},
    {id:'ma',c:'マ',r:'ma'}, {id:'mi',c:'ミ',r:'mi'}, {id:'mu',c:'ム',r:'mu'}, {id:'me',c:'メ',r:'me'}, {id:'mo',c:'モ',r:'mo'},
    {id:'ya',c:'ヤ',r:'ya'}, {id:'empty_yi',c:'',r:'',empty:true}, {id:'yu',c:'ユ',r:'yu'}, {id:'empty_ye',c:'',r:'',empty:true}, {id:'yo',c:'ヨ',r:'yo'},
    {id:'ra',c:'ラ',r:'ra'}, {id:'ri',c:'リ',r:'ri'}, {id:'ru',c:'ル',r:'ru'}, {id:'re',c:'レ',r:'re'}, {id:'ro',c:'ロ',r:'ro'},
    {id:'wa',c:'ワ',r:'wa'}, {id:'empty_wi',c:'',r:'',empty:true}, {id:'wo',c:'ヲ',r:'o'}, {id:'empty_we',c:'',r:'',empty:true}, {id:'n',c:'ン',r:'n'}
  ],
  dakuten: [
    {id:'ga',c:'ガ',r:'ga'}, {id:'gi',c:'ギ',r:'gi'}, {id:'gu',c:'グ',r:'gu'}, {id:'ge',c:'ゲ',r:'ge'}, {id:'go',c:'ゴ',r:'go'},
    {id:'za',c:'ザ',r:'za'}, {id:'ji',c:'ジ',r:'ji'}, {id:'zu',c:'ズ',r:'zu'}, {id:'ze',c:'ゼ',r:'ze'}, {id:'zo',c:'ゾ',r:'zo'},
    {id:'da',c:'ダ',r:'da'}, {id:'dji',c:'ヂ',r:'ji'}, {id:'dzu',c:'ヅ',r:'zu'}, {id:'de',c:'デ',r:'de'}, {id:'do',c:'ド',r:'do'},
    {id:'ba',c:'バ',r:'ba'}, {id:'bi',c:'ビ',r:'bi'}, {id:'bu',c:'ブ',r:'bu'}, {id:'be',c:'ベ',r:'be'}, {id:'bo',c:'ボ',r:'bo'}
  ],
  handakuten: [
    {id:'pa',c:'パ',r:'pa'}, {id:'pi',c:'ピ',r:'pi'}, {id:'pu',c:'プ',r:'pu'}, {id:'pe',c:'ペ',r:'pe'}, {id:'po',c:'ポ',r:'po'}
  ],
  h_basic: [
    {id:'h_a',c:'あ',r:'a'}, {id:'h_i',c:'い',r:'i'}, {id:'h_u',c:'う',r:'u'}, {id:'h_e',c:'え',r:'e'}, {id:'h_o',c:'お',r:'o'},
    {id:'h_ka',c:'か',r:'ka'}, {id:'h_ki',c:'き',r:'ki'}, {id:'h_ku',c:'く',r:'ku'}, {id:'h_ke',c:'け',r:'ke'}, {id:'h_ko',c:'こ',r:'ko'},
    {id:'h_sa',c:'さ',r:'sa'}, {id:'h_shi',c:'し',r:'shi'}, {id:'h_su',c:'す',r:'su'}, {id:'h_se',c:'せ',r:'se'}, {id:'h_so',c:'そ',r:'so'},
    {id:'h_ta',c:'た',r:'ta'}, {id:'h_chi',c:'ち',r:'chi'}, {id:'h_tsu',c:'つ',r:'tsu'}, {id:'h_te',c:'て',r:'te'}, {id:'h_to',c:'と',r:'to'},
    {id:'h_na',c:'な',r:'na'}, {id:'h_ni',c:'に',r:'ni'}, {id:'h_nu',c:'ぬ',r:'nu'}, {id:'h_ne',c:'ね',r:'ne'}, {id:'h_no',c:'の',r:'no'},
    {id:'h_ha',c:'は',r:'ha'}, {id:'h_hi',c:'ひ',r:'hi'}, {id:'h_fu',c:'ふ',r:'fu'}, {id:'h_he',c:'へ',r:'he'}, {id:'h_ho',c:'ほ',r:'ho'},
    {id:'h_ma',c:'ま',r:'ma'}, {id:'h_mi',c:'み',r:'mi'}, {id:'h_mu',c:'む',r:'mu'}, {id:'h_me',c:'め',r:'me'}, {id:'h_mo',c:'も',r:'mo'},
    {id:'h_ya',c:'や',r:'ya'}, {id:'h_empty_yi',c:'',r:'',empty:true}, {id:'h_yu',c:'ゆ',r:'yu'}, {id:'h_empty_ye',c:'',r:'',empty:true}, {id:'h_yo',c:'よ',r:'yo'},
    {id:'h_ra',c:'ら',r:'ra'}, {id:'h_ri',c:'り',r:'ri'}, {id:'h_ru',c:'る',r:'ru'}, {id:'h_re',c:'れ',r:'re'}, {id:'h_ro',c:'ろ',r:'ro'},
    {id:'h_wa',c:'わ',r:'wa'}, {id:'h_empty_wi',c:'',r:'',empty:true}, {id:'h_wo',c:'を',r:'o'}, {id:'h_empty_we',c:'',r:'',empty:true}, {id:'h_n',c:'ん',r:'n'}
  ],
  h_dakuten: [
    {id:'h_ga',c:'が',r:'ga'}, {id:'h_gi',c:'ぎ',r:'gi'}, {id:'h_gu',c:'ぐ',r:'gu'}, {id:'h_ge',c:'げ',r:'ge'}, {id:'h_go',c:'ご',r:'go'},
    {id:'h_za',c:'ざ',r:'za'}, {id:'h_ji',c:'じ',r:'ji'}, {id:'h_zu',c:'ず',r:'zu'}, {id:'h_ze',c:'ぜ',r:'ze'}, {id:'h_zo',c:'ぞ',r:'zo'},
    {id:'h_da',c:'だ',r:'da'}, {id:'h_dji',c:'ぢ',r:'ji'}, {id:'h_dzu',c:'づ',r:'zu'}, {id:'h_de',c:'で',r:'de'}, {id:'h_do',c:'ど',r:'do'},
    {id:'h_ba',c:'ば',r:'ba'}, {id:'h_bi',c:'び',r:'bi'}, {id:'h_bu',c:'ぶ',r:'bu'}, {id:'h_be',c:'べ',r:'be'}, {id:'h_bo',c:'ぼ',r:'bo'}
  ],
  h_handakuten: [
    {id:'h_pa',c:'ぱ',r:'pa'}, {id:'h_pi',c:'ぴ',r:'pi'}, {id:'h_pu',c:'ぷ',r:'pu'}, {id:'h_pe',c:'ぺ',r:'pe'}, {id:'h_po',c:'ぽ',r:'po'}
  ],
  words: [
    {id:'w1',c:'カメラ',r:'kamera',m:'Camera',n:'क्यामेरा'}, {id:'w2',c:'ホテル',r:'hoteru',m:'Hotel',n:'होटल'},
    {id:'w3',c:'タクシー',r:'takushii',m:'Taxi',n:'ट्याक्सी'}, {id:'w4',c:'バス',r:'basu',m:'Bus',n:'बस'},
    {id:'w5',c:'トイレ',r:'toire',m:'Toilet',n:'शौचालय'}, {id:'w6',c:'テレビ',r:'terebi',m:'TV',n:'टिभी'},
    {id:'w7',c:'バナナ',r:'banana',m:'Banana',n:'केरा'}, {id:'w8',c:'コーヒー',r:'koohii',m:'Coffee',n:'कफी'},
    {id:'w9',c:'アイス',r:'aisu',m:'Ice Cream',n:'आइसक्रिम'}, {id:'w10',c:'コンピュータ',r:'konpyuuta',m:'Computer',n:'कम्प्युटर'},
    {id:'w11',c:'インターネット',r:'intaanetto',m:'Internet',n:'इन्टरनेट'}, {id:'w12',c:'サッカー',r:'sakkaa',m:'Soccer',n:'फुटबल'},
    {id:'w13',c:'レストラン',r:'resutoran',m:'Restaurant',n:'रेस्टुरेन्ट'}, {id:'w14',c:'コンビニ',r:'konbini',m:'Convenience Store',n:'सुविधा स्टोर'},
    {id:'w15',c:'クリスマス',r:'kurisumasu',m:'Christmas',n:'क्रिसमस'}, {id:'w16',c:'ハンバーガー',r:'hanbaagaa',m:'Hamburger',n:'ह्यामबर्गर'},
    {id:'w17',c:'スマホ',r:'sumaho',m:'Smartphone',n:'स्मार्टफोन'}, {id:'w18',c:'アニメ',r:'anime',m:'Anime',n:'एनिमे'},
    {id:'w19',c:'ゲーム',r:'geemu',m:'Game',n:'खेल'}, {id:'w20',c:'パン',r:'pan',m:'Bread',n:'पाउरोटी'}
  ]
};

export const TIME_DATA = {
  hours: { 
    1:{r:"ichiji",h:"いちじ",k:"一時"}, 2:{r:"niji",h:"にじ",k:"二時"}, 3:{r:"sanji",h:"さんじ",k:"三時"}, 
    4:{r:"yoji",h:"よじ",k:"四時"}, 5:{r:"goji",h:"ごじ",k:"五時"}, 6:{r:"rokuji",h:"ろくじ",k:"六時"}, 
    7:{r:"shichiji",h:"しちじ",k:"七時"}, 8:{r:"hachiji",h:"はちじ",k:"八時"}, 9:{r:"kuji",h:"くじ",k:"九時"}, 
    10:{r:"juuji",h:"じゅうじ",k:"十時"}, 11:{r:"juuichiji",h:"じゅういちじ",k:"十一時"}, 12:{r:"juuniji",h:"じゅうにじ",k:"十二時"}
  },
  mins: {
    1:{r:"ippun",h:"いっぷん",k:"一分"}, 2:{r:"nifun",h:"にふん",k:"二分"}, 3:{r:"sanpun",h:"さんぷん",k:"三分"}, 
    4:{r:"yonpun",h:"よんぷん",k:"四分"}, 5:{r:"gofun",h:"ごふん",k:"五分"}, 6:{r:"roppun",h:"ろっぷん",k:"六分"}, 
    7:{r:"nanafun",h:"ななふん",k:"七分"}, 8:{r:"happun",h:"はっぷん",k:"八分"}, 9:{r:"kyuufun",h:"きゅうふん",k:"九分"}, 
    10:{r:"juppun",h:"じゅっぷん",k:"十分"}, 20:{r:"nijuppun",h:"にじゅっぷん",k:"二十分"}, 
    30:{r:"sanjuppun",h:"さんじゅっぷん",k:"三十分"}, 40:{r:"yonjuppun",h:"よんじゅっぷん",k:"四十分"}, 
    50:{r:"gojuppun",h:"ごじゅっぷん",k:"五十分"}
  }
};

export const DATE_DATA = {
  months: ["ichigatsu","nigatsu","sangatsu","shigatsu","gogatsu","rokugatsu","shichigatsu","hachigatsu","kugatsu","juugatsu","juuichigatsu","juunigatsu"],
  monthsH: ["いちがつ","にがつ","さんがつ","しがつ","ごがつ","ろくがつ","しちがつ","はちがつ","くがつ","じゅうがつ","じゅういちがつ","じゅうにがつ"],
  monthsK: ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
  daysIrreg: {
    1: {r:"tsuitachi",h:"ついたち",k:"一日"}, 2: {r:"futsuka",h:"ふつか",k:"二日"}, 3: {r:"mikka",h:"みっか",k:"三日"},
    4: {r:"yokka",h:"よっか",k:"四日"}, 5: {r:"itsuka",h:"いつか",k:"五日"}, 6: {r:"muika",h:"むいか",k:"六日"},
    7: {r:"nanoka",h:"なのか",k:"七日"}, 8: {r:"youka",h:"ようか",k:"八日"}, 9: {r:"kokonoka",h:"ここのか",k:"九日"},
    10: {r:"tooka",h:"とおか",k:"十日"}, 14: {r:"juuyokka",h:"じゅうよっか",k:"十四日"}, 20: {r:"hatsuka",h:"はつか",k:"二十日"},
    24: {r:"nijuuyokka",h:"にじゅうよっか",k:"二十四日"}
  }
};
