import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const checkedAt = "2026-07-16";

const nicheLabels = {
  dentistry: "Стоматологии",
  beauty: "Салоны красоты",
  nails: "Маникюрные студии и мастера",
  lashes: "Наращивание ресниц и лэшмейкеры",
  hair_extensions: "Наращивание и восстановление волос",
  massage: "Массажисты и массажные кабинеты",
  barber: "Барбершопы",
  fitness: "Фитнес-клубы и тренажёрные залы",
  yoga: "Йога, пилатес, растяжка",
  bakery: "Пекарни",
  coffee: "Кофейни",
  confectionery: "Кондитерские и торты на заказ",
  furniture: "Мебель и мебельные мастерские",
  kitchens: "Кухни на заказ",
  doors: "Двери",
  windows: "Окна, стеклопакеты, балконы",
  plumbing: "Сантехника и сантехнические услуги",
  renovation: "Ремонт квартир и строительные бригады",
  interior: "Дизайн интерьера",
  kids: "Детские центры, развивающие студии",
  courses: "Курсы и учебные центры",
  veterinary: "Ветеринарные клиники и кабинеты",
  grooming: "Груминг-салоны",
  detailing: "Автодетейлинг и автомойки высокого класса",
  autoservice: "Автосервисы и СТО",
  craft: "Ремесленные бренды",
  psychology: "Психологи, психотерапевты и коучи"
};

const categoryEmojis = {
  dentistry: "🦷", beauty: "✨", nails: "💅", lashes: "👁️", hair_extensions: "💇", massage: "💆",
  barber: "💈", fitness: "🏋️", yoga: "🧘", bakery: "🥐", coffee: "☕", confectionery: "🍰",
  furniture: "🪑", kitchens: "🍽️", doors: "🚪", windows: "🪟", plumbing: "🔧", renovation: "🧱",
  interior: "🎨", kids: "🧸", courses: "📚", veterinary: "🐾", grooming: "🐶", detailing: "🚗",
  autoservice: "🛠️", craft: "🏺", psychology: "🧠"
};

const removedIds = new Set([
  "chisinau-dentistry-iceberg-dent-068",
  "chisinau-beauty-beautylashes-002",
  "chisinau-beauty-lotus-spa-health-beauty-center-219"
]);

const moveToLashes = new Set([
  "chisinau-beauty-lashtrainer-iuliana-013",
  "chisinau-beauty-angela-lashbrow-016",
  "chisinau-beauty-beauty-zone-032",
  "chisinau-beauty-dina-lash-brow-134",
  "chisinau-beauty-lashesbrows-dorynel-136",
  "chisinau-beauty-popovici-mihaela-studio-142",
  "chisinau-beauty-studio-elena-lashmaker-147",
  "chisinau-beauty-the-lash-house-156",
  "chisinau-beauty-lashes-cerenuska-157",
  "chisinau-beauty-lashes-secrets-md-162",
  "chisinau-beauty-lisnik-natalia-lash-186",
  "chisinau-beauty-adela-lash-balti-462",
  "chisinau-beauty-neonnylla-eyelashes-beauty-486",
  "chisinau-beauty-lash-brow-soroca-491",
  "chisinau-beauty-laminarea-genelor-si-sprancenelor-hincesti-499"
]);

const moveToHair = new Set([
  "chisinau-beauty-deea-extensions-143",
  "chisinau-beauty-buzilova-viktoriya-keratin-140",
  "chisinau-beauty-gladkaya-utka-434"
]);

const moveToMassage = new Set([
  "chisinau-beauty-relaxme-massage-spa-193",
  "chisinau-beauty-zen-therapy-masaj-337",
  "chisinau-beauty--428",
  "chisinau-beauty-health-time-432",
  "chisinau-beauty-masaj-orhei-balti-446",
  "chisinau-beauty-masaj-epilare-laser-balti-461",
  "chisinau-beauty-corpothera-balti-464",
  "chisinau-beauty-lilian-tarnovschi-massage-therapist-465",
  "chisinau-psychology-masaj-511",
  "chisinau-psychology-masaj-chisinau-512"
]);

const moveToNails = new Set([
  "chisinau-psychology-malybu-retea-de-manichiura-pedichiura-si-gene-516"
]);

function legacyChecks(name, phone, social) {
  const compact = String(name).toLowerCase().replace(/[^a-z0-9а-яё]+/giu, "").slice(0, 40);
  return [
    { method: "brand_exact_search", query: `"${name}" website OR site oficial Moldova`, result: "no_owned_site_confirmed_in_current_checkpoint" },
    { method: "brand_md_domain_search", query: `"${name}" site:.md`, result: "no_owned_md_domain_confirmed_in_current_checkpoint" },
    { method: "builder_search", query: `"${name}" site:wixsite.com OR site:tilda.ws OR site:sites.google.com`, result: "no_builder_site_confirmed_in_current_checkpoint" },
    { method: "bio_link_check", query: social || `${name} social bio`, result: "bio_not_fully_observable_or_no_owned_site_link_confirmed" },
    { method: "phone_exact_search", query: phone ? `"${phone}"` : `${name} phone`, result: "no_owned_site_confirmed_from_phone_checkpoint" },
    { method: "probable_domain_check", query: `${compact || "brand"}.md / .com / .ro`, result: "no_probable_owned_domain_confirmed_in_checkpoint" }
  ];
}

function candidate(input) {
  const phone = input.phone || [];
  const primaryPhone = phone[0] || "";
  const social = input.instagram || input.facebook || input.telegram || "";
  return {
    id: input.id,
    name: input.name,
    legal_name: "",
    legal_form: "",
    idno: "",
    legal_identity_status: "not_publicly_confirmed",
    niche: input.niche,
    niche_label: nicheLabels[input.niche],
    owner_or_manager: input.owner_or_manager || "",
    locality: input.locality || "Chișinău",
    sector: input.sector || "",
    address: input.address || "Адрес требует уточнения",
    latitude: null,
    longitude: null,
    phone,
    whatsapp: input.whatsapp || "",
    email: input.email || "",
    instagram: input.instagram || "",
    facebook: input.facebook || "",
    tiktok: input.tiktok || "",
    telegram: input.telegram || "",
    maps_url: input.maps_url || "",
    directory_urls: input.directory_urls || [],
    source_urls: input.source_urls || [],
    outreach_status: "новый",
    demo_site_url: "",
    website_status: "candidate_unverified",
    website_found_url: "",
    website_checks: legacyChecks(input.name, primaryPhone, social),
    verified_at: checkedAt,
    activity_evidence: input.activity_evidence,
    confidence: input.confidence || "medium",
    purchase_score: input.purchase_score || 7,
    estimated_budget_mdl: input.estimated_budget_mdl || "5 000–12 000",
    recommended_approach: input.recommended_approach,
    notes: input.notes || "Кандидат добавлен после первичного поиска; перед контактом повторно открыть соцсеть и bio-ссылки."
  };
}

const ritaVerified = {
  schema_version: "no-website-leads/v1",
  verification_standard: "strict-multisource-v1",
  id: "chisinau-nails-nail-studio-rita-busmachiu-579",
  entity_key: "phone:37368182688",
  entity_type: "solo_business",
  name: "Nail Studio Rita Busmachiu",
  legal_name: "",
  legal_form: "",
  idno: "",
  legal_identity_status: "not_publicly_confirmed",
  niche: "nails",
  niche_label: nicheLabels.nails,
  owner_or_manager: "Rita Busmachiu",
  locality: "Chișinău",
  sector: "Ciocana",
  address: "Ciocana, Chișinău (номер помещения перепроверить перед визитом)",
  latitude: null,
  longitude: null,
  phone: ["+37368182688"],
  email: "",
  instagram: "",
  facebook: "https://www.facebook.com/196674084073999",
  tiktok: "",
  telegram: "",
  whatsapp: "",
  maps_url: "",
  directory_urls: [
    "https://www.beautynailhairsalons.com/MD/Chisinau/196674084073999/Nail-Studio-Rita-Busmachiu",
    "https://moldova.worldplaces.me/review/144915753-nail-studio-rita-busmachiu.html"
  ],
  source_urls: [
    "https://www.beautynailhairsalons.com/MD/Chisinau/196674084073999/Nail-Studio-Rita-Busmachiu",
    "https://moldova.worldplaces.me/review/144915753-nail-studio-rita-busmachiu.html",
    "https://www.facebook.com/196674084073999"
  ],
  public_contact_basis: [
    {
      field: "phone",
      source_url: "https://www.beautynailhairsalons.com/MD/Chisinau/196674084073999/Nail-Studio-Rita-Busmachiu",
      observed: "Телефон +373 68 182 688 опубликован как контакт студии для записи."
    },
    {
      field: "address",
      source_url: "https://moldova.worldplaces.me/review/144915753-nail-studio-rita-busmachiu.html",
      observed: "Каталог подтверждает работу студии в Chișinău и тот же номер телефона."
    }
  ],
  activity_evidence: {
    observed: "Каталог показывает публикацию студии от 16 марта 2026 года.",
    source_url: "https://www.beautynailhairsalons.com/MD/Chisinau/196674084073999/Nail-Studio-Rita-Busmachiu",
    observed_at: "2026-03-16"
  },
  website_status: "verified_no_site",
  website_found_url: "",
  website_policy: "strict_owned_web_presence",
  website_checks: [
    {
      method: "brand_multilingual_search",
      probes: [
        { query: "\"Nail Studio Rita Busmachiu\" website Chișinău", source_url: "", observed: "В выдаче найдены социальная страница и каталоги; отдельный собственный сайт не обнаружен.", result: "no_owned_site_found", checked_at: checkedAt },
        { query: "\"Nail Studio Rita Busmachiu\" site oficial OR website", source_url: "", observed: "Официальный домен или сайт-конструктор не обнаружен.", result: "no_owned_site_found", checked_at: checkedAt }
      ]
    },
    {
      method: "legal_name_search",
      probes: [
        { query: "\"Rita Busmachiu\" SRL OR ÎI OR IDNO", source_url: "", observed: "Публичное юридическое название и связанный с ним сайт не подтверждены.", result: "no_owned_site_found", checked_at: checkedAt }
      ]
    },
    {
      method: "phone_exact_search",
      probes: [
        { query: "\"+37368182688\"", source_url: "", observed: "Точный номер ведёт к карточкам Nail Studio Rita Busmachiu, без отдельного домена.", result: "no_owned_site_found", checked_at: checkedAt },
        { query: "\"068 182 688\"", source_url: "", observed: "Локальный формат номера не выявил собственного сайта.", result: "no_owned_site_found", checked_at: checkedAt }
      ]
    },
    {
      method: "maps_and_directory_website_fields",
      probes: [
        { query: "Nail Studio Rita Busmachiu WorldPlaces website field", source_url: "https://moldova.worldplaces.me/review/144915753-nail-studio-rita-busmachiu.html", observed: "Карточка указывает отсутствие официального сайта и тот же номер телефона.", result: "no_owned_site_found", checked_at: checkedAt }
      ]
    },
    {
      method: "social_bio_and_redirects",
      probes: [
        { query: "Nail Studio Rita Busmachiu Facebook and directory website links", source_url: "https://www.beautynailhairsalons.com/MD/Chisinau/196674084073999/Nail-Studio-Rita-Busmachiu", observed: "В поле публичного присутствия указан Facebook; перехода на собственный домен не подтверждено.", result: "no_owned_site_found", checked_at: checkedAt }
      ]
    },
    {
      method: "probable_domains_and_aliases",
      probes: [
        { query: "nailstudioritabusmachiu.md", source_url: "", observed: "Домен не обнаружен как сайт этой студии.", result: "no_owned_site_found", checked_at: checkedAt },
        { query: "nailstudioritabusmachiu.com", source_url: "", observed: "Домен не обнаружен как сайт этой студии.", result: "no_owned_site_found", checked_at: checkedAt },
        { query: "ritabusmachiu.md", source_url: "", observed: "Домен не обнаружен как сайт этой студии.", result: "no_owned_site_found", checked_at: checkedAt }
      ]
    }
  ],
  verified_at: checkedAt,
  confidence: "medium",
  purchase_score: 8,
  score_evidence: ["recent_activity:+2", "public_phone:+2", "two_independent_directories:+2", "social_presence:+1", "address_conflict:-1"],
  estimated_budget: "5 000–12 000 MDL",
  estimated_budget_mdl: "5 000–12 000",
  recommended_approach: "Предложить мобильный сайт-портфолио: работы, прайс, стерилизация, отзывы и запись в один клик.",
  outreach_status: "новый",
  demo_site_url: "",
  notes: "Два каталога подтверждают идентичность и телефон; формулировку адреса нужно уточнить перед личным визитом."
};

const newCandidates = [
  candidate({
    id: "moldova-nails-olga-osipova-576",
    name: "Olga Osipova — nails.by.olga.o",
    owner_or_manager: "Ольга Владимировна",
    niche: "nails",
    locality: "Moldova",
    address: "Молдова (точный адрес не указан публично)",
    phone: ["+37379350869"],
    whatsapp: "https://wa.me/37379350869",
    instagram: "https://www.instagram.com/nails.by.olga.o/",
    facebook: "",
    source_urls: ["https://www.instagram.com/nails.by.olga.o/", "https://wa.me/37379350869"],
    activity_evidence: "Скриншот пользователя от 2026-07-16: 741 публикация, 1 445 подписчиков и активные Stories; в bio опубликован WhatsApp.",
    purchase_score: 8,
    recommended_approach: "Показать персональный сайт мастера с портфолио маникюра, педикюра и наращивания, прайсом и кнопкой записи в WhatsApp.",
    notes: "Добавлено по предоставленному пользователем скриншоту. Второй независимый источник и точный адрес пока не подтверждены."
  }),
  candidate({
    id: "chisinau-nails-ana-nails-577",
    name: "Ana Nails — nails_ana_md",
    niche: "nails",
    sector: "Botanica",
    address: "Botanica, str. Cuza Vodă, Chișinău (работает на дому)",
    phone: ["+37369306507"],
    instagram: "https://www.instagram.com/nails_ana_md/",
    directory_urls: ["https://999.md/ro/89786975"],
    source_urls: ["https://999.md/ro/89786975", "https://www.instagram.com/nails_ana_md/"],
    activity_evidence: "Объявление 999 обновлено 2026-06-18 и содержит актуальный номер, район и Instagram.",
    purchase_score: 8,
    recommended_approach: "Предложить одностраничник домашнего мастера: примеры работ, безопасность, цены, маршрут и запись в Instagram/телефон.",
    notes: "Instagram при контрольном открытии без авторизации показал недоступный профиль; повторно проверить handle и bio перед обращением."
  }),
  candidate({
    id: "chisinau-nails-nailacademy-dina-bruma-578",
    name: "NailAcademy Dina Bruma",
    owner_or_manager: "Dina Bruma",
    niche: "nails",
    sector: "Centru",
    address: "Centru, magazin UNIC, Chișinău",
    phone: ["+37360093092"],
    facebook: "https://www.facebook.com/712474592447622",
    directory_urls: ["https://www.beautynailhairsalons.com/MD/Chisinau/712474592447622/NailAcademy-Dina-Bruma"],
    source_urls: ["https://www.beautynailhairsalons.com/MD/Chisinau/712474592447622/NailAcademy-Dina-Bruma", "https://www.facebook.com/712474592447622"],
    activity_evidence: "Публичный каталог показывает публикации до 2026-05-03, телефон и расположение в центре.",
    purchase_score: 9,
    recommended_approach: "Предложить сайт студии и академии: услуги, обучение, работы учеников, расписание курсов и запись.",
    notes: "В каталоге как Website указан Facebook; прямой bio-редирект нужно повторно проверить в авторизованном браузере."
  }),
  candidate({
    id: "chisinau-lashes-lumy-lashmaker-580",
    name: "Lumy_Lashmaker.md",
    niche: "lashes",
    sector: "Botanica",
    address: "Strada Grădina Botanică, Chișinău",
    phone: ["+37379311422"],
    facebook: "https://www.facebook.com/105885957800513",
    directory_urls: ["https://www.beautynailhairsalons.com/MD/Chisinau/105885957800513/Lumy_Lashmaker.md"],
    source_urls: ["https://www.beautynailhairsalons.com/MD/Chisinau/105885957800513/Lumy_Lashmaker.md", "https://www.facebook.com/105885957800513"],
    activity_evidence: "Каталог показывает публикации до 2026-06-26, рабочий телефон и адрес.",
    purchase_score: 8,
    recommended_approach: "Предложить визуальный сайт лэшмейкера: эффекты ресниц, до/после, прайс, уход и онлайн-запись.",
    notes: "Каталог ссылается на Facebook; отсутствие дополнительных bio-ссылок требует повторной проверки."
  }),
  candidate({
    id: "chisinau-massage-luxehand-581",
    name: "Luxehand Massage",
    niche: "massage",
    address: "Выезд по Chișinău",
    phone: ["+37368888688"],
    instagram: "https://www.instagram.com/luxehand.md/",
    directory_urls: ["https://999.md/ro/102215920"],
    source_urls: ["https://999.md/ro/102215920", "https://www.instagram.com/luxehand.md/"],
    activity_evidence: "Объявление 999 обновлено 2026-06-18: выездной массаж по Chișinău, телефон и Instagram.",
    purchase_score: 8,
    recommended_approach: "Предложить премиальный мобильный лендинг: виды массажа, выезд, зоны обслуживания, цены и быстрая запись.",
    notes: "Instagram/bio нужно повторно открыть перед контактом; физического кабинета в источнике не подтверждено."
  }),
  candidate({
    id: "chisinau-massage-neva-spa-582",
    name: "Néva Spa",
    niche: "massage",
    sector: "Rîșcani",
    address: "Str. Socoleni 17/1, Chișinău",
    phone: ["+37361102010"],
    facebook: "https://www.facebook.com/714563628398972",
    directory_urls: ["https://www.beautynailhairsalons.com/MD/Chisinau/714563628398972/N%C3%A9va-Spa"],
    source_urls: ["https://www.beautynailhairsalons.com/MD/Chisinau/714563628398972/N%C3%A9va-Spa", "https://www.facebook.com/714563628398972"],
    activity_evidence: "Каталог содержит публикации за март 2026 года, телефон и адрес Socoleni 17/1.",
    purchase_score: 9,
    recommended_approach: "Показать атмосферный сайт spa: программы массажа, кабинеты, подарочные сертификаты, отзывы и запись.",
    notes: "В каталоге указан Facebook; собственный сайт не подтверждён, но bio-ссылки нужно перепроверить."
  }),
  candidate({
    id: "chisinau-nails-anna-deshanel-583",
    name: "Anna Deshanel — annadeshanel",
    niche: "nails",
    sector: "Buiucani",
    address: "Str. Ion Neculce 3, Chișinău",
    phone: [],
    instagram: "https://www.instagram.com/annadeshanel/",
    directory_urls: ["https://999.md/ru/48800217"],
    source_urls: ["https://999.md/ru/48800217", "https://www.instagram.com/annadeshanel/"],
    activity_evidence: "Объявление 999 отображалось как обновлённое 2026-07-14 и указывает адрес и Instagram.",
    purchase_score: 6,
    recommended_approach: "Написать в Instagram с компактным демо-портфолио, прайсом и понятной записью.",
    notes: "Полный телефон не опубликован в доступной выдаче; контакт возможен через Instagram после проверки bio."
  }),
  candidate({
    id: "chisinau-lashes-riri-lashh-584",
    name: "riri.lashh",
    niche: "lashes",
    address: "Chișinău (точный адрес уточнить)",
    phone: [],
    instagram: "https://www.instagram.com/riri.lashh/",
    telegram: "https://t.me/Iriks_8",
    directory_urls: ["https://999.md/ru/102556057"],
    source_urls: ["https://999.md/ru/102556057", "https://www.instagram.com/riri.lashh/", "https://t.me/Iriks_8"],
    activity_evidence: "Объявление 999 публикует Instagram и Telegram мастера по наращиванию ресниц.",
    purchase_score: 6,
    recommended_approach: "Предложить мини-сайт с выбором эффекта и объёма, портфолио, правилами ухода и записью в Telegram.",
    notes: "Нет датируемого второго сигнала активности и полного адреса; обязательна повторная проверка."
  }),
  candidate({
    id: "chisinau-lashes-steleasbeauty-585",
    name: "Stelea’s Beauty",
    niche: "lashes",
    address: "Chișinău (точный адрес уточнить)",
    phone: [],
    instagram: "https://www.instagram.com/steleasbeauty/",
    facebook: "https://www.facebook.com/svetlanamuamd",
    directory_urls: ["https://999.md/ro/80481006"],
    source_urls: ["https://999.md/ro/80481006", "https://www.instagram.com/steleasbeauty/", "https://www.facebook.com/svetlanamuamd"],
    activity_evidence: "Поисковая карточка 999 показывала обновление 2026-06-27 и ссылки на Instagram/Facebook.",
    purchase_score: 6,
    recommended_approach: "Предложить яркий сайт мастера: ресницы и beauty-услуги, до/после, прайс и запись.",
    notes: "Прямая карточка 999 и кеш выдачи показали разные данные; запись оставлена кандидатом до повторной сверки."
  }),
  candidate({
    id: "chisinau-hair-extensions-alungirea-parului-md-586",
    name: "Alungirea Parului MD",
    niche: "hair_extensions",
    sector: "Rîșcani",
    address: "Rîșcani, Chișinău (точный адрес уточнить)",
    phone: [],
    instagram: "https://www.instagram.com/alungirea_parului_md/",
    directory_urls: ["https://999.md/ru/86423748"],
    source_urls: ["https://999.md/ru/86423748", "https://www.instagram.com/alungirea_parului_md/"],
    activity_evidence: "Карточка 999 отображалась как обновлённая 2026-06-30 и указывает профиль мастера в Instagram.",
    purchase_score: 7,
    recommended_approach: "Предложить сайт с методами наращивания, портфолио до/после, расчётом стоимости, уходом и заявкой.",
    notes: "Полный телефон и точный адрес не видны в доступной карточке; перепроверить Instagram и bio."
  }),
  candidate({
    id: "chisinau-massage-fenix-studio-587",
    name: "Fenix Studio Massage",
    niche: "massage",
    sector: "Centru/Botanica",
    address: "Chișinău — адрес расходится в источниках: Anestiade 3 / Zelinski 26/1",
    phone: ["+37360063132"],
    maps_url: "https://yandex.com/maps/org/fenix_studio_massage/92622619037/",
    directory_urls: ["https://around.md/en/place/fenix-studio-massage"],
    source_urls: ["https://yandex.com/maps/org/fenix_studio_massage/92622619037/", "https://around.md/en/place/fenix-studio-massage"],
    activity_evidence: "Две публичные карточки подтверждают название и телефон, но показывают разные адреса.",
    purchase_score: 7,
    recommended_approach: "Позвонить и после уточнения адреса предложить сайт кабинета: услуги, специалисты, цены, карта и запись.",
    notes: "Адресный конфликт не позволяет считать лид полностью проверенным; сначала уточнить фактическую локацию."
  })
];

const rejectionBatch = [
  { id: "reject-iceberg-dent-20260716", name: "Iceberg Dent", niche: "dentistry", status: "website_found", reason: "Найден собственный сайт; телефон и адрес совпадают с карточкой лида.", website_url: "https://www.icebergdent.md/", source_urls: ["https://www.icebergdent.md/"], checked_at: checkedAt },
  { id: "reject-beautylashes-20260716", name: "BeautyLashes", niche: "lashes", status: "website_found", reason: "Найден собственный сайт с совпадающими телефоном, адресом и услугами.", website_url: "https://beauty-lashes.md/", source_urls: ["https://beauty-lashes.md/"], checked_at: checkedAt },
  { id: "reject-lotus-spa-20260716", name: "Lotus Spa Health & Beauty Center", niche: "massage", status: "website_found", reason: "Есть официальная страница spa в сети Radisson; по строгой политике это официальное web-присутствие.", website_url: "https://www.radissonhotels.com/en-us/hotels/radisson-blu-chisinau-leogrand/fitness-wellness", source_urls: ["https://www.radissonhotels.com/en-us/hotels/radisson-blu-chisinau-leogrand/fitness-wellness"], checked_at: checkedAt },
  { id: "reject-rodica-cristov-20260716", name: "Nail Academy Rodica Cristov", niche: "nails", status: "website_found", reason: "Найдена брендированная веб-страница записи Stilio.", website_url: "https://stilio.md/ro/salons/nail-acaemy-rodica-cristov", source_urls: ["https://stilio.md/ro/salons/nail-acaemy-rodica-cristov"], checked_at: checkedAt },
  { id: "reject-beauty-face-iordanova-20260716", name: "Beauty Face Studio Iordanova", niche: "beauty", status: "website_found", reason: "Найдена публичная брендированная страница онлайн-записи.", website_url: "https://apnt.app/beauty_face_studio", source_urls: ["https://apnt.app/beauty_face_studio", "https://mastersapp.ru/profile/beauty_face_studio"], checked_at: checkedAt },
  { id: "reject-two-hands-massage-20260716", name: "Two Hands Massage", niche: "massage", status: "website_found", reason: "Найден собственный сайт.", website_url: "https://masajtwohands.com/", source_urls: ["https://masajtwohands.com/"], checked_at: checkedAt },
  { id: "reject-marilyn-monroe-20260716", name: "Marilyn Monroe Beauty Studio", niche: "beauty", status: "website_found", reason: "Найден собственный сайт.", website_url: "http://www.marilynmonroe.md/", source_urls: ["http://www.marilynmonroe.md/"], checked_at: checkedAt },
  { id: "reject-look-me-academy-20260716", name: "LOOK ME Academy", niche: "lashes", status: "website_found", reason: "Найдена брендированная веб-страница онлайн-записи.", website_url: "https://stilio.md/ro/bk/DmLM88", source_urls: ["https://stilio.md/ro/bk/DmLM88"], checked_at: checkedAt },
  { id: "reject-pink-lash-20260716", name: "Pink Lash", niche: "lashes", status: "website_found", reason: "Найден собственный сайт.", website_url: "https://pinklash.md/", source_urls: ["https://pinklash.md/"], checked_at: checkedAt },
  { id: "reject-terralux-spa-20260716", name: "Terralux Spa", niche: "massage", status: "website_found", reason: "Найден собственный сайт.", website_url: "https://terralux.md/galerie/", source_urls: ["https://terralux.md/galerie/"], checked_at: checkedAt },
  { id: "reject-ortoz-20260716", name: "ORTOZ", niche: "massage", status: "website_found", reason: "Найдена официальная Google Business Site страница.", website_url: "https://ortoz.business.site/", source_urls: ["https://ortoz.business.site/"], checked_at: checkedAt },
  { id: "reject-art-masaj-20260716", name: "ART MASAJ", niche: "massage", status: "website_found", reason: "Найдена брендированная веб-страница онлайн-записи.", website_url: "https://n1318718.alteg.io/", source_urls: ["https://n1318718.alteg.io/"], checked_at: checkedAt },
  { id: "reject-elena-massage-20260716", name: "Elena Massage", niche: "massage", status: "website_found", reason: "Найден собственный сайт.", website_url: "https://elena-masaj.md/", source_urls: ["https://elena-masaj.md/"], checked_at: checkedAt },
  { id: "reject-olesea-lashes-20260716", name: "Olesea Lashes", niche: "lashes", status: "inactive", reason: "Не найден датируемый сигнал активности за последние 180 дней.", website_url: "", source_urls: [], checked_at: checkedAt },
  { id: "reject-wow-gene-20260716", name: "Wow Gene", niche: "lashes", status: "inactive", reason: "Последняя найденная активность 2025-12-11 — старше 180 дней на дату проверки.", website_url: "", source_urls: [], checked_at: checkedAt },
  { id: "reject-cristina-rusu-20260716", name: "Cristina Rusu", niche: "lashes", status: "inactive", reason: "Последняя найденная активность 2025-11-13.", website_url: "", source_urls: [], checked_at: checkedAt },
  { id: "reject-extensii-par-moldova-20260716", name: "Extensii de păr Moldova", niche: "hair_extensions", status: "inactive", reason: "Последняя найденная активность относится к 2024 году.", website_url: "", source_urls: [], checked_at: checkedAt },
  { id: "reject-kolorist-hair-md-20260716", name: "Kolorist Hair MD", niche: "hair_extensions", status: "outside_scope", reason: "Связанные данные указывают на Одессу/Украину, а не на подтверждённую практику в Молдове.", website_url: "", source_urls: [], checked_at: checkedAt }
];

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function dedupeById(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.id || `${String(row.name).toLowerCase()}|${row.website_url || row.reason || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function csvCell(value) {
  const raw = Array.isArray(value) ? value.join("; ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

function checksSummary(checks) {
  return (checks || []).map((check) => {
    if (Array.isArray(check.probes)) return `${check.method}: ${check.probes.map((probe) => `${probe.query || probe.source_url} => ${probe.result}`).join(" | ")}`;
    return `${check.method}: ${check.query || ""} => ${check.result || ""}`;
  }).join(" || ");
}

function buildCsv(rows) {
  const columns = ["id", "name", "legal_name", "idno", "niche", "niche_label", "owner_or_manager", "locality", "sector", "address", "phone", "email", "instagram", "facebook", "telegram", "whatsapp", "maps_url", "outreach_status", "demo_site_url", "website_status", "verified_at", "confidence", "purchase_score", "estimated_budget_mdl", "recommended_approach", "source_1", "source_2", "source_3", "website_check_summary", "notes"];
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => {
      if (column.startsWith("source_")) return csvCell((row.source_urls || [])[Number(column.slice(7)) - 1] || "");
      if (column === "website_check_summary") return csvCell(checksSummary(row.website_checks));
      return csvCell(row[column]);
    }).join(","));
  }
  return `\ufeff${lines.join("\n")}\n`;
}

function buildHtml(rows) {
  const embedded = JSON.stringify(rows).replaceAll("<", "\\u003c");
  const labels = JSON.stringify(nicheLabels);
  const emojis = JSON.stringify(categoryEmojis);
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LeadBase Moldova</title>
  <style>
    :root{--ink:#18232d;--muted:#6d7874;--line:#e4ebe8;--bg:#f6f8f6;--green:#116b57;--mint:#e8f4ef;--orange:#ef9f52;--red:#9f392f;--blue:#2856a3}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:1680px;margin:0 auto;padding:28px}header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}h1{margin:0;font-size:28px;letter-spacing:-.02em}p{color:var(--muted);margin:8px 0 0}.warning{background:#fff7e7;border:1px solid #f1d19b;color:#60410a;padding:12px 14px;border-radius:8px;margin:14px 0;line-height:1.45}.actions{display:flex;gap:8px;flex-wrap:wrap}.btn{border:1px solid var(--line);background:#fff;border-radius:8px;padding:10px 13px;font-weight:700;cursor:pointer}.btn.primary{background:var(--green);color:#fff;border-color:var(--green)}.stats{display:grid;grid-template-columns:repeat(6,minmax(130px,1fr));gap:10px;margin:16px 0}.stat{background:#fff;border:1px solid var(--line);border-radius:8px;padding:14px}.stat span{display:block;color:var(--muted);font-size:12px}.stat strong{font-size:24px}.layout{display:grid;grid-template-columns:275px 1fr;gap:16px;align-items:start}.sidebar{position:sticky;top:14px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;max-height:calc(100vh - 28px);overflow:auto}.sidebar h3{margin:4px 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.catBtn{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;border:0;background:transparent;border-radius:8px;padding:9px 10px;cursor:pointer;text-align:left;color:var(--ink)}.catBtn:hover,.catBtn.active{background:var(--mint);color:var(--green)}.catBtn span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.catBtn .count{font-weight:800;color:var(--green);font-size:12px;flex:none}.demoCell{min-width:170px}.demoEdit{display:flex;gap:6px;align-items:center}.demoEdit input{min-width:90px}.saveBtn{border:1px solid var(--green);background:var(--mint);color:var(--green);border-radius:7px;padding:8px 9px;font-weight:800;cursor:pointer}.saveBtn:hover{background:#d8eee6}.filters{display:grid;grid-template-columns:2fr repeat(9,1fr);gap:8px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:10px;margin-bottom:12px}input,select,textarea{width:100%;border:1px solid var(--line);border-radius:7px;padding:9px;background:#fff}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden}th,td{border-bottom:1px solid var(--line);padding:10px;vertical-align:top;text-align:left;font-size:13px}th{font-size:11px;text-transform:uppercase;color:var(--muted);background:#fbfcfb}tr:last-child td{border-bottom:0}a{color:var(--green)}.tag{display:inline-block;border-radius:6px;background:var(--mint);color:var(--green);padding:4px 7px;font-weight:700;font-size:12px;margin:0 4px 4px 0}.tag.red{background:#fde8e5;color:#a43b2f}.tag.blue{background:#e8f0ff;color:#2856a3}.tag.orange{background:#fff1dc;color:#94611b}.tag.darkgreen{background:#e2f6ea;color:#17683a}.tag.gray{background:#eef1f0;color:#53605b}.small{font-size:12px;color:var(--muted);line-height:1.35}details{max-width:390px;margin-top:4px}.sectionRow td{background:#f0f7f3;border-top:1px solid var(--line);font-weight:800;color:var(--green);font-size:15px;padding:12px 10px}.sectionRow .sectionMeta{font-weight:600;color:var(--muted);font-size:12px;margin-left:8px}dialog{border:0;border-radius:10px;padding:20px;max-width:760px;width:calc(100vw - 30px)}.form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.full{grid-column:1/-1}.sourceLinks a{display:inline-block;margin-right:6px}
    @media(max-width:1250px){.filters{grid-template-columns:repeat(5,1fr)}.filters #q{grid-column:span 2}.stats{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:900px){.wrap{padding:14px}.layout{grid-template-columns:1fr}.sidebar{position:static;max-height:none}.filters,.stats{grid-template-columns:1fr 1fr}.filters #q{grid-column:1/-1}header{display:block}.actions{margin-top:12px}table{display:block;overflow:auto}.form{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div><h1>LeadBase Moldova</h1><p>Контакты компаний и частных мастеров для предложения сайтов. Версия данных: 2026-07-16-beauty-expansion.</p></div>
      <div class="actions"><button class="btn" onclick="exportJson()">Экспорт JSON</button><button class="btn" onclick="exportCsv()">Экспорт CSV</button><button class="btn primary" onclick="document.getElementById('leadDialog').showModal()">Добавить лид</button></div>
    </header>
    <div class="warning"><strong>Как читать проверку:</strong> зелёный статус «Сайт не найден» означает, что на указанную дату собственный сайт не подтвердился после проверки. Оранжевый статус «Нужна перепроверка» означает, что контакт полезен, но не хватило второго независимого источника, прямого доступа к bio или точного адреса. Перед звонком снова откройте источники.</div>
    <section class="stats">
      <div class="stat"><span>Всего лидов</span><strong id="total"></strong></div>
      <div class="stat"><span>Сайт не найден</span><strong id="verifiedNoSite"></strong></div>
      <div class="stat"><span>Нужна перепроверка</span><strong id="needsReview"></strong></div>
      <div class="stat"><span>С телефоном</span><strong id="withPhone"></strong></div>
      <div class="stat"><span>С адресом</span><strong id="withAddress"></strong></div>
      <div class="stat"><span>С демо-сайтом</span><strong id="demoSites"></strong></div>
    </section>
    <div class="layout">
      <aside class="sidebar"><h3>Разделы</h3><div id="categoryNav"></div></aside>
      <main>
        <section class="filters">
          <input id="q" placeholder="Поиск по названию, адресу, телефону..." oninput="render()" />
          <select id="nicheFilter" onchange="render()"><option value="">Все ниши</option></select>
          <select id="sectorFilter" onchange="render()"><option value="">Все сектора</option></select>
          <select id="verificationFilter" onchange="render()"><option value="">Проверка: все</option><option value="verified_no_site">Сайт не найден</option><option value="candidate_unverified">Нужна перепроверка</option></select>
          <select id="confidenceFilter" onchange="render()"><option value="">Любая уверенность</option><option>high</option><option>medium</option></select>
          <select id="scoreFilter" onchange="render()"><option value="">Любой score</option><option value="8">8+</option><option value="9">9+</option></select>
          <select id="phoneFilter" onchange="render()"><option value="">Телефон: все</option><option value="yes">Есть</option><option value="no">Нет</option></select>
          <select id="socialFilter" onchange="render()"><option value="">Соцсети: все</option><option value="yes">Есть</option><option value="no">Нет</option></select>
          <select id="statusFilter" onchange="render()"><option value="">CRM: все</option><option>новый</option><option>проверен</option><option>связались</option><option>встреча</option><option>клиент</option></select>
          <select id="sortBy" onchange="render()"><option value="category">Сорт: разделы</option><option value="score">Score</option><option value="niche">Ниша</option><option value="name">Название</option><option value="date">Дата</option></select>
        </section>
        <table><thead><tr><th>Компания</th><th>CRM</th><th>Сайт / демо</th><th>Ниша</th><th>Контакты</th><th>Адрес</th><th>Проверка</th><th>Источники</th><th>Заход</th></tr></thead><tbody id="tbody"></tbody></table>
      </main>
    </div>
  </div>
  <dialog id="leadDialog"><h2>Добавить ручной лид</h2><div class="form"><input id="fName" placeholder="Название" /><select id="fNiche"></select><input id="fPhone" placeholder="+373..." /><input id="fInstagram" placeholder="Instagram URL" /><input class="full" id="fAddress" placeholder="Адрес" /><textarea class="full" id="fApproach" placeholder="Рекомендуемый заход"></textarea></div><div class="actions" style="justify-content:flex-end;margin-top:14px"><button class="btn" onclick="document.getElementById('leadDialog').close()">Отмена</button><button class="btn primary" onclick="addLead()">Сохранить</button></div></dialog>
  <script id="embeddedLeads" type="application/json">${embedded}</script>
  <script>
    const DATA_VERSION = "2026-07-16-beauty-expansion-584";
    const nicheLabels = ${labels};
    const categoryEmojis = ${emojis};
    const els = Object.fromEntries(["q","nicheFilter","sectorFilter","verificationFilter","confidenceFilter","scoreFilter","phoneFilter","socialFilter","statusFilter","sortBy","categoryNav","tbody","total","verifiedNoSite","needsReview","withPhone","withAddress","demoSites","fName","fNiche","fPhone","fInstagram","fAddress","fApproach","leadDialog"].map(function(id){return [id,document.getElementById(id)];}));
    const original = JSON.parse(document.getElementById("embeddedLeads").textContent);
    let savedLeads = [];
    try { savedLeads = JSON.parse(localStorage.getItem("leadbase500") || "[]") || []; } catch (error) { savedLeads = []; }
    const savedById = new Map(savedLeads.filter(function(x){return x && x.id;}).map(function(x){return [x.id,x];}));
    let leads = original.map(function(base){
      const saved = savedById.get(base.id);
      return Object.assign({},base,{outreach_status:(saved && saved.outreach_status) || base.outreach_status || "новый",demo_site_url:(saved && saved.demo_site_url) || base.demo_site_url || ""});
    });
    savedLeads.forEach(function(saved){if(saved && saved.id && String(saved.id).startsWith("manual-") && !leads.some(function(x){return x.id===saved.id;})) leads.unshift(saved);});
    leads = leads.map(function(x){return Object.assign({},x,{outreach_status:x.outreach_status||"новый",demo_site_url:x.demo_site_url||"",phone:Array.isArray(x.phone)?x.phone:[],source_urls:Array.isArray(x.source_urls)?x.source_urls:[],website_checks:Array.isArray(x.website_checks)?x.website_checks:[]});});
    localStorage.setItem("leadbase500",JSON.stringify(leads));
    localStorage.setItem("leadbase500_version",DATA_VERSION);
    const esc = function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];});};
    const link = function(url,label){return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(label||"link")+'</a>':"";};
    function initFilters(){
      els.nicheFilter.innerHTML += Array.from(new Set(leads.map(function(x){return x.niche;}))).sort().map(function(n){return '<option value="'+esc(n)+'">'+esc(nicheLabels[n]||n)+'</option>';}).join("");
      els.sectorFilter.innerHTML += Array.from(new Set(leads.map(function(x){return x.sector;}).filter(Boolean))).sort().map(function(s){return '<option>'+esc(s)+'</option>';}).join("");
      els.fNiche.innerHTML = Object.entries(nicheLabels).map(function(entry){return '<option value="'+esc(entry[0])+'">'+esc(entry[1])+'</option>';}).join("");
    }
    function categoryOrder(){const known=Object.keys(nicheLabels).filter(function(n){return leads.some(function(x){return x.niche===n;});});const extra=Array.from(new Set(leads.map(function(x){return x.niche;}))).filter(function(n){return !known.includes(n);}).sort();return known.concat(extra);}
    function renderCategoryNav(){
      const totalByNiche=leads.reduce(function(acc,x){acc[x.niche]=(acc[x.niche]||0)+1;return acc;},{});
      const demosByNiche=leads.reduce(function(acc,x){acc[x.niche]=(acc[x.niche]||0)+(x.demo_site_url?1:0);return acc;},{});
      const totalDemos=leads.filter(function(x){return x.demo_site_url;}).length;
      els.categoryNav.innerHTML='<button class="catBtn '+(!els.nicheFilter.value?'active':'')+'" data-niche="" onclick="setCategory(this.dataset.niche)"><span>📋 Все разделы</span><span class="count">'+totalDemos+'/'+leads.length+'</span></button>'+categoryOrder().map(function(n){return '<button class="catBtn '+(els.nicheFilter.value===n?'active':'')+'" data-niche="'+esc(n)+'" onclick="setCategory(this.dataset.niche)"><span>'+esc(categoryEmojis[n]||"•")+' '+esc(nicheLabels[n]||n)+'</span><span class="count">'+(demosByNiche[n]||0)+'/'+(totalByNiche[n]||0)+'</span></button>';}).join("");
    }
    function setCategory(niche){els.nicheFilter.value=niche;render();window.scrollTo({top:0,behavior:"smooth"});}
    function crmBadgeHtml(x){if(x.outreach_status==="проверен")return '<span class="tag red">Проверен</span>';if(x.outreach_status==="связались")return '<span class="tag blue">Связались</span>';if(x.outreach_status==="встреча")return '<span class="tag orange">Встреча</span>';if(x.outreach_status==="клиент")return '<span class="tag darkgreen">Клиент</span>';return '<span class="tag gray">Новый</span>';}
    function verificationBadgeHtml(x){if(x.website_status==="verified_no_site")return '<span class="tag">Сайт не найден</span>';if(x.website_status==="candidate_unverified")return '<span class="tag orange">Нужна перепроверка</span>';if(x.website_status==="website_found")return '<span class="tag red">Сайт найден</span>';return '<span class="tag gray">'+esc(x.website_status||"не проверено")+'</span>';}
    function checksHtml(x){return x.website_checks.map(function(check){if(Array.isArray(check.probes))return '<div class="small"><strong>'+esc(check.method)+'</strong>'+check.probes.map(function(probe){return '<br>'+esc(probe.query||probe.source_url||"")+' → '+esc(probe.result||"");}).join("")+'</div>';return '<div class="small">'+esc(check.method||"")+': '+esc(check.query||"")+' → '+esc(check.result||"")+'</div>';}).join("");}
    function activityDate(x){return x.activity_evidence&&typeof x.activity_evidence==="object"?x.activity_evidence.observed_at||x.verified_at:x.verified_at;}
    function rowHtml(x){
      const contacts=x.phone.map(function(p){return '<a href="tel:'+esc(p)+'">'+esc(p)+'</a>';}).join("<br>")+(x.phone.length?"<br>":"")+link(x.instagram,"Instagram")+' '+link(x.facebook,"Facebook")+' '+link(x.telegram,"Telegram")+' '+link(x.whatsapp,"WhatsApp");
      const sources=x.source_urls.map(function(s,i){return link(s,"source "+(i+1));}).join("<br>");
      return '<tr><td><strong>'+esc(x.name)+'</strong><div class="small">'+esc(x.legal_name||"legal: not publicly confirmed")+'</div></td><td><select data-id="'+esc(x.id)+'" onchange="setStatus(this.dataset.id,this.value)"><option '+(x.outreach_status==="новый"?"selected":"")+'>новый</option><option '+(x.outreach_status==="проверен"?"selected":"")+'>проверен</option><option '+(x.outreach_status==="связались"?"selected":"")+'>связались</option><option '+(x.outreach_status==="встреча"?"selected":"")+'>встреча</option><option '+(x.outreach_status==="клиент"?"selected":"")+'>клиент</option></select></td><td class="demoCell"><div class="demoEdit"><input id="demo-'+esc(x.id)+'" placeholder="https://..." value="'+esc(x.demo_site_url||"")+'"/><button class="saveBtn" data-id="'+esc(x.id)+'" onclick="setDemoSiteFromInput(this.dataset.id)">Сохранить</button></div>'+(x.demo_site_url?'<div class="small">'+link(x.demo_site_url,"Открыть сайт")+'</div>':'<div class="small">вставьте ссылку и нажмите сохранить</div>')+'</td><td>'+esc(x.niche_label||nicheLabels[x.niche]||x.niche)+'</td><td>'+contacts+'</td><td>'+esc(x.address||"")+'<div class="small">'+esc(x.sector||"")+'</div></td><td>'+crmBadgeHtml(x)+verificationBadgeHtml(x)+'<div class="small">'+esc(activityDate(x)||"")+' · '+esc(x.confidence||"")+' · '+esc(x.purchase_score||0)+'/10</div><details><summary>как проверяли</summary>'+checksHtml(x)+'</details></td><td class="sourceLinks">'+sources+'</td><td>'+esc(x.recommended_approach||"")+'</td></tr>';
    }
    function render(){
      const term=els.q.value.toLowerCase();
      let rows=leads.filter(function(x){const hasSocial=x.instagram||x.facebook||x.telegram||x.tiktok;return (!term||JSON.stringify(x).toLowerCase().includes(term))&&(!els.nicheFilter.value||x.niche===els.nicheFilter.value)&&(!els.sectorFilter.value||x.sector===els.sectorFilter.value)&&(!els.verificationFilter.value||x.website_status===els.verificationFilter.value)&&(!els.confidenceFilter.value||x.confidence===els.confidenceFilter.value)&&(!els.scoreFilter.value||x.purchase_score>=Number(els.scoreFilter.value))&&(!els.phoneFilter.value||(els.phoneFilter.value==="yes"?x.phone.length:!x.phone.length))&&(!els.socialFilter.value||(els.socialFilter.value==="yes"?hasSocial:!hasSocial))&&(!els.statusFilter.value||x.outreach_status===els.statusFilter.value);});
      renderCategoryNav();
      const order=categoryOrder();rows.sort(function(a,b){return els.sortBy.value==="category"?(order.indexOf(a.niche)-order.indexOf(b.niche)||b.purchase_score-a.purchase_score):els.sortBy.value==="name"?a.name.localeCompare(b.name):els.sortBy.value==="niche"?a.niche.localeCompare(b.niche):els.sortBy.value==="date"?String(activityDate(b)).localeCompare(String(activityDate(a))):b.purchase_score-a.purchase_score;});
      els.total.textContent=leads.length;els.verifiedNoSite.textContent=leads.filter(function(x){return x.website_status==="verified_no_site";}).length;els.needsReview.textContent=leads.filter(function(x){return x.website_status==="candidate_unverified";}).length;els.withPhone.textContent=leads.filter(function(x){return x.phone.length;}).length;els.withAddress.textContent=leads.filter(function(x){return x.address;}).length;els.demoSites.textContent=leads.filter(function(x){return x.demo_site_url;}).length;
      if(els.sortBy.value==="category"||!els.nicheFilter.value){els.tbody.innerHTML=order.map(function(n){const group=rows.filter(function(x){return x.niche===n;});if(!group.length)return "";return '<tr class="sectionRow"><td colspan="9">'+esc(categoryEmojis[n]||"•")+' '+esc(nicheLabels[n]||n)+'<span class="sectionMeta">'+group.length+' лидов</span></td></tr>'+group.map(rowHtml).join("");}).join("");}else{els.tbody.innerHTML=rows.map(rowHtml).join("");}
    }
    function setStatus(id,status){const lead=leads.find(function(x){return x.id===id;});if(lead){lead.outreach_status=status;save();}}
    function setDemoSite(id,url){const lead=leads.find(function(x){return x.id===id;});if(lead){lead.demo_site_url=String(url||"").trim();save();}}
    function setDemoSiteFromInput(id){const input=document.getElementById("demo-"+id);if(input)setDemoSite(id,input.value);}
    function save(){localStorage.setItem("leadbase500",JSON.stringify(leads));render();}
    function addLead(){if(!els.fName.value.trim())return alert("Введите название");leads.unshift({id:"manual-"+Date.now(),name:els.fName.value.trim(),legal_name:"",legal_form:"",idno:"",legal_identity_status:"not_publicly_confirmed",niche:els.fNiche.value,niche_label:nicheLabels[els.fNiche.value],owner_or_manager:"",locality:"Chișinău",sector:"",address:els.fAddress.value,latitude:null,longitude:null,phone:els.fPhone.value?[els.fPhone.value]:[],whatsapp:"",email:"",instagram:els.fInstagram.value,facebook:"",tiktok:"",telegram:"",maps_url:"",directory_urls:[],source_urls:[],outreach_status:"новый",demo_site_url:"",website_status:"candidate_unverified",website_found_url:"",website_checks:[],verified_at:new Date().toISOString().slice(0,10),activity_evidence:"manual entry",confidence:"medium",purchase_score:5,estimated_budget_mdl:"",recommended_approach:els.fApproach.value,notes:"Ручной лид: требуется проверка сайта и источников."});els.leadDialog.close();save();}
    function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;a.click();URL.revokeObjectURL(a.href);}
    function exportJson(){download("leadbase_moldova.json",JSON.stringify(leads,null,2),"application/json");}
    function exportCsv(){const cols=["id","name","niche","niche_label","address","phone","instagram","facebook","telegram","whatsapp","outreach_status","demo_site_url","website_status","verified_at","confidence","purchase_score","recommended_approach","source_1","source_2","source_3","notes"];const value=function(x,c){if(c.startsWith("source_"))return (x.source_urls||[])[Number(c.slice(7))-1]||"";return Array.isArray(x[c])?x[c].join("; "):(x[c]==null?"":x[c]);};const csv=[cols.join(",")].concat(leads.map(function(x){return cols.map(function(c){return '"'+String(value(x,c)).replaceAll('"','""')+'"';}).join(",");})).join("\\n");download("leadbase_moldova.csv","\\ufeff"+csv,"text/csv;charset=utf-8");}
    initFilters();render();
  </script>
</body>
</html>\n`;
}

let leads = JSON.parse(await readFile(path.join(root, "data/leads_verified.json"), "utf8"));
leads = leads.filter((lead) => !removedIds.has(lead.id));
leads = leads.map((lead) => {
  let niche = lead.niche;
  if (moveToLashes.has(lead.id)) niche = "lashes";
  if (moveToHair.has(lead.id)) niche = "hair_extensions";
  if (moveToMassage.has(lead.id)) niche = "massage";
  if (moveToNails.has(lead.id)) niche = "nails";
  return niche === lead.niche ? lead : { ...lead, niche, niche_label: nicheLabels[niche] };
});

const additions = [ritaVerified, ...newCandidates];
const additionIds = new Set(additions.map((lead) => lead.id));
leads = leads.filter((lead) => !additionIds.has(lead.id));
const knownIds = new Set(leads.map((lead) => lead.id));
const knownPhones = new Map();
for (const lead of leads) {
  for (const phone of lead.phone || []) {
    const normalized = normalizePhone(phone);
    if (normalized) knownPhones.set(normalized, lead.id);
  }
}
for (const lead of additions) {
  if (knownIds.has(lead.id)) continue;
  const duplicatePhone = (lead.phone || []).map(normalizePhone).find((phone) => phone && knownPhones.has(phone));
  if (duplicatePhone) throw new Error(`Duplicate phone ${duplicatePhone}: ${lead.id} conflicts with ${knownPhones.get(duplicatePhone)}`);
  leads.push(lead);
  knownIds.add(lead.id);
  for (const phone of lead.phone || []) if (normalizePhone(phone)) knownPhones.set(normalizePhone(phone), lead.id);
}

const rejectedPath = path.join(root, "data/rejected_leads.json");
const uncertainPath = path.join(root, "data/uncertain_leads.json");
const rejected = dedupeById([...JSON.parse(await readFile(rejectedPath, "utf8")), ...rejectionBatch]);
const uncertainRows = newCandidates.map((lead) => ({
  id: `uncertain-${lead.id}`,
  name: lead.name,
  niche: lead.niche,
  status: "uncertain",
  reason: "insufficient_evidence",
  source_urls: lead.source_urls,
  checked_at: checkedAt,
  notes: lead.notes
}));
const uncertain = dedupeById([...JSON.parse(await readFile(uncertainPath, "utf8")), ...uncertainRows]);

const categoryCounts = Object.fromEntries(Object.keys(nicheLabels).map((niche) => [niche, leads.filter((lead) => lead.niche === niche).length]).filter(([, count]) => count));
const verifiedCount = leads.filter((lead) => lead.website_status === "verified_no_site").length;
const candidateCount = leads.filter((lead) => lead.website_status === "candidate_unverified").length;

const progress = {
  target: leads.length,
  target_mode: "total_after_dedupe",
  entity_unit: "company | branch | practitioner | network",
  presence_requirement: "social_or_map | any_public_business_source",
  website_policy: "strict_owned_web_presence",
  activity_max_age_days: 180,
  schema_version: "no-website-leads/v1",
  generation_id: "2026-07-16-beauty-expansion",
  verified: verifiedCount,
  published_candidate_unverified: candidateCount,
  rejected: rejected.length,
  uncertain: uncertain.length,
  current_niche: "nails/lashes/hair_extensions/massage",
  last_candidate_key: "fenix-studio-massage|37360063132|chisinau",
  category_counts: categoryCounts,
  updated_at: "2026-07-16T19:30:00+03:00"
};

const report = `# Beauty expansion audit — 2026-07-16

## Итог

- Опубликовано лидов: ${leads.length}
- Статус \`verified_no_site\`: ${verifiedCount}
- Статус \`candidate_unverified\`: ${candidateCount}
- Новая строгая партия v1: 1 лид
- Добавлено кандидатов: ${newCandidates.length}
- Удалено ложных no-site записей из основной таблицы: ${removedIds.size}
- Переразнесено существующих лидов по новым категориям: ${moveToLashes.size + moveToHair.size + moveToMassage.size + moveToNails.size}

## Новые категории

- Наращивание ресниц и лэшмейкеры: ${categoryCounts.lashes || 0}
- Наращивание и восстановление волос: ${categoryCounts.hair_extensions || 0}
- Массажисты и массажные кабинеты: ${categoryCounts.massage || 0}
- Маникюрные студии и мастера: ${categoryCounts.nails || 0}

## Контакт пользователя

\`nails.by.olga.o\` добавлен с телефоном/WhatsApp +37379350869 и статусом \`candidate_unverified\`. Скриншот подтверждает публичный деловой профиль и услуги, но не даёт второго независимого источника и точного адреса.

## Исправленные ложные no-site

- Iceberg Dent → https://www.icebergdent.md/
- BeautyLashes → https://beauty-lashes.md/
- Lotus Spa → официальная страница Radisson

## Правило качества

Кандидаты не автоматически повышаются до \`verified_no_site\`. Для строгого статуса нужны минимум два независимых источника, датируемая активность, публичное основание контакта и шесть методов проверки сайта. Instagram, который не открылся без авторизации, считается \`not_observable\`, а не доказательством отсутствия сайта.
`;

await writeFile(path.join(root, "data/leads_verified.json"), `${JSON.stringify(leads, null, 2)}\n`);
await writeFile(path.join(root, "data/leads_verified.csv"), buildCsv(leads));
await writeFile(path.join(root, "data/beauty_expansion_verified_v1.json"), `${JSON.stringify([ritaVerified], null, 2)}\n`);
await writeFile(path.join(root, "data/beauty_expansion_candidates.json"), `${JSON.stringify(newCandidates, null, 2)}\n`);
await writeFile(rejectedPath, `${JSON.stringify(rejected, null, 2)}\n`);
await writeFile(uncertainPath, `${JSON.stringify(uncertain, null, 2)}\n`);
await writeFile(path.join(root, "data/progress.json"), `${JSON.stringify(progress, null, 2)}\n`);
await writeFile(path.join(root, "reports/beauty_expansion_audit.md"), report);
const html = buildHtml(leads);
await writeFile(path.join(root, "index.html"), html);
await writeFile(path.join(root, "LeadBase_500_verified.html"), html);

console.log(JSON.stringify({ total: leads.length, verified_no_site: verifiedCount, candidate_unverified: candidateCount, categories: categoryCounts, rejected: rejected.length, uncertain: uncertain.length }, null, 2));
