import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ListingsApi, MetaApi, UploadApi } from '../services/api'
import { fileToDataUrl } from '../utils/imageFile'
import { Field, Protected, areaClass, inputClass } from '../components/Layout'
import { useUi } from '../store/auth'
import type { City, ListingType } from '../types'
import { CAR_BODIES, CLOTHING_CATS, CLOTHING_CONDITIONS, CLOTHING_SEASONS, CLOTHING_SIZES, CLOTHING_SUBS, CONDITIONS, DEAL_TYPES, DRIVES, FREELANCE_CATS, FUELS, PROPERTY_TYPES, RENOVATIONS, TRANSMISSIONS } from '../utils/format'

const empty = {
  title: '',
  description: '',
  price: '',
  currency: 'USD',
  cityId: '',
  address: '',
  district: '',
  videoUrl: '',
  propertyType: 'apartment',
  dealType: 'sale',
  rooms: '',
  area: '',
  floor: '',
  floors: '',
  renovation: 'евро',
  furniture: false,
  brand: '',
  model: '',
  year: '',
  mileage: '',
  bodyType: 'седан',
  engine: 'бензин',
  engineVolume: '',
  transmission: 'автомат',
  drive: 'передний',
  fuel: 'бензин',
  color: '',
  condition: 'хорошее',
  serviceCategory: 'design',
  deliveryDays: '2',
  serviceType: '',
  clothingCategory: 'men',
  itemKind: '',
  size: 'M',
  season: 'демисезон',
  latitude: '',
  longitude: '',
}

export default function PostSelectPage() {
  const cats = [
    { type: 'real_estate', emoji: '🏠', title: 'Недвижимость' },
    { type: 'cars', emoji: '🚗', title: 'Автомобиль' },
    { type: 'freelance', emoji: '💼', title: 'Фриланс' },
    { type: 'clothing', cat: 'men', emoji: '👕', title: 'Мужская одежда' },
    { type: 'clothing', cat: 'women', emoji: '👗', title: 'Женская одежда' },
    { type: 'clothing', cat: 'kids', emoji: '🧒', title: 'Детская' },
    { type: 'clothing', cat: 'shoes', emoji: '👟', title: 'Обувь' },
    { type: 'clothing', cat: 'electronics', emoji: '📱', title: 'Электроника' },
    { type: 'clothing', cat: 'home', emoji: '🏠', title: 'Для дома' },
    { type: 'clothing', cat: 'beauty', emoji: '💄', title: 'Красота' },
    { type: 'clothing', cat: 'sport', emoji: '⚽', title: 'Спорт' },
  ]
  return (
    <Protected>
      <h1 className="mb-6 text-2xl font-extrabold">Выберите категорию</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {cats.map((c) => (
          <Link
            key={c.cat || c.type}
            to={c.cat ? `/post/${c.type}?cat=${c.cat}` : `/post/${c.type}`}
            className="rounded-3xl bg-white p-8 text-center shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
          >
            <div className="text-5xl">{c.emoji}</div>
            <div className="mt-3 text-lg font-extrabold">{c.title}</div>
          </Link>
        ))}
      </div>
    </Protected>
  )
}

export function ListingFormPage({ type, editId }: { type?: ListingType; editId?: string }) {
  const [form, setForm] = useState(empty)
  const [photos, setPhotos] = useState<string[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useUi((s) => s.toast)
  const nav = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const [kind, setKind] = useState<ListingType | undefined>((type || (params.type as ListingType)) as ListingType | undefined)
  const listingType = kind
  const id = editId || params.id

  useEffect(() => {
    const cat = searchParams.get('cat')
    if (cat) setForm((s) => ({ ...s, clothingCategory: cat }))
  }, [searchParams])

  useEffect(() => {
    MetaApi.cities().then((r) => setCities((r.data as { items: City[] }).items))
  }, [])

  useEffect(() => {
    if (!id) return
    ListingsApi.one(id).then(({ data }) => {
      const it = data.item
      setKind(it.type)
      setForm((s) => ({
        ...s,
        title: it.title,
        description: it.description,
        price: String(it.price),
        currency: it.currency,
        cityId: String(it.cityId || ''),
        address: it.address || '',
        district: it.district || '',
        videoUrl: it.videoUrl || '',
        latitude: String(it.latitude || ''),
        longitude: String(it.longitude || ''),
        ...(it.realEstate || {}),
        rooms: String(it.realEstate?.rooms || ''),
        area: String(it.realEstate?.area || ''),
        floor: String(it.realEstate?.floor || ''),
        floors: String(it.realEstate?.floors || ''),
        furniture: Boolean(it.realEstate?.furniture),
        ...(it.car || {}),
        year: String(it.car?.year || ''),
        mileage: String(it.car?.mileage || ''),
        engineVolume: String(it.car?.engineVolume || ''),
        ...(it.freelance || {}),
        deliveryDays: String(it.freelance?.deliveryDays || ''),
        ...(it.clothing || {}),
      }))
      setPhotos((it.media || []).filter((m: { type: string; url: string }) => m.type === 'image').map((m: { url: string }) => m.url))
    })
  }, [id])

  function set<K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    try {
      const images: string[] = []
      const videos: File[] = []
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) images.push(await fileToDataUrl(file))
        else videos.push(file)
      }
      if (images.length) setPhotos((p) => [...p, ...images])
      if (videos.length) {
        const uploaded = await UploadApi.files(videos)
        const vid = uploaded.find((f) => f.type === 'video')
        if (vid) set('videoUrl', vid.url)
      }
    } catch (e) {
      toast((e as Error).message, 'err')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (!listingType) {
        toast('Выберите категорию', 'err')
        return
      }
      const payload = {
        ...form,
        type: listingType,
        price: Number(form.price),
        cityId: form.cityId ? Number(form.cityId) : null,
        rooms: form.rooms ? Number(form.rooms) : null,
        area: form.area ? Number(form.area) : null,
        floor: form.floor ? Number(form.floor) : null,
        floors: form.floors ? Number(form.floors) : null,
        year: form.year ? Number(form.year) : null,
        mileage: form.mileage ? Number(form.mileage) : null,
        engineVolume: form.engineVolume ? Number(form.engineVolume) : null,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        photos,
      }
      if (id) {
        await ListingsApi.update(Number(id), payload)
        toast('Изменения отправлены на проверку')
        nav(`/listings/${id}`)
      } else {
        const { data } = await ListingsApi.create(payload)
        toast('Объявление отправлено на модерацию')
        nav(`/listings/${data.item.id}`)
      }
    } catch (err) {
      toast((err as Error).message, 'err')
    } finally {
      setLoading(false)
    }
  }

  const title = listingType === 'real_estate' ? 'Недвижимость' : listingType === 'cars' ? 'Автомобиль' : listingType === 'clothing' ? 'Одежда и обувь' : 'Услуга'

  return (
    <Protected>
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-[28px] bg-white p-5 shadow-[var(--shadow-card)] md:p-8">
        <h1 className="text-2xl font-extrabold">{id ? 'Редактировать' : 'Новое объявление'} · {title}</h1>
        <Field label="Название">
          <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </Field>
        <Field label="Описание">
          <textarea className={areaClass} value={form.description} onChange={(e) => set('description', e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Цена">
            <input className={inputClass} type="number" value={form.price} onChange={(e) => set('price', e.target.value)} required />
          </Field>
          <Field label="Валюта">
            <select className={inputClass} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              <option>USD</option>
              <option>TJS</option>
              <option>RUB</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Город">
            <select className={inputClass} value={form.cityId} onChange={(e) => set('cityId', e.target.value)}>
              <option value="">Выберите</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ru}</option>
              ))}
            </select>
          </Field>
          <Field label="Район">
            <input className={inputClass} value={form.district} onChange={(e) => set('district', e.target.value)} />
          </Field>
        </div>
        <Field label="Адрес">
          <input className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Широта">
            <input className={inputClass} placeholder="38.5598" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} />
          </Field>
          <Field label="Долгота">
            <input className={inputClass} placeholder="68.7870" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} />
          </Field>
        </div>

        {listingType === 'real_estate' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Тип недвижимости">
              <select className={inputClass} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Продажа / Аренда">
              <select className={inputClass} value={form.dealType} onChange={(e) => set('dealType', e.target.value)}>
                {DEAL_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Комнаты"><input className={inputClass} value={form.rooms} onChange={(e) => set('rooms', e.target.value)} /></Field>
            <Field label="Площадь, м²"><input className={inputClass} value={form.area} onChange={(e) => set('area', e.target.value)} /></Field>
            <Field label="Этаж"><input className={inputClass} value={form.floor} onChange={(e) => set('floor', e.target.value)} /></Field>
            <Field label="Этажность"><input className={inputClass} value={form.floors} onChange={(e) => set('floors', e.target.value)} /></Field>
            <Field label="Ремонт">
              <select className={inputClass} value={form.renovation} onChange={(e) => set('renovation', e.target.value)}>
                {RENOVATIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 pt-8 font-semibold">
              <input type="checkbox" checked={form.furniture} onChange={(e) => set('furniture', e.target.checked)} /> Мебель
            </label>
          </div>
        )}

        {listingType === 'cars' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Марка"><input className={inputClass} value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
            <Field label="Модель"><input className={inputClass} value={form.model} onChange={(e) => set('model', e.target.value)} /></Field>
            <Field label="Год"><input className={inputClass} value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
            <Field label="Пробег"><input className={inputClass} value={form.mileage} onChange={(e) => set('mileage', e.target.value)} /></Field>
            <Field label="Тип кузова">
              <select className={inputClass} value={form.bodyType} onChange={(e) => set('bodyType', e.target.value)}>{CAR_BODIES.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label="Двигатель"><input className={inputClass} value={form.engine} onChange={(e) => set('engine', e.target.value)} /></Field>
            <Field label="Объём"><input className={inputClass} value={form.engineVolume} onChange={(e) => set('engineVolume', e.target.value)} /></Field>
            <Field label="Коробка">
              <select className={inputClass} value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>{TRANSMISSIONS.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label="Привод">
              <select className={inputClass} value={form.drive} onChange={(e) => set('drive', e.target.value)}>{DRIVES.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label="Топливо">
              <select className={inputClass} value={form.fuel} onChange={(e) => set('fuel', e.target.value)}>{FUELS.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label="Цвет"><input className={inputClass} value={form.color} onChange={(e) => set('color', e.target.value)} /></Field>
            <Field label="Состояние">
              <select className={inputClass} value={form.condition} onChange={(e) => set('condition', e.target.value)}>{CONDITIONS.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
          </div>
        )}

        {listingType === 'freelance' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Категория">
              <select className={inputClass} value={form.serviceCategory} onChange={(e) => set('serviceCategory', e.target.value)}>
                {FREELANCE_CATS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Срок, дни"><input className={inputClass} value={form.deliveryDays} onChange={(e) => set('deliveryDays', e.target.value)} /></Field>
            <Field label="Тип услуги"><input className={inputClass} value={form.serviceType} onChange={(e) => set('serviceType', e.target.value)} /></Field>
          </div>
        )}

        {listingType === 'clothing' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Раздел">
              <select className={inputClass} value={form.clothingCategory} onChange={(e) => set('clothingCategory', e.target.value)}>
                {CLOTHING_CATS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Вид">
              <select className={inputClass} value={form.itemKind} onChange={(e) => set('itemKind', e.target.value)}>
                <option value="">Выберите</option>
                {(CLOTHING_SUBS[form.clothingCategory] || []).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Размер">
              <select className={inputClass} value={form.size} onChange={(e) => set('size', e.target.value)}>
                {CLOTHING_SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Бренд"><input className={inputClass} value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
            <Field label="Цвет"><input className={inputClass} value={form.color} onChange={(e) => set('color', e.target.value)} /></Field>
            <Field label="Сезон">
              <select className={inputClass} value={form.season} onChange={(e) => set('season', e.target.value)}>
                {CLOTHING_SEASONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Состояние">
              <select className={inputClass} value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                {CLOTHING_CONDITIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        )}

        <Field label="Фото">
          <input type="file" accept="image/*,video/*" multiple onChange={(e) => onFiles(e.target.files)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p) => (
              <button type="button" key={p} onClick={() => setPhotos(photos.filter((x) => x !== p))} className="relative">
                <img src={p} className="h-20 w-20 rounded-xl object-cover" alt="" />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Видео URL">
          <input className={inputClass} value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
        </Field>
        <button disabled={loading} className="h-12 w-full rounded-2xl bg-primary font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {loading ? 'Сохранение…' : id ? 'Сохранить' : 'Опубликовать'}
        </button>
      </form>
    </Protected>
  )
}
