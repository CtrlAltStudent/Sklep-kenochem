// Drzewo kategorii 3-poziomowe (jak na kenochem.098.pl) + przypisanie produktów do kategorii 3. poziomu.
// 1) tworzy/aktualizuje kategorie w panelu na podstawie src/lib/data.ts,
// 2) przypisuje produkty regułami po nazwie (pierwsza pasująca reguła wygrywa),
// 3) wypisuje raport: ile produktów w każdej kategorii i ile zostało bez typu.
// Uruchomienie: npx cross-env PAYLOAD_DB_PUSH=0 payload run src/scripts/sync-categories.ts   (DRY=1 – tylko raport)
import { getPayload } from "payload";
import config from "@payload-config";
import { categories } from "@/lib/data";

const DRY = process.env.DRY === "1";
const payload = await getPayload({ config });

// ---------- 1. Kategorie ----------
const all = (await payload.find({ collection: "categories", limit: 0, pagination: false, depth: 0, overrideAccess: true })).docs;
const bySlug = new Map(all.map((c) => [c.slug ?? "", c]));
const idOf = new Map<string, number>(all.map((c) => [c.slug ?? "", c.id]));

async function upsert(slug: string, data: { name: string; parent?: number; order: number; lucide?: string }) {
  const existing = bySlug.get(slug);
  if (DRY) { if (!existing) idOf.set(slug, -1); return; }
  if (existing) {
    const parentId = typeof existing.parent === "object" ? existing.parent?.id : existing.parent;
    if (existing.name !== data.name || (data.parent && parentId !== data.parent) || existing.order !== data.order || (data.lucide && existing.lucide !== data.lucide)) {
      await payload.update({ collection: "categories", id: existing.id, data: { ...data, lucide: data.lucide as never }, overrideAccess: true, depth: 0 });
    }
  } else {
    const doc = await payload.create({ collection: "categories", data: { ...data, slug, lucide: data.lucide as never }, overrideAccess: true, depth: 0 });
    idOf.set(slug, doc.id);
  }
}

for (const [ci, c] of categories.entries()) {
  await upsert(c.slug, { name: c.name, order: ci, lucide: c.lucide });
  for (const [si, s] of c.children.entries()) {
    await upsert(s.slug, { name: s.name, parent: idOf.get(c.slug), order: si, lucide: s.lucide });
    for (const [ti, t] of s.types.entries()) await upsert(t.slug, { name: t.name, parent: idOf.get(s.slug), order: ti });
  }
}
console.log(DRY ? "Kategorie: tryb podglądu (bez zapisu)" : "Kategorie zsynchronizowane");

// ---------- 2. Reguły przypisania ----------
// [podkategoria, nazwa typu (lub "" = tylko podkategoria), wyrażenie, ograniczenie do obecnego działu/podkategorii]
type Rule = [string, string, RegExp, string[]?];
const SAM = ["chemia-samochodowa", "myjnie-i-urzadzenia"];
const rules: Rule[] = [
  // Zapachy – bardzo charakterystyczne nazwy
  ["aromamarketing", "Olejki do dyfuzorów", /olejek[^|]*dyfuzor|do dyfuzora/],
  ["aromamarketing", "Dyfuzory zapachowe", /dyfuzor/],
  ["zapachy-do-domu", "Patyczki zapachowe", /patyczk/],
  ["zapachy-do-domu", "Świece zapachowe", /świec/],
  ["zapachy-do-domu", "Saszetki zapachowe", /saszetk/],
  ["zapachy-do-domu", "Olejki i esencje zapachowe", /olejek zapach|olejki zapach|esencj|olejek eteryczn/],
  ["neutralizatory", "One Shot", /one ?shot/],
  ["neutralizatory", "Automatyczne odświeżacze i wkłady", /wkład do dozownika|dozownik[^|]*zapach|freshblitz|automatyczn[^|]*odświeżacz|odświeżacz[^|]*automatyczn/],
  ["zapachy-samochodowe", "Zawieszki zapachowe", /zawieszk|choinka|wunder-?baum|little tree/],
  ["zapachy-samochodowe", "Perfumy samochodowe", /perfumy samochod|perfumy do (auta|samochodu)|evos|fresso/],
  ["zapachy-samochodowe", "Puszki zapachowe", /puszk[^|]*zapach|zapach[^|]*puszk|granulki|gel can/],
  ["wnetrze-samochodu", "Klimatyzacja samochodowa", /klimatyzac|odgrzyb/],
  ["aromamarketing", "Olejki do dyfuzorów", /aromamarketing/],
  ["zapachy-do-domu", "Świece zapachowe", /wosk zapachow|do kominka/],
  // Produkty z niewłaściwych podkategorii (posadzki, sanitariaty, odkamienianie, odplamiacze)
  ["chemia-obiektowa", "Łazienki i sanitariaty", /toalet|\bwc\b|pisuar|sanitariat|kratek ociekow/, ["chemia-profesjonalna", "chemia-specjalistyczna", "zapachy"]],
  ["chemia-obiektowa", "Podłogi i posadzki", /posadz|podłóg|podłog|szorowar/, ["chemia-profesjonalna", "chemia-specjalistyczna", "zapachy"]],
  ["chemia-obiektowa", "Mycie powierzchni", /granit|marmur|lastri|nagrob|kamienia sztuczn|gres/, ["chemia-profesjonalna", "chemia-specjalistyczna"]],
  ["kuchnia-i-gastronomia", "Odkamienianie urządzeń", /odkamien|destone|destoner|zero kamienia|osad[^|]*wapien/, ["chemia-profesjonalna", "chemia-specjalistyczna"]],
  ["pranie-i-tekstylia", "Odplamiacze", /odplam/, ["chemia-specjalistyczna", "chemia-profesjonalna"]],
  ["wnetrze-samochodu", "Kokpit i plastiki", /kokpit|cockpit|plastików|satina|plak/, ["chemia-samochodowa", "myjnie-i-urzadzenia", "zapachy"]],
  ["elementy-zewnetrzne", "Chrom i metale", /alu cleaner|alu remover|aluminium/, ["chemia-samochodowa", "myjnie-i-urzadzenia"]],
  // Wyraźnie samochodowe produkty, które trafiły do chemii obiektowej
  ["szyby-i-szklo", "Niewidzialne wycieraczki", /glaco|niewidzialna wycieraczka/],
  ["elementy-zewnetrzne", "Konserwacja podwozia", /podwozi/],
  ["elementy-zewnetrzne", "Dachy cabrio", /kabriolet|cabrio/],
  ["elementy-zewnetrzne", "Gumy i uszczelki", /uszczelek|pielęgnacji gumy/, ["chemia-samochodowa", "chemia-profesjonalna"]],
  ["elementy-zewnetrzne", "Plastiki zewnętrzne", /zderzak|spojler|tworzyw sztucz/, ["chemia-samochodowa", "chemia-profesjonalna"]],
  ["elementy-zewnetrzne", "Czyszczenie silnika", /engine|silnika/, ["chemia-samochodowa", "chemia-profesjonalna"]],
  ["pielegnacja-lakieru", "Cleanery, politury i AIO", /politur|perfect finish|zarysowa/, ["chemia-samochodowa", "chemia-profesjonalna"]],
  ["pielegnacja-lakieru", "Quick detailery", /detailer|quartz/, ["chemia-samochodowa", "chemia-profesjonalna"]],
  ["pielegnacja-lakieru", "Woski samochodowe", /karoserii/, ["chemia-profesjonalna"]],
  ["zapachy-samochodowe", "Perfumy samochodowe", /zapach samochodowy/],
  ["chemia-do-myjni", "Aktywne piany do myjni", /aktywna piana|piana aktywna|aktywna piana zapachowa|zapachowa aktywna/, ["zapachy"]],
  ["chemia-do-myjni", "Proszki do myjni samochodowych", /proszek do myjni|proszek[^|]*myjni/, ["zapachy", "chemia-do-myjni"]],
  ["chemia-obiektowa", "Szyby i lustra", /mycia szyb|do szyb/, ["zapachy"]],
  ["chemia-obiektowa", "Łazienki i sanitariaty", /pleś|grzyb/, ["chemia-profesjonalna"]],
  ["chemia-obiektowa", "Mycie powierzchni", /ekran|\blcd|indukc|ekspres|sauna|drewna/, ["chemia-profesjonalna"]],
  ["zmywacze-i-odtluszczacze", "Odtłuszczacze przemysłowe", /ropopochod|tłustych zanieczyszcz/, ["chemia-profesjonalna"]],

  // Transport, rolnictwo, specjalistyczne – jednoznaczne słowa
  ["transport", "Komory ładunkowe i chłodnie", /chłodni|komor[ay] ładunk|naczep/],
  ["transport", "Mycie pojazdów ciężarowych", /ciężarow|\btruck|\btir\b|plandek/],
  ["rolnictwo", "Mycie i dezynfekcja urządzeń udojowych", /udoj|udój|strzyk|dojar|mleczarsk|\bcip\b/],
  ["rolnictwo", "Chemia do wędzarni", /wędzar/],
  ["rolnictwo", "Higiena budynków inwentarskich", /obór|obory|chlew|kurnik|inwentar|stajni|ściółk/],
  ["rolnictwo", "Mycie maszyn rolniczych", /rolnicz|kombajn|traktor/],
  ["czyszczenie-zewnetrzne", "Mycie paneli fotowoltaicznych", /fotowolt|paneli solar|solarn/],
  ["czyszczenie-zewnetrzne", "Usuwanie mchu i zabrudzeń", /\bmch|mchu|glon|porost/],
  ["czyszczenie-zewnetrzne", "Kostka brukowa i kamień", /kostk[ai] bruk|kostki|bruk|taras/],
  ["czyszczenie-zewnetrzne", "Elewacje", /elewac/],
  ["czyszczenie-zewnetrzne", "Markizy i zadaszenia", /markiz|zadasz/],
  ["myjki-ultradzwiekowe", "Czyszczenie DPF/FAP", /\bdpf|\bfap\b/],
  ["myjki-ultradzwiekowe", "Płyny do myjek ultradźwiękowych", /ultradźwięk/],
  ["chemia-warsztatowa", "Dodatki do paliwa", /dodatek do (paliwa|oleju|benzyny|diesla)|do paliwa|wtrysk/],
  ["zmywacze-i-odtluszczacze", "Zmywacze do hamulców", /hamulc|brake/],
  ["zmywacze-i-odtluszczacze", "Odrdzewiacze", /odrdzew|\brdzy|\brust/],
  ["smary", "Smary do łańcuchów", /łańcuch/],
  ["smary", "Smary ceramiczne, miedziowe i grafitowe", /smar[^|]*(ceram|miedz|grafit)|(ceram|miedz|grafit)[^|]*smar/],
  ["smary", "Smary techniczne", /\bsmar|wd-?40|penetrant|\bolej (mos2|wielofunkc|uniwersal)/],
  ["higiena-rak", "Pasty BHP", /pasta bhp|pasta do (mycia )?rąk|\bbhp/],
  ["higiena-rak", "Kremy do rąk", /krem[^|]*rąk|krem ochronn|hand cream/],
  ["higiena-rak", "Dozowniki do mydła", /dozownik[^|]*(myd|żel|dezynf|pian)/],
  ["higiena-rak", "Dezynfekcja rąk", /dezynf[^|]*rąk|rąk[^|]*dezynf/],
  ["higiena-rak", "Mydła i żele do rąk", /mydł|żel do rąk|do mycia rąk|do rąk/],
  ["czysciwa-i-papier", "Papier toaletowy", /papier toalet/],
  ["czysciwa-i-papier", "Ręczniki papierowe", /ręcznik[^|]*papier|ręczniki zz|\bzz\b/],
  ["czysciwa-i-papier", "Podajniki i dozowniki", /podajnik/],
  ["czysciwa-i-papier", "Czyściwa przemysłowe", /czyściw/],
  ["kuchnia-i-gastronomia", "Płyny nabłyszczające do zmywarek", /nabłyszcz[^|]*zmywar|zmywar[^|]*nabłyszcz|płukan[^|]*zmywar/],
  ["kuchnia-i-gastronomia", "Chemia do zmywarek", /zmywar/],
  ["kuchnia-i-gastronomia", "Czyszczenie pieców, grilli i frytkownic", /piec|pieców|grill|frytkow|piekarnik|konwekto/],
  ["kuchnia-i-gastronomia", "Ręczne mycie naczyń", /naczyń|naczyn/],
  ["pranie-i-tekstylia", "Płyny do płukania", /płukan|zmiękcz/],
  ["pranie-i-tekstylia", "Pranie odzieży roboczej", /odzież|odzieży|roboczej/],
  ["pranie-i-tekstylia", "Proszki do prania", /proszek do prania|proszek[^|]*prani/],
  ["pranie-i-tekstylia", "Płyny i żele do prania", /(płyn|żel) do prania|do prania/],
  ["dywany-i-tapicerka", "Pranie dywanów", /dywan|wykładzin/],

  // Myjnie i urządzenia
  ["odkurzacze-i-tapicerka", "Akcesoria do odkurzaczy", /ssawk|do odkurzacz|odkurzacza|worek[^|]*odkurz/],
  ["odkurzacze-i-tapicerka", "Tornadory", /tornador|tornado/],
  ["odkurzacze-i-tapicerka", "Pistolety piorące", /pistolet[^|]*(prani|pior|tapicer)/],
  ["odkurzacze-i-tapicerka", "Odkurzacze piorące", /odkurzacz[^|]*pior|piorący|ekstrakt/],
  ["odkurzacze-i-tapicerka", "Odkurzacze", /odkurzacz/],
  ["opryskiwacze", "Pompki", /pompk/],
  ["opryskiwacze", "Opryskiwacze pneumatyczne", /opryskiwacz[^|]*(pneumat|kompresor|\bair\b)/],
  ["pianownice-i-oprysk", "Pianownice do myjek", /pianownic[^|]*(myjk|ls\d|1\/4|3\/8|karcher)|lanca pianow|pianow[^|]*lanc/],
  ["pianownice-i-oprysk", "Opryskiwacze pianujące", /opryskiwacz[^|]*pian|pianując|foamer/],
  ["pianownice-i-oprysk", "Pianownice ręczne", /pianownic/],
  ["pianownice-i-oprysk", "Opryskiwacze ciśnieniowe", /opryskiwacz/],
  ["czesci-do-myjek", "Dysze do myjek", /dysz|dyza|dusza 1\/4/],
  ["czesci-do-myjek", "Lance i pistolety", /lanc|pistolet/],
  ["czesci-do-myjek", "Węże i bębny", /\bwąż|\bwęż|bęben|bębna|zwijad/],
  ["czesci-do-myjek", "Filtry, redukcje i zawory", /filtr|zawór|zawor|redukc|regulator|by ?-?pas|bajpas|uszczelk|o-?ring|nypel|manometr|trójnik|komplet naprawcz|zestaw naprawcz|rękojeść/, ["myjnie-i-urzadzenia", "chemia-samochodowa"]],
  ["czesci-do-myjek", "Szybkozłącza i adaptery", /szybkozłącz|złącz|adapter|przejściów|kolank|końcówk/],
  ["czesci-do-myjek", "Akcesoria do myjek", /zbiornik|inżektor|rurka|obrotnic|pompa|wózek/, ["myjnie-i-urzadzenia"]],
  ["wyposazenie-stanowisk-mycia", "Uchwyty do dywaników", /dywanik/],
  ["wyposazenie-stanowisk-mycia", "Szczotki do myjni", /szczotk[^|]*(myjni|włosie)|włosie/, ["myjnie-i-urzadzenia"]],
  ["chemia-do-myjni", "Proszki do myjni samochodowych", /proszek/, ["chemia-do-myjni"]],
  ["chemia-do-myjni", "Woski osuszające i hydrowoski", /osusza|hydrowosk|wosk|dryer|wax/, ["chemia-do-myjni"]],
  ["chemia-do-myjni", "Preparaty do felg do myjni", /felg|wheel/, ["chemia-do-myjni"]],
  ["chemia-do-myjni", "Preparaty do owadów, smoły i asfaltu", /owad|insekt|smoł|asfalt|\bbug/, ["chemia-do-myjni"]],
  ["chemia-do-myjni", "Szampony do myjni", /szampon|shampoo/, ["chemia-do-myjni"]],
  ["chemia-do-myjni", "Aktywne piany do myjni", /pian|foam|bezdotyk|wash/, ["chemia-do-myjni"]],

  // Chemia samochodowa
  ["trudne-zabrudzenia", "Usuwanie owadów", /owad|insekt|\bbug/, SAM],
  ["trudne-zabrudzenia", "Usuwanie smoły, asfaltu, kleju i żywicy", /smoł|asfalt|żywic|\btar\b/, SAM],
  ["trudne-zabrudzenia", "Deironizery i osady metaliczne", /deiron|iron|metaliczn|fallout/, SAM],
  ["felgi-i-opony", "Krwawa felga", /krwaw|bleed|red wheel/, SAM],
  ["felgi-i-opony", "Kwaśne płyny do felg", /felg[^|]*(kwas|acid)|(kwas|acid)[^|]*felg|alux/, SAM],
  ["felgi-i-opony", "Neutralne płyny do felg", /felg[^|]*neutral|neutral[^|]*felg/, SAM],
  ["felgi-i-opony", "Dressingi i czernidła do opon", /opon|czernid|tire|tyre/, SAM],
  ["felgi-i-opony", "Płyny do felg", /felg|wheel|kołpak|\brim/, SAM],
  ["szyby-i-szklo", "Płyny do spryskiwaczy", /płyn[^|]*spryskiwacz|do spryskiwaczy/],
  ["szyby-i-szklo", "Odmrażacze do szyb", /odmraża|de-?icer/, SAM],
  ["szyby-i-szklo", "Antypara", /antypar|anti-?fog|parowani/, SAM],
  ["szyby-i-szklo", "Niewidzialne wycieraczki", /wycieraczk|niewidzialn|rain/, SAM],
  ["szyby-i-szklo", "Płyny do szyb samochodowych", /szyb|glass/, SAM],
  ["wnetrze-samochodu", "Skóra samochodowa", /skór|leather/, SAM],
  ["wnetrze-samochodu", "Tapicerka materiałowa", /tapicer|textile|tkanin/, SAM],
  ["wnetrze-samochodu", "Kokpit i plastiki", /kokpit|cockpit|plastik|dashboard|plak/, ["wnetrze-samochodu"]],
  ["wnetrze-samochodu", "Zapachy i neutralizatory do samochodu", /zapach|neutraliz/, ["wnetrze-samochodu"]],
  ["wnetrze-samochodu", "Kokpit i plastiki", /wnętrz|inside|interior/, SAM],
  ["elementy-zewnetrzne", "Konserwacja podwozia", /podwoz|konserwac|baranek|dinitrol/, SAM],
  ["elementy-zewnetrzne", "Czyszczenie silnika", /silnik|engine/, SAM],
  ["elementy-zewnetrzne", "Dachy cabrio", /cabrio|kabriolet/, SAM],
  ["elementy-zewnetrzne", "Chrom i metale", /chrom|metal polish|do metali|polerowania metali/, SAM],
  ["elementy-zewnetrzne", "Gumy i uszczelki", /uszczelk|gum/, SAM],
  ["elementy-zewnetrzne", "Plastiki zewnętrzne", /zderzak|plastik[^|]*zewn|trim/, SAM],
  ["pielegnacja-lakieru", "Powłoki ceramiczne i ochronne", /ceram|powłok|coating|\b9h|seal(a|e)nt|kwarc|protect/, SAM],
  ["pielegnacja-lakieru", "Quick detailery", /quick|detailer|\bqd\b/, SAM],
  ["pielegnacja-lakieru", "Pasty polerskie", /pasta|compound|polerk|mocnościer|ściern/, SAM],
  ["pielegnacja-lakieru", "Cleanery, politury i AIO", /politur|polish|\baio\b|all in one|glink|clay|regeneracji lakieru|car shine/, SAM],
  ["pielegnacja-lakieru", "Cleanery, politury i AIO", /cleaner/, ["pielegnacja-lakieru"]],
  ["pielegnacja-lakieru", "Woski samochodowe", /wosk|wax|carnauba/, SAM],
  ["mycie-samochodu", "Pre-wash i TFR", /pre-?wash|\btfr\b|wstępn/, SAM],
  ["mycie-samochodu", "Aktywne piany", /pian|foam/, ["mycie-samochodu"]],
  ["mycie-samochodu", "Szampony samochodowe", /szampon|shampoo/, ["mycie-samochodu"]],
  ["mycie-samochodu", "APC do samochodu", /\bapc\b|uniwersaln|multi cleaner/, ["mycie-samochodu", "wnetrze-samochodu"]],
  ["mycie-samochodu", "Preparaty do mocnych zabrudzeń", /mocn|silny|beton/, ["mycie-samochodu"]],

  // Sprzęt i akcesoria
  ["szczotki-i-miotly", "Szczotki Vikan", /szczot[^|]*vikan|vikan[^|]*szczot/],
  ["sciagaczki", "Gumowe ściągaczki Vikan", /ściąg[^|]*vikan|vikan[^|]*ściąg/],
  ["szczotki-i-miotly", "Szczotki do kostki brukowej", /szczot[^|]*(kostk|bruk)/],
  ["szczotki-i-miotly", "Szczotki do mycia samochodu", /szczot[^|]*(samoch|auta|felg|detail|mycia|tapicer|skór|sierś|montowan|wkrętar)|twister|duster|pędzel|pędzl|detailing brush/],
  ["szczotki-i-miotly", "Miotły przemysłowe", /miotł|mioteł/],
  ["szczotki-i-miotly", "Szczotki do podłóg", /szczot[^|]*(podł|magazyn)|zamiatac/],
  ["szczotki-i-miotly", "Zmiotki i szufelki", /zmiotk|szufel/],
  ["mopy", "Kije i drążki teleskopowe", /\bkij|drążek|drążk|teleskop|trzonek/],
  ["sciagaczki", "Ściągaczki do szyb", /ściąg[^|]*szyb|myjk[^|]*szyb/],
  ["sciagaczki", "Ściągaczki do podłogi", /ściąg[^|]*podł/],
  ["sciagaczki", "Akcesoria do ściągaczek", /guma[^|]*ściąg|uchwyt[^|]*ściąg|skrobak|skrobacz|ostrz/],
  ["sciagaczki", "Ściągaczki do wody", /ściąg|zbierak/],
  ["mikrofibry-i-gabki", "Pady i futra polerskie", /\bpad|futr|futer/],
  ["mikrofibry-i-gabki", "Ręczniki do osuszania", /ręcznik[^|]*osusz|osuszając|drying|ircha|ręcznik samoch|mikrowłókn/],
  ["mikrofibry-i-gabki", "Gąbki i rękawice", /gąbk|rękawica do|aplikator/],
  ["mikrofibry-i-gabki", "Mikrofibry do szyb", /mikrofib[^|]*szyb|glass/],
  ["mikrofibry-i-gabki", "Mikrofibry uniwersalne", /mikrofib|ściereczk|ścierk/],
  ["mopy", "Wózki sprzątające", /wózek|wózk/],
  ["mopy", "Wiadra i wyciskarki", /wiadr|wyciskar/],
  ["mopy", "Worki na odpady", /worki|worek/],
  ["mopy", "Mopy i stelaże", /\bmop|stelaż|nakładk/],
  ["opryskiwacze", "Butelki i opakowania", /butelk|atomizer|kanister|opakowan|tryger|trigger|spryskiwacz/],
  ["opryskiwacze", "Dozowniki", /dozownik|dozując/],
  ["ochrona-osobista", "Rękawiczki", /rękawic/],
  ["ochrona-osobista", "Pokrowce i folie ochronne", /pokrow|foli[ae]/],
  ["ochrona-osobista", "Akcesoria ochronne", /mask|okular|fartuch|nakolan|kombinez|ochronn/, ["sprzet-i-akcesoria"]],
  ["pozostale-akcesoria", "Zestawy akcesoriów czyszczących", /zestaw/, ["sprzet-i-akcesoria"]],

  // Chemia obiektowa i domowa – w obrębie obecnego działu
  ["chemia-obiektowa", "Podłogi i posadzki", /podłóg|podłog|posadzk|panel|parkiet|gres|terakot/, ["chemia-profesjonalna"]],
  ["chemia-obiektowa", "Łazienki i sanitariaty", /sanit|łazien|toalet|\bwc\b|pisuar|prysznic|kabin|udrażn|rur/, ["chemia-profesjonalna"]],
  ["chemia-obiektowa", "Szyby i lustra", /szyb|lustr|okn/, ["chemia-profesjonalna"]],
  ["chemia-obiektowa", "Ekologiczne środki czystości", /\beko|ekolog|\bbio/, ["chemia-profesjonalna"]],
  ["chemia-obiektowa", "Mycie powierzchni", /uniwersal|\bapc\b|powierzchni|mebl|biur|mleczko/, ["chemia-profesjonalna"]],
  ["kuchnia-i-gastronomia", "Odkamienianie urządzeń", /odkamien|kamień|kamienia/, ["chemia-profesjonalna"]],
  ["kuchnia-i-gastronomia", "Odtłuszczanie kuchni", /tłuszcz|kuchn/, ["chemia-profesjonalna"]],
  ["pranie-i-tekstylia", "Odplamiacze", /odplam/, ["pranie-i-tekstylia"]],
  ["dywany-i-tapicerka", "Odplamiacze", /odplam/, ["dywany-i-tapicerka"]],
  ["dywany-i-tapicerka", "Pranie tapicerki", /tapicer/, ["chemia-profesjonalna"]],
  ["dywany-i-tapicerka", "Neutralizatory zapachów", /neutraliz/, ["dywany-i-tapicerka"]],
  ["chemia-do-domu", "Łazienka i WC", /łazien|\bwc\b|toalet|domestos/, ["dom-i-ogrod", "zapachy"]],
  ["chemia-do-domu", "Kuchnia i odtłuszczanie", /kuchn|tłuszcz/, ["dom-i-ogrod"]],
  ["chemia-do-domu", "Podłogi", /podłóg|podłog|panel/, ["dom-i-ogrod", "zapachy"]],
  ["chemia-do-domu", "Szyby i lustra", /szyb|lustr|okn/, ["dom-i-ogrod"]],
  ["chemia-do-domu", "Pranie", /prani|proszek|płukan/, ["dom-i-ogrod"]],
  ["chemia-do-domu", "Dywany i tapicerka", /dywan|tapicer/, ["dom-i-ogrod"]],
  ["chemia-do-domu", "Meble", /mebl|drewn|kurz/, ["dom-i-ogrod"]],
  ["chemia-do-domu", "Środki ekologiczne", /\beko|\bbio/, ["dom-i-ogrod"]],
  ["odswiezanie-domu", "Neutralizatory zapachów", /neutraliz/, ["odswiezanie-domu"]],
  ["odswiezanie-domu", "Zapachy do domu", /zapach/, ["odswiezanie-domu"]],
  ["czyszczenie-zewnetrzne", "Dachy", /dach/, ["dom-i-ogrod"]],

  // Ogólne odświeżacze i zapachy (na końcu, żeby nie przejęły produktów z innych działów)
  ["neutralizatory", "Neutralizatory zapachów", /neutraliz|nautraliz|smoke|nikotyn|odor|pochłaniacz/, ["zapachy"]],
  ["neutralizatory", "Odświeżacze w sprayu", /odświeżacz|air fresh|fresh air/, ["zapachy"]],
  ["dezynfekcja", "Uzdatnianie wody", /uzdatn/, ["chemia-specjalistyczna"]],
  ["dezynfekcja", "Dezynfekcja pojazdów specjalistyczna", /dezynf[^|]*pojazd|pojazd[^|]*dezynf/],
  ["dezynfekcja", "Dezynfekcja powierzchni", /dezynf|biobój|wirus|bakteriobój/, ["chemia-specjalistyczna", "chemia-profesjonalna"]],
  ["zmywacze-i-odtluszczacze", "Usuwanie kleju i etykiet", /klej|etykiet|naklej/, ["chemia-specjalistyczna"]],
  ["zmywacze-i-odtluszczacze", "Odtłuszczacze przemysłowe", /odtłuszcz|zmywacz|rozpuszcz|benzyna/, ["chemia-specjalistyczna"]],
  ["smary", "Testery i kleje techniczne", /klej|tester|wykrywacz|szczeliw/, ["chemia-specjalistyczna"]],
  ["chemia-warsztatowa", "Czyściwa warsztatowe", /czyściw|ręcznik/, ["chemia-warsztatowa"]],
  ["chemia-warsztatowa", "Mycie części i narzędzi", /części|narzędzi/, ["chemia-specjalistyczna"]],
  ["chemia-warsztatowa", "Utrzymanie czystości w warsztacie", /warsztat|posadz/, ["chemia-warsztatowa"]],
  ["chemia-warsztatowa", "Chemia techniczna", /./, ["chemia-warsztatowa"]],
];

// podkategoria → dział
const rootOfSub = new Map(categories.flatMap((c) => c.children.map((s) => [s.slug, c.slug] as const)));
const typeSlug = (sub: string, name: string) => categories.flatMap((c) => c.children).find((s) => s.slug === sub)?.types.find((t) => t.name === name)?.slug;
for (const [sub, name] of rules) {
  if (!rootOfSub.has(sub)) throw new Error(`Nieznana podkategoria w regule: ${sub}`);
  if (name && !typeSlug(sub, name)) throw new Error(`Nieznany typ w regule: ${sub} › ${name}`);
}

// ---------- 3. Produkty ----------
const cats = (await payload.find({ collection: "categories", limit: 0, pagination: false, depth: 0, overrideAccess: true })).docs;
const catById = new Map(cats.map((c) => [c.id, c]));
const chain = (id?: number) => {
  const out: string[] = [];
  let c = id != null ? catById.get(id) : undefined;
  while (c && out.length < 5) {
    out.unshift(c.slug ?? "");
    const p = typeof c.parent === "object" ? c.parent?.id : c.parent;
    c = p != null ? catById.get(p) : undefined;
  }
  return out;
};
const products = (await payload.find({ collection: "products", limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { name: true, category: true } })).docs;

let changed = 0;
const report = new Map<string, number>();
const samples = new Map<string, string[]>();
for (const p of products) {
  const catId = typeof p.category === "object" ? p.category?.id : p.category ?? undefined;
  const [root = "", sub = ""] = chain(catId ?? undefined);
  const text = p.name.toLowerCase();
  const hit = rules.find(([, , re, from]) => re.test(text) && (!from || from.includes(root) || from.includes(sub)));
  let target = catId ?? undefined;
  let label = `${root} › ${sub || "—"} › (bez typu)`;
  if (hit) {
    const [hSub, hType] = hit;
    const slug = hType ? typeSlug(hSub, hType)! : hSub;
    target = idOf.get(slug) ?? target;
    label = `${rootOfSub.get(hSub)} › ${hSub} › ${hType || "(bez typu)"}`;
  } else if (sub) {
    target = idOf.get(sub) ?? target; // typ, który nie pasuje już do żadnej reguły, zostaje na poziomie podkategorii
  }
  report.set(label, (report.get(label) ?? 0) + 1);
  if (process.env.SHOW && label.endsWith("(bez typu)") && (samples.get(label)?.length ?? 0) < Number(process.env.SHOW)) samples.set(label, [...(samples.get(label) ?? []), p.name]);
  if (target && target !== catId && target > 0) {
    changed++;
    if (!DRY) await payload.update({ collection: "products", id: p.id, data: { category: target }, overrideAccess: true, depth: 0 });
  }
}

const rows = [...report.entries()].sort(([a], [b]) => a.localeCompare(b, "pl"));
for (const [k, n] of rows) console.log(`${String(n).padStart(4)}  ${k}`);
const untyped = rows.filter(([k]) => k.endsWith("(bez typu)")).reduce((s, [, n]) => s + n, 0);
console.log(`\nProduktów: ${products.length}, zmienionych: ${changed}${DRY ? " (podgląd)" : ""}, bez typu: ${untyped}`);
for (const [k, v] of samples) console.log(`\n## ${k}\n  ${v.join("\n  ")}`);
process.exit(0);
