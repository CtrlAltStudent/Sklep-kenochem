"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

type Card = { id: string; name: string; photo: string; text: string; rating: number; visible: boolean };

const empty = (): Card => ({ id: crypto.randomUUID(), name: "", photo: "", text: "", rating: 5, visible: true });

export function GoogleReviewsBoard() {
  const [placeUrl, setPlaceUrl] = useState("");
  const [items, setItems] = useState<Card[]>([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/google-reviews", { credentials: "include" }).then((r) => r.json()).then((j) => {
      if (!j.ok) setMsg({ ok: false, message: j.message ?? "Brak uprawnień" });
      else { setPlaceUrl(j.reviews.placeUrl || ""); setItems(j.reviews.items || []); }
    }).catch(() => setMsg({ ok: false, message: "Brak połączenia" }));
  }, []);

  const setItem = (id: string, patch: Partial<Card>) => setItems((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const move = (id: string, dir: -1 | 1) => setItems((list) => {
    const i = list.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return list;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const photo = async (id: string, file: File | undefined) => {
    if (!file) return;
    setBusy(id);
    const body = new FormData();
    body.append("file", file);
    body.append("_payload", JSON.stringify({ alt: "Zdjęcie autora opinii", kind: "image" }));
    const res = await fetch("/api/media", { method: "POST", credentials: "include", body }).then((r) => r.json()).catch(() => null);
    setBusy("");
    const url = res?.doc?.url || res?.url;
    if (!url) { setMsg({ ok: false, message: "Nie udało się wgrać zdjęcia." }); return; }
    setItem(id, { photo: url });
  };

  const save = async () => {
    setBusy("save");
    const r = await fetch("/api/google-reviews", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeUrl, items }),
    }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setMsg(r);
    if (r.reviews) { setPlaceUrl(r.reviews.placeUrl || ""); setItems(r.reviews.items || []); }
  };

  const shown = items.filter((r) => r.visible && r.name.trim() && r.text.trim()).length;

  return (
    <div className="kc-dash kc-tool">
      <section className="kc-hero kc-hero--compact">
        <div>
          <p className="kc-hero__date">Strona główna</p>
          <h1 className="kc-hero__title">Opinie z Google</h1>
          <p className="kc-hero__text">Wybierasz, które opinie z wizytówki widać na stronie głównej. Na stronie jest tylko zdjęcie, imię, gwiazdki i tekst. Puste pole nic nie pokazuje.</p>
        </div>
      </section>
      {msg && <p className={`kc-tool__banner ${msg.ok ? "is-ok" : "is-bad"}`}>{msg.message}</p>}

      <section className="kc-card">
        <header className="kc-card__head"><h2>Link do wizytówki</h2><span className="kc-muted">na stronie: {shown}</span></header>
        <label className="kc-set__field"><span>Adres z Google Maps, zaczyna się od https://</span>
          <input value={placeUrl} onChange={(e) => setPlaceUrl(e.target.value)} placeholder="https://www.google.com/maps/..." />
        </label>
        <p className="kc-tool__note">Przycisk „Opinie w Google” prowadzi pod ten adres. Zostaw puste, jeśli wizytówka nie jest jeszcze potwierdzona.</p>
      </section>

      {items.map((r, index) => (
        <section key={r.id} className="kc-card">
          <header className="kc-card__head">
            <h2>{r.name.trim() || `Opinia ${index + 1}`}</h2>
            <label className="kc-muted"><input type="checkbox" checked={r.visible} onChange={(e) => setItem(r.id, { visible: e.target.checked })} /> Pokazuj na stronie</label>
          </header>
          <div className="kc-tool__review">
            <label className="kc-tool__photo">
              {r.photo ? <img src={r.photo} alt="" /> : <span>{(r.name.trim()[0] || "?").toUpperCase()}</span>}
              <input type="file" accept="image/*" onChange={(e) => photo(r.id, e.target.files?.[0])} />
              <small>{busy === r.id ? "Wgrywam…" : "Zdjęcie"}</small>
            </label>
            <div className="kc-tool__review-fields">
              <div className="kc-tool__fields">
                <label className="kc-set__field"><span>Imię</span>
                  <input value={r.name} onChange={(e) => setItem(r.id, { name: e.target.value })} placeholder="Anna" />
                </label>
                <label className="kc-set__field"><span>Gwiazdki</span>
                  <select value={r.rating} onChange={(e) => setItem(r.id, { rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>
              <label className="kc-set__field"><span>Tekst opinii, słowo w słowo z Google</span>
                <textarea rows={3} value={r.text} onChange={(e) => setItem(r.id, { text: e.target.value })} />
              </label>
            </div>
          </div>
          <div className="kc-tool__actions">
            <button type="button" className="kc-btn kc-btn--light" disabled={index === 0} onClick={() => move(r.id, -1)}>Wyżej</button>
            <button type="button" className="kc-btn kc-btn--light" disabled={index === items.length - 1} onClick={() => move(r.id, 1)}>Niżej</button>
            <button type="button" className="kc-btn kc-btn--light" onClick={() => setItems(items.filter((x) => x.id !== r.id))}>Usuń</button>
          </div>
        </section>
      ))}

      <div className="kc-tool__actions">
        <button type="button" className="kc-btn kc-btn--light" onClick={() => setItems([...items, empty()])}>Dodaj opinię</button>
        <button type="button" className="kc-btn kc-btn--lime" disabled={busy === "save"} onClick={save}>{busy === "save" ? "Zapisuję…" : "Zapisz"}</button>
      </div>
      <p className="kc-tool__note"><Star size={14} /> Wpisuj tylko opinie, które naprawdę są na wizytówce. Sklep ich sam nie pobiera.</p>
    </div>
  );
}
