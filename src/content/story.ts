import {
  CostumeConfig,
  MoralAlignment,
  StoryChapterDef,
  StoryProgress,
} from '../sim/types';

const STORY_STORAGE_KEY = 'kale_kapmaca_story_v1';

export const POFI_COSTUME: CostumeConfig = {
  colorId: 'turquoise',
  fesStyle: 'klasik_fes',
  mustacheStyle: 'kaytan',
};

export const STORY_CHAPTERS: StoryChapterDef[] = [
  {
    id: 1,
    slug: 'baslangic-kalesi',
    title: '1. Başlangıç Kalesi',
    subtitle: 'Yedi Mührün Kırılışı',
    mapId: 'story_origin',
    sealName: 'Toprak Mührü',
    loreIntro:
      'Bir zamanlar Yedi Kale Krallığı’nın surları barış içinde yankılanırdı. Ta ki Altın Hisar’daki kadim Yedi Mühür esrarengiz bir gecede kırılana dek... Şimdi her kale kendi kapılarını kapattı. Küçük ama yüreği kocaman hamurumsu çırak Pofi, kırılan mühürlerin izini sürmek için Başlangıç Kalesi’nden yola çıkıyor.',
    secretLore:
      'Kale mahzenindeki kırık taş tablette mühürlerin dışarıdan değil, bizzat saray içindeki bir el tarafından kırıldığı yazılı!',
    objectiveLabel: 'Tıknaz Ali’nin kafasına 3 kez bas',
    mode: 'story',
    lives: 3,
    storyRule: {
      chapterId: 1,
      title: 'Başlangıç Kalesi',
      objectiveLabel: 'Hedef: 3 Kafa Ezme',
      targetStomps: 3,
    },
    rivals: [
      {
        name: 'Tıknaz Ali',
        heroId: 'tiknaz',
        team: 'B',
        aiPersonality: 'balanced',
        costume: { colorId: 'amber', fesStyle: 'klasik_fes', mustacheStyle: 'cember' },
      },
    ],
    introDialogue: [
      {
        speaker: 'Usta Demir',
        role: 'Kale Muhafızı',
        side: 'left',
        costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'pala' },
        text: 'Pofi! Gökyüzündeki kıvılcımları gördün mü? Yedi Mühür parçalandı. Kaleler arasındaki kadim köprüler bir bir yıkılıyor!',
      },
      {
        speaker: 'Pofi',
        role: 'Hamurumsu Çırak',
        side: 'right',
        costume: POFI_COSTUME,
        text: 'Usta Demir, bedenim yumuşak hamurdan olabilir ama cesaretim taştan sağlamdır! Mühürleri kim kırdıysa bulacağım!',
      },
      {
        speaker: 'Tıknaz Ali',
        role: 'Avlu Şampiyonu',
        side: 'left',
        costume: { colorId: 'amber', fesStyle: 'klasik_fes', mustacheStyle: 'cember' },
        text: 'Dur bakalım Pofi! Önce benim fesimi ezmeden dış kapıdan adım atamazsın. Gel de hamurunu biraz yoğuralım!',
      },
    ],
    choicePrompt:
      'Karşılaşma öncesi avludaki eski taş sandıkta parlayan bir parşömen buldun. Nasıl hareket edersin?',
    choices: [
      {
        id: 'c1_mercy',
        label: 'Parşömeni Usta Demir ile paylaş (+1 Can)',
        description: 'Bilgiyi saklamadan kaledeki muhafızlarla paylaşırsın.',
        alignment: 'mercy',
        bonusLives: 1,
        secretFound: 'Kaledeki Eski Tablet: "Mührü kıran el saraydan uzandı."',
        responseLine: {
          speaker: 'Usta Demir',
          role: 'Kale Muhafızı',
          side: 'left',
          costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'pala' },
          text: 'Aferin evlat! Bu parşömen bir ihanetin izini taşıyor. Yanına ekstra bir can iksiri al, yolun açık olsun.',
        },
      },
      {
        id: 'c1_wisdom',
        label: 'Yazıtı gizlice incele ve mühür haritasını çıkar',
        description: 'Kadim mühürlerin yerlerini hafızana kazırsın.',
        alignment: 'wisdom',
        secretFound: 'Kaledeki Eski Tablet: "Mührü kıran el saraydan uzandı."',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Demek Altın Hisar’daki yedinci mühür tüm diğerlerini kontrol ediyormuş... Bunu aklımın bir köşesine yazdım.',
        },
      },
      {
        id: 'c1_might',
        label: 'Parşömeni geç, doğrudan meydana fırlayıp meydan oku',
        description: 'Söz yerine zıplayışların konuşsun.',
        alignment: 'might',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Gizemler beni beklemez! Önce Tıknaz Ali’yi dümdüz edeyim!',
        },
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Tıknaz Ali',
        role: 'Avlu Şampiyonu',
        side: 'left',
        costume: { colorId: 'amber', fesStyle: 'klasik_fes', mustacheStyle: 'cember' },
        text: 'Vay be Pofi... Fesim hâlâ dümdüz! Toprak Mührü artık senin ellerinde. İlk durak Kırmızı Hisar olsun!',
      },
    ],
    unlocksText: 'Başlangıç Kalesi Arenası açıldı!',
    unlockMapId: 'story_origin',
  },
  {
    id: 2,
    slug: 'kirmizi-hisar',
    title: '2. Kırmızı Hisar',
    subtitle: 'Alev Burçlarının Öfkesi',
    mapId: 'story_crimson',
    sealName: 'Ateş Mührü',
    loreIntro:
      'Kırmızı Hisar’ın demir kapıları kızgın korlarla parlıyor. Hükümdar Kızıl Bey, kırılan mühürden sonra tüm komşularına savaş ilan etmiş durumda. Hisarın tepesindeki şahi toplar her an ateşlenebilir!',
    secretLore:
      'Kızıl Bey’in kütüphanesinde, Altın Hakan’ın mühürleri koruma bahanesiyle tüm beyleri birbirine düşürdüğünü gösteren mühürlü bir ferman saklıdır.',
    objectiveLabel: 'Kızıl Bey ve Ateşçi Memo’yu alt et',
    mode: 'story',
    lives: 3,
    storyRule: {
      chapterId: 2,
      title: 'Kırmızı Hisar',
      objectiveLabel: 'Hedef: Kırmızı Hisar Rakiplerini Ele',
      defaultHazard: 'cannon',
    },
    rivals: [
      {
        name: 'Kızıl Bey',
        heroId: 'kizil_bey',
        team: 'B',
        aiPersonality: 'aggressive',
        costume: { colorId: 'crimson', fesStyle: 'saray_kavuk', mustacheStyle: 'pala' },
      },
      {
        name: 'Ateşçi Memo',
        heroId: 'kizil_bey',
        team: 'B',
        aiPersonality: 'chaotic',
        costume: { colorId: 'tangerine', fesStyle: 'puskullu_fes', mustacheStyle: 'burgu' },
      },
    ],
    introDialogue: [
      {
        speaker: 'Kızıl Bey',
        role: 'Hisar Hükümdarı',
        side: 'left',
        costume: { colorId: 'crimson', fesStyle: 'saray_kavuk', mustacheStyle: 'pala' },
        text: 'Surlarıma kadar gelmeye cüret eden şu turkuaz hamur parçası da kim? Topçular, nişan alın!',
      },
      {
        speaker: 'Pofi',
        role: 'Hamurumsu Çırak',
        side: 'right',
        costume: POFI_COSTUME,
        text: 'Kızıl Bey! Savaşarak krallığı kurtaramazsın. Ateş Mührü’nü birleştirme vakti geldi!',
      },
    ],
    choicePrompt: 'Top ateşi başlamadan önce cephanelik kapısında ne yaparsın?',
    choices: [
      {
        id: 'c2_mercy',
        label: 'Tutsak demircileri serbest bırak (+1 Can)',
        description: 'Onlar da sana kalkan desteği verir.',
        alignment: 'mercy',
        bonusLives: 1,
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Özgürsünüz dostlar! Bu kaleyi öfke değil adalet kurtaracak.',
        },
      },
      {
        id: 'c2_wisdom',
        label: 'Kızıl Bey’in çadırındaki gizli fermanı oku',
        description: 'Altın Hakan’ın gerçek planına dair ilk kanıtı ele geçir.',
        alignment: 'wisdom',
        secretFound: 'Kızıl Ferman: "Yedi Beyi zayıflat, Altın Taht’a tek başına hükmet."',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Olamaz! Altın Hakan bu karmaşayı bilerek mi çıkardı?!',
        },
      },
      {
        id: 'c2_might',
        label: 'Barut fıçılarını devirip doğrudan saldır',
        description: 'Kızıl Hisar’ı sarsan bir giriş yap.',
        alignment: 'might',
        responseLine: {
          speaker: 'Kızıl Bey',
          role: 'Hisar Hükümdarı',
          side: 'left',
          costume: { colorId: 'crimson', fesStyle: 'saray_kavuk', mustacheStyle: 'pala' },
          text: 'Cesaretini sevdim ufaklık, bakalım toplarıma dayanabilecek misin!',
        },
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Kızıl Bey',
        role: 'Hisar Hükümdarı',
        side: 'left',
        costume: { colorId: 'crimson', fesStyle: 'saray_kavuk', mustacheStyle: 'pala' },
        text: 'Ateş Mührü senin hakkındır Pofi. Haklıydın... Bizi birbirimize düşüren gölge Altın Hisar’dan geliyor!',
      },
    ],
    unlocksText: 'Kırmızı Hisar Arenası & Altın Hükümdar Kaftanı açıldı!',
    unlockMapId: 'story_crimson',
    unlockColorId: 'gold_pasha',
  },
  {
    id: 3,
    slug: 'buzlu-burclar',
    title: '3. Buzlu Burçlar',
    subtitle: 'Donmuş Boğazın Sınavı',
    mapId: 'story_frost',
    sealName: 'Buz Mührü',
    loreIntro:
      'Kuzeyin dondurucu rüzgarları Buzlu Burçlar’ı cam gibi kaygan hale getirmiş. Buz Prensi Karahan, dış dünyayla tüm bağını kesip krallığın soğukta donmasını izliyor.',
    secretLore:
      'Karahan aslında halkını korumak için surları dondurdu; fakat Buz Mührü kontrolünden çıkınca kendisi de kalenin tutsağı oldu.',
    objectiveLabel: 'Kaygan buz üzerinde 40 saniye hayatta kal veya Karahan’ı yen',
    mode: 'story',
    lives: 3,
    roundDurationSec: 40,
    storyRule: {
      chapterId: 3,
      title: 'Buzlu Burçlar',
      objectiveLabel: 'Hedef: 40s Dayan / Karahan’ı Yen',
      surviveSeconds: 40,
      defaultHazard: 'slippery',
    },
    rivals: [
      {
        name: 'Prens Karahan',
        heroId: 'karahan',
        team: 'B',
        aiPersonality: 'defensive',
        costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'kaytan' },
      },
      {
        name: 'Ayaz Muhafızı',
        heroId: 'karahan',
        team: 'B',
        aiPersonality: 'balanced',
        costume: { colorId: 'plum', fesStyle: 'klasik_fes', mustacheStyle: 'cember' },
      },
    ],
    introDialogue: [
      {
        speaker: 'Prens Karahan',
        role: 'Kuzey Hükümdarı',
        side: 'left',
        costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'kaytan' },
        text: 'Buzun üstünde dengede duramayan biri Yedi Kale’yi nasıl birleştirebilir ki? Geri dön Pofi!',
      },
      {
        speaker: 'Pofi',
        role: 'Hamurumsu Çırak',
        side: 'right',
        costume: POFI_COSTUME,
        text: 'Jöle gibi esnek bedenim buzu bile kavrar Karahan! Buz Mührü’nün zincirini kıracağım!',
      },
    ],
    choicePrompt: 'Soğuk surların dibinde donmak üzere olan bir ulak gördün:',
    choices: [
      {
        id: 'c3_mercy',
        label: 'Ulağı sıcak meşalenin yanına taşı (+1 Can)',
        description: 'Şefkatin sana güç ve gizli bir bilgi kazandırır.',
        alignment: 'mercy',
        bonusLives: 1,
        secretFound: 'Karahan’ın Sırrı: "Buz Mührü’nü korkudan değil, halkını korumak için kilitledi."',
        responseLine: {
          speaker: 'Donmuş Ulak',
          role: 'Haberci',
          side: 'left',
          text: 'Teşekkürler Pofi... Karahan kötü biri değil, sadece Kayıp Şehir’den gelecek eski bir lanetten korkuyor.',
        },
      },
      {
        id: 'c3_wisdom',
        label: 'Buz kristallerindeki eski yazıyı çöz',
        description: 'Kayıp Şehir’in altındaki gizli geçidi öğren.',
        alignment: 'wisdom',
        secretFound: 'Karahan’ın Sırrı: "Buz Mührü’nü korkudan değil, halkını korumak için kilitledi."',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Kayıp Şehir sular altında değilmiş, taşların altında bir sır saklıyormuş!',
        },
      },
      {
        id: 'c3_might',
        label: 'Hızla buz pistine atlayıp Karahan’a meydan oku',
        description: 'Fırtınaya aldırmadan dövüş.',
        alignment: 'might',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Soğuk bana işlemez! Haydi bakalım Karahan!',
        },
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Prens Karahan',
        role: 'Kuzey Hükümdarı',
        side: 'left',
        costume: { colorId: 'cobalt', fesStyle: 'yeniceri_bork', mustacheStyle: 'kaytan' },
        text: 'Buzlar eridi, kalbimdeki şüphe de öyle... Buz Mührü artık seninle Pofi!',
      },
    ],
    unlocksText: 'Buzlu Burçlar Arenası açıldı!',
    unlockMapId: 'story_frost',
  },
  {
    id: 4,
    slug: 'kayip-sehir',
    title: '4. Kayıp Şehir',
    subtitle: 'Sular Altındaki Yankı',
    mapId: 'story_lost',
    sealName: 'Su Mührü',
    loreIntro:
      'Haritalardan silinen Kayıp Şehir’in taşları her adımda titreyip derinlere çöküyor. Bu harabelerde eski bir kâşif olan Leyla, Su Mührü’nü herkesten gizliyor.',
    secretLore:
      'Kayıp Şehir’i yutan tufan, ilk krallığın kuruluşunda Yedi Mühür’e hapsedilen kadim bir gücün sızmasıyla başlamıştı.',
    objectiveLabel: '60 Puana ulaş veya Leyla’yı alt et',
    mode: 'story',
    lives: 3,
    storyRule: {
      chapterId: 4,
      title: 'Kayıp Şehir',
      objectiveLabel: 'Hedef: 60 Puan veya Rakibi Ele',
      targetScore: 60,
    },
    rivals: [
      {
        name: 'Kâşif Leyla',
        heroId: 'leyla',
        team: 'B',
        aiPersonality: 'aggressive',
        costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
      },
    ],
    introDialogue: [
      {
        speaker: 'Kâşif Leyla',
        role: 'Harabe Bekçisi',
        side: 'left',
        costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
        text: 'Dur Pofi! Bu şehri kimse bilmemeli. Mühürleri birleştirmek, uyuyan kadim gücü uyandırabilir!',
      },
      {
        speaker: 'Pofi',
        role: 'Hamurumsu Çırak',
        side: 'right',
        costume: POFI_COSTUME,
        text: 'Ama kaleler bölünük kalırsa krallık tamamen yok olacak Leyla! Gücü kötüye değil barışa kullanacağız.',
      },
    ],
    choicePrompt: 'Çöken köprünün ortasında Su Mührü’nün ışığı ikiye ayrıldı:',
    choices: [
      {
        id: 'c4_mercy',
        label: 'Leyla’ya elini uzat ve ittifak teklif et (+1 Can)',
        description: 'Gelecekteki savaşlarda Leyla sana yardım edebilir.',
        alignment: 'mercy',
        bonusLives: 1,
        secretFound: 'Kayıp Şehir Yazıtı: "Yedi Mühür birleştiğinde tahtın sahibi kalbin saflığına göre seçilir."',
        responseLine: {
          speaker: 'Kâşif Leyla',
          role: 'Harabe Bekçisi',
          side: 'left',
          costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
          text: 'Sözünü test edeceğim Pofi! Yine de adil dövüşeceğim.',
        },
      },
      {
        id: 'c4_wisdom',
        label: 'Su altındaki mozaik kitabeyi incele',
        description: 'Yedi Mührün gerçek sırrını keşfet.',
        alignment: 'wisdom',
        secretFound: 'Kayıp Şehir Yazıtı: "Yedi Mühür birleştiğinde tahtın sahibi kalbin saflığına göre seçilir."',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Demek mühürler güç değil, bir sınavmış!',
        },
      },
      {
        id: 'c4_might',
        label: 'Taşlar çökmeden doğrudan yukarı sıçra',
        description: 'Hız ve çeviklikle Su Mührü’nü kap.',
        alignment: 'might',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Kimse benden hızlı zıplayamaz!',
        },
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Kâşif Leyla',
        role: 'Harabe Bekçisi',
        side: 'left',
        costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
        text: 'Yüreğin temizmiş Pofi. Su Mührü senindir! Şimdi Gölge Kalesi’nde Vezir Karanlık ile yüzleşmeye hazır ol.',
      },
    ],
    unlocksText: 'Kayıp Şehir Arenası açıldı!',
    unlockMapId: 'story_lost',
  },
  {
    id: 5,
    slug: 'golge-kalesi',
    title: '5. Gölge Kalesi',
    subtitle: 'Kırık Aynalar Avlusu',
    mapId: 'story_shadow',
    sealName: 'Gölge Mührü',
    loreIntro:
      'Ay tutulmasının gölgesindeki bu kalede rüzgarlar tersine eser. Eski Saray Başveziri Karanlık, Yedi Mührü kıran gölgelerin arkasındaki beyin olarak Pofi’yi bekliyor.',
    secretLore:
      'Vezir Karanlık mühürleri tek başına kırmadı; Altın Hakan’a ihanet edip tahtı çalmak için ikiz gölgeler yarattı!',
    objectiveLabel: 'Vezir Karanlık ve Gölge İkizi’ni alt et',
    mode: 'story',
    lives: 3,
    storyRule: {
      chapterId: 5,
      title: 'Gölge Kalesi',
      objectiveLabel: 'Hedef: Vezir ve Gölge İkizini Yen',
      defaultHazard: 'wind_left',
    },
    rivals: [
      {
        name: 'Vezir Karanlık',
        heroId: 'karanlik',
        team: 'B',
        aiPersonality: 'aggressive',
        costume: { colorId: 'shadow_obsidian', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu' },
      },
      {
        name: 'Gölge İkizi',
        heroId: 'karanlik',
        team: 'B',
        aiPersonality: 'chaotic',
        costume: { colorId: 'plum', fesStyle: 'klasik_fes', mustacheStyle: 'kaytan' },
      },
    ],
    introDialogue: [
      {
        speaker: 'Vezir Karanlık',
        role: 'Gölge Efendisi',
        side: 'left',
        costume: { colorId: 'shadow_obsidian', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu' },
        text: 'Hoş geldin Pofi! Dört mührü benim için ayağıma kadar getirmişsin. Mühürleri ben kırdım ki en güçlü olan hepsini toplasın!',
      },
      {
        speaker: 'Pofi',
        role: 'Hamurumsu Çırak',
        side: 'right',
        costume: POFI_COSTUME,
        text: 'Krallığı sırf hırsın yüzünden mi parçaladın?! Mühürleri sana değil, halka geri vereceğim!',
      },
    ],
    choicePrompt: 'Aynalı salonda gölgeler üstüne yürürken:',
    choices: [
      {
        id: 'c5_mercy',
        label: 'Tutsak kalmış ayna ruhlarını özgür bırak (+1 Can)',
        description: 'Gölge ikizlerin gücünü zayıflatıp kendi direncini artırırsın.',
        alignment: 'mercy',
        bonusLives: 1,
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Karanlığın esareti bitti! Işık kalbe geri dönüyor.',
        },
      },
      {
        id: 'c5_wisdom',
        label: 'Vezir’in gizli mühür günlüğünü ele geçir',
        description: 'Altın Hisar’daki yedinci mührün zayıf noktasını öğren.',
        alignment: 'wisdom',
        secretFound: 'Vezirin Günlüğü: "Altın Hakan mühürlerin son parçasını kendi tacına gizledi."',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Yedinci Mühür Altın Hakan’ın tacındaymış! Gerçek artık tamamen aydınlandı.',
        },
      },
      {
        id: 'c5_might',
        label: 'Aynaları tek hamlede parçalayıp saldır',
        description: 'Saf güçle gölgeyi dağıt.',
        alignment: 'might',
        responseLine: {
          speaker: 'Vezir Karanlık',
          role: 'Gölge Efendisi',
          side: 'left',
          costume: { colorId: 'shadow_obsidian', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu' },
          text: 'Öfken hoşuma gitti Pofi! Bakalım gölgemle baş edebilecek misin!',
        },
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Vezir Karanlık',
        role: 'Gölge Efendisi',
        side: 'left',
        costume: { colorId: 'shadow_obsidian', fesStyle: 'saray_kavuk', mustacheStyle: 'burgu' },
        text: 'İmkansız... Küçük bir hamur parçası gölgemi ezdi! Gölge Mührü senindir... Ama Yedi Kralın Turnuvası’ndan sağ çıkabilecek misin?',
      },
    ],
    unlocksText: 'Gölge Kalesi Arenası & Gölge Zırhı Rengi açıldı!',
    unlockMapId: 'story_shadow',
    unlockColorId: 'shadow_obsidian',
  },
  {
    id: 6,
    slug: 'yedi-kralin-turnuvasi',
    title: '6. Yedi Kralın Turnuvası',
    subtitle: 'Büyük Meydanın Sınavı',
    mapId: 'story_tournament',
    sealName: 'Birlik Mührü',
    loreIntro:
      'Altı kalenin şampiyonları ve Kâşif Leyla büyük meydanda toplanıyor. Altın Hisar kapılarının açılması için Pofi’nin bu zorlu turnuvada ayakta kalması gerekiyor.',
    secretLore:
      'Turnuvanın galibine verilen Birlik Mührü, yalnızca tek başına kazananı değil, dostluk kurabilenleri ödüllendirir.',
    objectiveLabel: 'Leyla ile omuz omuza Turnuva Şampiyonlarını yen',
    mode: 'story',
    lives: 3,
    storyRule: {
      chapterId: 6,
      title: 'Yedi Kralın Turnuvası',
      objectiveLabel: 'Hedef: Turnuvayı Kazan',
    },
    ally: {
      name: 'Kâşif Leyla',
        heroId: 'leyla',
      aiPersonality: 'balanced',
      costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
    },
    rivals: [
      {
        name: 'Demir Paşa',
        heroId: 'tiknaz',
        team: 'B',
        aiPersonality: 'aggressive',
        costume: { colorId: 'crimson', fesStyle: 'yeniceri_bork', mustacheStyle: 'pala' },
      },
      {
        name: 'Fırtına Bey',
        heroId: 'zeynep',
        team: 'B',
        aiPersonality: 'chaotic',
        costume: { colorId: 'tangerine', fesStyle: 'saray_kavuk', mustacheStyle: 'cember' },
      },
    ],
    introDialogue: [
      {
        speaker: 'Kâşif Leyla',
        role: 'Müttefik',
        side: 'left',
        costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
        text: 'Söz verdiğim gibi yanındayım Pofi! Bu turnuvayı birlikte kazanıp Altın Hisar’ın kapısını açacağız.',
      },
      {
        speaker: 'Demir Paşa',
        role: 'Turnuva Şampiyonu',
        side: 'right',
        costume: { colorId: 'crimson', fesStyle: 'yeniceri_bork', mustacheStyle: 'pala' },
        text: 'Altın Hakan adına buradayız! Meydanı terk etmezseniz hamurunuzu açarız!',
      },
    ],
    choicePrompt: 'Turnuva boruları çalmadan hemen önce kalabalığa nasıl seslenirsin?',
    choices: [
      {
        id: 'c6_mercy',
        label: '"Krallık barış için yeniden birleşecek!" (+1 Can)',
        description: 'Kalabalığın coşkusu ve ittifak ruhu sana direnç verir.',
        alignment: 'mercy',
        bonusLives: 1,
        responseLine: {
          speaker: 'Kâşif Leyla',
          role: 'Müttefik',
          side: 'left',
          costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
          text: 'Halk arkamızda Pofi! Haydi meydana!',
        },
      },
      {
        id: 'c6_wisdom',
        label: 'Rakiplerin zayıf noktalarını Leyla’ya işaret et',
        description: 'Kadim turnuva kurallarındaki gizli mühür sırrını öğren.',
        alignment: 'wisdom',
        secretFound: 'Turnuva Sırrı: "Altın Hakan aslında mühürleri koruyan son muhafızın sınayıcısıdır."',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Yüksek taşların üstünden süzülüp kafalarına inelim Leyla!',
        },
      },
      {
        id: 'c6_might',
        label: '"En güçlü fesli kimmiş görelim!"',
        description: 'Rakipleri korkusuzca karşıla.',
        alignment: 'might',
        responseLine: {
          speaker: 'Pofi',
          role: 'Hamurumsu Çırak',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Gelin bakalım şampiyonlar!',
        },
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Kâşif Leyla',
        role: 'Müttefik',
        side: 'left',
        costume: { colorId: 'emerald', fesStyle: 'puskullu_fes', mustacheStyle: 'kaytan' },
        text: 'Muhteşemdik! Altı mühür tamamlandı. Artık Yedinci Mühür için Altın Hisar’a yürüme vakti!',
      },
    ],
    unlocksText: 'Yedi Kralın Arenası açıldı!',
    unlockMapId: 'story_tournament',
  },
  {
    id: 7,
    slug: 'altin-hisar',
    title: '7. Altın Hisar',
    subtitle: 'Yedi Mührün Kalbi (Büyük Final)',
    mapId: 'story_golden',
    sealName: 'Altın Mühür (Taç)',
    loreIntro:
      'Güneşin altın kubbelere vurduğu Altın Hisar’ın taht odasındasın. Altın Hakan, tacında parlayan Yedinci Mühür ile krallığın kaderini belirleyecek son düello için Pofi’yi bekliyor.',
    secretLore:
      'Yedi Mühür birleştiğinde krallık, yolculuk boyunca verdiğin kararlara göre (Merhamet, Bilgelik veya Kudret) yepyeni bir çağa uyanacak.',
    objectiveLabel: 'Altın Hakan ve Muhafızını yenerek Yedi Mührü birleştir',
    mode: 'story',
    lives: 4,
    storyRule: {
      chapterId: 7,
      title: 'Altın Hisar',
      objectiveLabel: 'Büyük Final: Altın Hakan’ı Alt Et',
      defaultHazard: 'cannon',
    },
    rivals: [
      {
        name: 'Altın Hakan',
        heroId: 'altin_hakan',
        team: 'B',
        aiPersonality: 'aggressive',
        costume: { colorId: 'gold_pasha', fesStyle: 'sultan_taci', mustacheStyle: 'pala' },
      },
      {
        name: 'Saray Muhafızı',
        heroId: 'tiknaz',
        team: 'B',
        aiPersonality: 'defensive',
        costume: { colorId: 'crimson', fesStyle: 'yeniceri_bork', mustacheStyle: 'burgu' },
      },
    ],
    introDialogue: [
      {
        speaker: 'Altın Hakan',
        role: 'Yedi Kale Hükümdarı',
        side: 'left',
        costume: { colorId: 'gold_pasha', fesStyle: 'sultan_taci', mustacheStyle: 'pala' },
        text: 'Nihayet geldin Pofi! Altı kaleyi geçip altı mührü topladın. Şimdi son sınav: Yedi Kale’yi yönetecek iradeye gerçekten sahip misin?',
      },
      {
        speaker: 'Pofi',
        role: 'Yedi Mührün Yolcusu',
        side: 'right',
        costume: POFI_COSTUME,
        text: 'Yolculuğum boyunca dostlar edindim, sırlar çözdüm ve hiç pes etmedim. Yedi Mühür yeniden tek yürek olacak!',
      },
    ],
    choicePrompt:
      'Altın Taht’ın önünde Yedinci Mühür parlıyor. Krallığın geleceği için son kararını seç:',
    choices: [
      {
        id: 'c7_mercy',
        label: 'Mühürleri yedi kaleye eşit paylaştır (Birleştirici Son)',
        description: 'Tüm kaleler özgür ve kardeşçe birleşir.',
        alignment: 'mercy',
        bonusLives: 1,
        responseLine: {
          speaker: 'Altın Hakan',
          role: 'Yedi Kale Hükümdarı',
          side: 'left',
          costume: { colorId: 'gold_pasha', fesStyle: 'sultan_taci', mustacheStyle: 'pala' },
          text: 'Asil bir yürek! Bakalım bu barış fikrini meydanda da savunabilecek misin?',
        },
      },
      {
        id: 'c7_wisdom',
        label: 'Mühürlerin kadim bilgisini koruyuculara emanet et (Bilge Son)',
        description: 'Kayıp Şehir ve tüm sırlar sonsuza dek güvence altına alınır.',
        alignment: 'wisdom',
        secretFound: 'Altın Mühür Sırrı: "Gerçek taç, gücü elinde tutan değil, sırrı bilgelikle koruyandır."',
        responseLine: {
          speaker: 'Pofi',
          role: 'Yedi Mührün Yolcusu',
          side: 'right',
          costume: POFI_COSTUME,
          text: 'Bilgelik olmadan güç yıkımdır Hakan! Gel, son dansımızı yapalım!',
        },
      },
      {
        id: 'c7_might',
        label: 'Tüm mühürleri kendi tacında topla (Mutlak Hükümdar Sonu)',
        description: 'Yedi Kale Krallığı’nın tek ve sarsılmaz efendisi ol.',
        alignment: 'might',
        responseLine: {
          speaker: 'Altın Hakan',
          role: 'Yedi Kale Hükümdarı',
          side: 'left',
          costume: { colorId: 'gold_pasha', fesStyle: 'sultan_taci', mustacheStyle: 'pala' },
          text: 'Öyleyse tacımı benden kendi ellerinle al Pofi!',
        },
      },
    ],
    victoryDialogue: [
      {
        speaker: 'Altın Hakan',
        role: 'Yedi Kale Hükümdarı',
        side: 'left',
        costume: { colorId: 'gold_pasha', fesStyle: 'sultan_taci', mustacheStyle: 'pala' },
        text: 'Yedi Mühür yeniden birleşti! Küçük Pofi, Yedi Kale Krallığı’nın en büyük efsanesi artık sensin!',
      },
    ],
    unlocksText: 'Altın Hisar Arenası & Yedi Mühür Tacı açıldı!',
    unlockMapId: 'story_golden',
    unlockFesId: 'sultan_taci',
  },
];

export const STORY_ENDINGS: Record<
  'unity' | 'guardian' | 'obsidian',
  { title: string; subtitle: string; epilogue: string }
> = {
  unity: {
    title: 'Son 1: Birleştirici Sultan Pofi',
    subtitle: 'Merhamet ve İttifakın Zaferi',
    epilogue:
      'Pofi, Yedi Mührü tek elde toplamak yerine yedi kalenin halklarına yeniden paylaştırdı. Usta Demir, Kızıl Bey, Karahan ve Kâşif Leyla ile kurduğu kardeşlik sayesinde Yedi Kale Krallığı tarihinde görülmemiş bir barış ve şenlik çağına girdi.',
  },
  guardian: {
    title: 'Son 2: Kadim Sırların Koruyucusu',
    subtitle: 'Bilgelik ve Gerçeğin Zaferi',
    epilogue:
      'Pofi, Kayıp Şehir’den Gölge Kalesi’ne uzanan tüm gizli yazıtları çözdü. Yedi Mührü kadim bir bilgelikle mühürleyerek krallığı gölgelerden sonsuza dek koruyan efsanevi Başmuhafız oldu.',
  },
  obsidian: {
    title: 'Son 3: Tahtın Hamurumsu Fatihi',
    subtitle: 'Kudret ve Cesaretin Zaferi',
    epilogue:
      'Önüne çıkan her şampiyonu ve bizzat Altın Hakan’ı hamur gibi ezen Pofi, Yedi Mührü kendi Yedi Mühür Tacı’nda birleştirdi. Artık tüm kaleler tek bir sarsılmaz hükümdarın sancağı altında toplanmıştı.',
  },
};

export function createInitialStoryProgress(): StoryProgress {
  return {
    completedChapters: [],
    unlockedMaps: ['classic', 'towers', 'crumbling', 'hazard'],
    unlockedColors: [
      'crimson',
      'cobalt',
      'emerald',
      'amber',
      'plum',
      'tangerine',
      'turquoise',
    ],
    unlockedFes: [
      'klasik_fes',
      'puskullu_fes',
      'yeniceri_bork',
      'saray_kavuk',
    ],
    secretsFound: [],
    choicesByChapter: {},
    alignmentCounts: { mercy: 0, wisdom: 0, might: 0 },
    endingReached: null,
  };
}

export function loadStoryProgress(): StoryProgress {
  const base = createInitialStoryProgress();
  try {
    const raw = localStorage.getItem(STORY_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      completedChapters: Array.isArray(parsed.completedChapters)
        ? parsed.completedChapters
        : [],
      unlockedMaps: Array.from(
        new Set([...base.unlockedMaps, ...(parsed.unlockedMaps ?? [])])
      ),
      unlockedColors: Array.from(
        new Set([...base.unlockedColors, ...(parsed.unlockedColors ?? [])])
      ),
      unlockedFes: Array.from(
        new Set([...base.unlockedFes, ...(parsed.unlockedFes ?? [])])
      ),
      secretsFound: Array.isArray(parsed.secretsFound) ? parsed.secretsFound : [],
      choicesByChapter: parsed.choicesByChapter ?? {},
      alignmentCounts: {
        mercy: parsed.alignmentCounts?.mercy ?? 0,
        wisdom: parsed.alignmentCounts?.wisdom ?? 0,
        might: parsed.alignmentCounts?.might ?? 0,
      },
      endingReached: parsed.endingReached ?? null,
    };
  } catch {
    return base;
  }
}

export function saveStoryProgress(progress: StoryProgress) {
  try {
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

export function computeEndingFromCounts(
  counts: Record<MoralAlignment, number>,
  finalChoiceAlignment?: MoralAlignment
): 'unity' | 'guardian' | 'obsidian' {
  const mercy = counts.mercy + (finalChoiceAlignment === 'mercy' ? 1 : 0);
  const wisdom = counts.wisdom + (finalChoiceAlignment === 'wisdom' ? 1 : 0);
  const might = counts.might + (finalChoiceAlignment === 'might' ? 1 : 0);

  if (wisdom >= mercy && wisdom >= might) return 'guardian';
  if (might > mercy && might > wisdom) return 'obsidian';
  return 'unity';
}
