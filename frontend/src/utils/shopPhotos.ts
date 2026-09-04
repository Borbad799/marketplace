const u = (id: string, w = 800, h = 600) =>
  /^\d+$/.test(id)
    ? `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}`
    : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`

function four(a: string, b: string, c: string, d: string) {
  const ids = [a, b, c, d]
  if (new Set(ids).size !== 4) throw new Error('duplicate photo ids: ' + ids.join(','))
  return ids.map((id) => u(id))
}

const CLOTHING: Record<string, string[]> = {
  'men:куртка': four('1336873', 'photo-1551028719-00167b16eac5', 'photo-1591047139829-d91aecb6caea', 'photo-1544022613-e87ca75a784a'),
  'men:джинсы': four('1598507', '1082529', '603022', 'photo-1542272604-787c3835535d'),
  'men:футболка': four('428340', '1656684', '6311392', 'photo-1583743814966-8936f5b7be1a'),
  'men:рубашка': four('297933', '769733', '4066293', 'photo-1620012253295-c15cc3e65df4'),
  'men:брюки': four('298863', '6764007', '4210863', 'photo-1624378439575-d8705ad7ae80'),
  'men:костюм': four('325876', '1043474', '1342609', 'photo-1507679799987-c73779587ccf'),
  'men:спорт': four('2294361', '416778', '1954524', 'photo-1515886657613-9f3515b0c78f'),
  'men:худи': four('6311651', '5384423', '6311575', 'photo-1556821840-3a63f95609a7'),
  'women:платье': four('985635', '1755428', '1488463', 'photo-1572804013309-59a88b7e92f1'),
  'women:пальто': four('7671160', '1536619', '794064', 'photo-1539533018447-63fcce2678e3'),
  'women:блузка': four('794062', '972995', '1926769', 'photo-1564257631407-4deb1f99d992'),
  'women:юбка': four('1152994', '7671165', '936075', 'photo-1583496661160-fb5886a0aaaa'),
  'women:джинсы': four('4210866', '1542252', '8988348', 'photo-1541099649105-f69ad21f3246'),
  'women:куртка': four('1040945', '7671166', '1124468', 'photo-1521223890158-f9f7c3d5d504'),
  'women:костюм': four('1300550', '1682699', '3807827', 'photo-1573496359142-b8d87734a5a2'),
  'women:хиджаб': four('6943942', '8090147', '8100784', 'photo-1531123897727-8f129e1688ce'),
  'kids:костюм': four('1648375', '3662667', '3933250', '3661354'),
  'kids:куртка': four('1620760', '3661386', '4473796', '1620653'),
  'kids:для мальчиков': four('3662668', '1148998', '4473871', '3662663'),
  'kids:для девочек': four('3662665', '1648377', '4473795', 'photo-1514090458221-65bb69cf63e6'),
  'kids:для малышей': four('3661387', '4473870', '3662664', '1648376'),
  'kids:школа': four('256455', '301926', '861331', 'photo-1503676260728-1c00da094a0b'),
  'kids:спорт': four('296301', '1571939', '1619696', 'photo-1519238263530-99bdd11df2ea'),
  'kids:пижама': four('545012', '1648378', 'photo-1503454537195-1dcabb73ffb9', '4380970'),
  'shoes:кроссовки': four('2529148', '1598505', '1464625', 'photo-1542291026-7eec264c27ff'),
  'shoes:туфли': four('336372', '267320', '292999', 'photo-1543163521-1bf539c55dd2'),
  'shoes:ботинки': four('267301', '292998', '1598508', 'photo-1520639888713-7851133b1ed0'),
  'shoes:сапоги': four('267319', '1456706', 'photo-1608256246200-53e635b5b65f', 'photo-1605812860427-4024433a70fd'),
  'shoes:сандалии': four('134066', '292997', 'photo-1603487742131-4160ec999306', 'photo-1549298916-b41d501d3772'),
  'shoes:кеды': four('1478442', 'photo-1460353581641-37baddab0fa2', 'photo-1595950653106-6c9ebd614d3a', 'photo-1600185365926-3a2ce3cdb9eb'),
  'shoes:домашние': four('photo-1584568694244-14fbdf83bd30', '267318', '134063', '206519'),
  'shoes:детская обувь': four('1620654', '1148999', 'photo-1514989940723-e8e51635b782', 'photo-1606107557195-0e29a4b5b4aa'),
  'electronics:телефон': four('photo-1511707171634-5f897ff02aa9', 'photo-1510557880182-3d4d3cba35a5', 'photo-1592899677977-9c10ca588bbd', '699122'),
  'electronics:наушники': four('photo-1505740420928-5e560c06d30e', 'photo-1484704849700-f032a568e944', 'photo-1546435770-a3e426bf472b', 'photo-1583394838336-acd977736f90'),
  'electronics:ноутбук': four('photo-1496181133206-80ce9b88a853', 'photo-1517336714731-489689fd1ca8', 'photo-1541807084-5c52b6b3adef', 'photo-1593642632823-8f785ba67e45'),
  'electronics:телевизор': four('photo-1593359677879-a4bb92f829d1', 'photo-1593784991095-a205069470b6', 'photo-1461151304267-38535e780c79', 'photo-1567690187548-f07b1d7bf5a9'),
  'electronics:планшет': four('photo-1544244015-0df4b3ffc6b0', 'photo-1561154464-82e9adf32764', 'photo-1585790050230-5dd28404ccb9', '13791395'),
  'electronics:часы': four('photo-1523275335684-37898b6baf30', 'photo-1522312346375-d1a52e2b99b3', 'photo-1546868871-7041f2a55e12', 'photo-1508685096489-7aacd43bd3b1'),
  'electronics:колонка': four('photo-1608043152269-423dbba4e7e1', 'photo-1589003077984-894e133dabab', 'photo-1543512214-318c7553f230', '1706694'),
  'electronics:зарядка': four('photo-1583863788434-e58a36330cf0', 'photo-1609091839311-d5365f9ff1c5', 'photo-1614399113305-a127bb2ca893', 'photo-1770417999483-e5a313b33468'),
  'home:мебель': four('1866149', '1350789', '276583', 'photo-1555041469-a586c61ea9bc'),
  'home:кухня': four('2062426', 'photo-1556909114-f6e7ad7d3136', 'photo-1556911220-e15b29be8c8f', '1571453'),
  'home:декор': four('1090638', '1571468', '271624', 'photo-1586023492125-27b2c045efd7'),
  'home:текстиль': four('1648776', '1457842', 'photo-1522771739844-6a9f6d5f14af', 'photo-1631049307264-da0ec9d70304'),
  'home:свет': four('1112598', '1123262', 'photo-1513506003901-1e6a229e2d15', '208969'),
  'home:уборка': four('4108718', '4239091', 'photo-1563453392212-326f5e854473', 'photo-1581578731548-c64695cc6952'),
  'home:посуда': four('1599791', 'photo-1610701596007-11502861dcfa', '208969', '1080721'),
  'home:хранение': four('photo-1558618666-fcd25c85cd64', 'photo-1595428774223-ef52624120d2', '1866150', '276724'),
  'beauty:уход': four('3738341', '3762875', 'photo-1556228578-8c89e6adf883', 'photo-1571781926291-c477ebfd024b'),
  'beauty:макияж': four('2113855', '3018845', 'photo-1596462502278-27bfdc403348', 'photo-1487412947147-5cebf100ffc2'),
  'beauty:парфюм': four('965989', '1961795', 'photo-1541643600914-78b084683601', 'photo-1594035910387-fea47794261f'),
  'beauty:волосы': four('3993449', '3993324', 'photo-1522338140262-f46f5913618a', 'photo-1522337660859-02fbefca4702'),
  'beauty:маникюр': four('3997379', 'photo-1604654894610-df63bc536371', 'photo-1632345031435-8727f6897d53', '3997380'),
  'beauty:для лица': four('photo-1556228720-195a672e8a03', '3373712', '3762874', '2533266'),
  'beauty:для тела': four('photo-1556228453-efd6c1ff04f6', '3373713', '3373736', '3762876'),
  'beauty:инструменты': four('photo-1512496015851-a90fb38ba796', '3065171', '3993312', 'photo-1522335789203-aabd1fc54bc9'),
  'sport:тренажёр': four('1552242', '1229356', '841130', 'photo-1517836357463-d25dfeac3438'),
  'sport:велосипед': four('100582', '276517', 'photo-1571068316344-75bc76f77890', 'photo-1507035895480-2b3156c31fc8'),
  'sport:мяч': four('274422', 'photo-1614632537197-38a17061c2bd', 'photo-1579952363873-27f3bade9f55', '362110'),
  'sport:йога': four('317157', '3822622', 'photo-1544367567-0f2fcb009e0b', 'photo-1599901860904-17e6ed7083a0'),
  'sport:форма': four('photo-1431324155629-1a6deb1dec8d', '114296', '2827392', 'photo-1518611012118-696072aa579a'),
  'sport:рюкзак': four('1294731', 'photo-1553062407-98eeb64c6a62', 'photo-1491637639811-60e2756cc1c7', '1102874'),
  'sport:ролики': four('photo-1566576912321-d58ddd7a6088', 'photo-1590674899484-d5640e854abe', '141341', '170811'),
  'sport:туризм': four('1687845', 'photo-1478131143081-80f7f84ca84d', 'photo-1504280390367-361c6d9f38f4', '803226'),
}

const CARS: Record<string, string[]> = {
  седан: four('116675', '210019', 'photo-1492144534655-ae79c964c9d7', 'photo-1605559424843-9e4c228bf1c2'),
  кроссовер: four('3802510', '1545743', 'photo-1519641471654-76ce0107ad1b', 'photo-1606664515524-ed2f786a0bd6'),
  внедорожник: four('1149137', '3802511', 'photo-1533473359331-0135ef1b58bf', 'photo-1503376780353-7e6692767b70'),
  грузовик: four('2199293', '2226458', '1427541', '2199294'),
  мото: four('2393816', 'photo-1558981806-ec527fa84c39', 'photo-1568772585407-9361f9bf3a87', '244205'),
  запчасти: four('photo-1486262715619-67b85e0b08d3', 'photo-1487754180451-c456f719a1fc', 'photo-1619642751034-765dfdf7c58e', '337908'),
  default: four('photo-1544636331-e26879cd4d9b', '170811', '244205', '337908'),
}

const HOMES: Record<string, string[]> = {
  apartment: four('1571460', '1643383', 'photo-1502672260266-1c1ef2d93688', 'photo-1560448204-e02f11c3d0e2'),
  house: four('106399', '1396122', 'photo-1568605114967-8130f3a36994', 'photo-1570129477492-45c003edd2be'),
  room: four('photo-1595526114035-0d45ed16cfbf', 'photo-1631049307264-da0ec9d70304', '6585747', '271816'),
  land: four('photo-1500382017468-9049fed747ef', 'photo-1625246333195-78d9c38ad449', 'photo-1464226184884-fa280b87c399', '440731'),
  commercial: four('photo-1486406146926-c627a92ad1ab', 'photo-1497366216548-37526070297c', 'photo-1497366811353-6870744d04b2', '323705'),
  new_building: four('photo-1545324418-cc1a3fa10c00', 'photo-1460317442991-0ec209397118', '439227', 'photo-1600596542815-ffad4c1539a9'),
  default: four('photo-1522708323590-d24dbb6b0267', 'photo-1600585154340-be6161a56a0c', '1643383', '1396122'),
}

const FREELANCE: Record<string, string[]> = {
  design: four('photo-1561070791-2526d30994b5', 'photo-1626785774573-4b799315345d', '196644', '326503'),
  programming: four('photo-1461749280684-dccba630e2f6', 'photo-1517694712202-14dd9538aa97', '1181675', '574071'),
  smm: four('photo-1611162616475-46b635cb6868', 'photo-1611162618071-b39a2ec055fb', '267350', '3184465'),
  translation: four('photo-1546410531-bb4caa6b424d', '159711', '256417', 'photo-1455390582262-044cdead277a'),
  copywriting: four('photo-1486312338219-ce68d2c6f44d', 'photo-1471107340929-a87cd0f5b5f3', '261662', '3183150'),
  video: four('photo-1502920917128-1aa500764cbd', 'photo-1526170375885-4d8ecf77b99f', '337994', '66134'),
  marketing: four('photo-1552664730-d307ca884978', 'photo-1556761175-5973dc0f32e7', '3184292', 'photo-1522202176988-66273c2fd55f'),
  default: four('photo-1600880292203-757bb62b4baf', '1181298', '3861969', '546819'),
}

const FALLBACK = four('photo-1441986300917-64674bd600d8', '196645', '1181244', '265667')

type PhotoItem = {
  id: number
  type?: string | null
  title?: string | null
  clothing?: { itemKind?: string | null; clothingCategory?: string | null } | null
  car?: { bodyType?: string | null; brand?: string | null; model?: string | null } | null
  realEstate?: { propertyType?: string | null } | null
  freelance?: { serviceCategory?: string | null } | null
}

function poolKey(item: PhotoItem) {
  if (item.type === 'clothing' || item.clothing) {
    return `${item.clothing?.clothingCategory || ''}:${item.clothing?.itemKind || ''}`
  }
  if (item.type === 'cars') return `cars:${item.car?.bodyType || item.title || 'default'}`
  if (item.type === 'real_estate') return `re:${item.realEstate?.propertyType || 'default'}`
  if (item.type === 'freelance') return `fl:${item.freelance?.serviceCategory || 'default'}`
  return 'other'
}

export function poolFor(kind?: string | null, category?: string | null) {
  return CLOTHING[`${category || ''}:${kind || ''}`] || FALLBACK
}

function poolForItem(item: PhotoItem) {
  if (item.type === 'clothing' || item.clothing) {
    return poolFor(item.clothing?.itemKind, item.clothing?.clothingCategory)
  }
  if (item.type === 'cars') {
    const t = `${item.title || ''} ${item.car?.brand || ''} ${item.car?.model || ''} ${item.car?.bodyType || ''}`
    if (/camry/i.test(t)) return CARS['седан']
    if (/tucson/i.test(t)) return CARS['кроссовер']
    if (/accord/i.test(t)) return CARS['седан']
    if (/mercedes|e-class/i.test(t)) return CARS['седан']
    if (/bmw/i.test(t)) return CARS['внедорожник']
    if (/cruiser|land/i.test(t)) return CARS['внедорожник']
    if (/kia|k5/i.test(t)) return CARS['седан']
    if (/isuzu|npr|грузовик/i.test(t)) return CARS['грузовик']
    if (/cbr|байк|мото/i.test(t)) return CARS['мото']
    if (/фар|запчаст|led/i.test(t)) return CARS['запчасти']
    return CARS[item.car?.bodyType || ''] || CARS.default
  }
  if (item.type === 'real_estate') return HOMES[item.realEstate?.propertyType || ''] || HOMES.default
  if (item.type === 'freelance') return FREELANCE[item.freelance?.serviceCategory || ''] || FREELANCE.default
  return FALLBACK
}

export function photoForKind(kind?: string | null, id = 0, category?: string | null) {
  const pool = poolFor(kind, category)
  const n = Math.abs(Number(id) || 1)
  return pool[(n - 1) % pool.length]
}

export function photoForListing(item: PhotoItem, offset = 0) {
  const pool = poolForItem(item)
  const n = Math.abs(Number(item.id) || 1) + offset
  return pool[(n - 1) % pool.length]
}

export function takeUniquePhoto(
  kind: string | null | undefined,
  id: number,
  category: string | null | undefined,
  used: Set<string>,
) {
  return takeUniqueFrom(poolFor(kind, category), id, used)
}

function takeUniqueFrom(pool: string[], id: number, used: Set<string>) {
  const unique = [...new Set(pool)].filter(Boolean)
  for (const url of unique) {
    if (!used.has(url)) return url
  }
  const n = Math.abs(Number(id) || 1)
  return unique[(n - 1) % unique.length]
}

export function photosForListings(items: PhotoItem[]) {
  const usedByKey = new Map<string, Set<string>>()
  const map: Record<number, string> = {}
  for (const it of items) {
    const key = poolKey(it)
    if (!usedByKey.has(key)) usedByKey.set(key, new Set())
    const used = usedByKey.get(key)!
    const url = takeUniqueFrom(poolForItem(it), it.id, used)
    used.add(url)
    map[it.id] = url
  }
  return map
}

export function photoForRow(
  row: {
    type?: string
    id: number
    title?: string | null
    item_kind?: string | null
    clothing_category?: string | null
    body_type?: string | null
    brand?: string | null
    model?: string | null
    property_type?: string | null
    service_category?: string | null
  },
  used: Set<string>,
) {
  return takeUniqueFrom(
    poolForItem({
      id: row.id,
      type: row.type,
      title: row.title,
      clothing: row.item_kind ? { itemKind: row.item_kind, clothingCategory: row.clothing_category } : null,
      car: { bodyType: row.body_type, brand: row.brand, model: row.model },
      realEstate: { propertyType: row.property_type },
      freelance: { serviceCategory: row.service_category },
    }),
    row.id,
    used,
  )
}
