import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';

function TutoriasAlumno({ menu, activeSubsection, user }) {
  const item = (menu || []).find((m) => m.id === activeSubsection) || {};

  // API base (ajustable). Por defecto apunta al backend.
  const API_BASE =
    (typeof window !== 'undefined' && (window.__API_BASE__ || window.localStorage.getItem('API_BASE'))) ||
    (typeof process !== 'undefined' && (process.env && (process.env.REACT_APP_API_BASE || process.env.VITE_API_BASE))) ||
    'http://localhost:4000';
  const fetchApi = (path, opts = {}) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    return fetch(`${API_BASE}${p}`, { ...opts, headers });
  };

  const [profesores, setProfesores] = useState([]); // [{ id, name, horarios: [] }, ...]
  const [loading, setLoading] = useState(false);

  // Reserva drawer / form state
  const [showReserveDrawer, setShowReserveDrawer] = useState(false);
  const [reservedProfessor, setReservedProfessor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]); // { isoStart, isoEnd, label }
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tema, setTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modalidadReserva, setModalidadReserva] = useState('presencial');
  const [lugarReserva, setLugarReserva] = useState('');
  const [saving, setSaving] = useState(false);

  // mapping day name -> JS getDay index
  const dayNameToIndex = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6
  };

  // compute 30min slots for a professor's HorarioTutoria entries over next N days
  const computeSlotsForProfessor = (prof, daysAhead = 14) => {
    if (!prof || !Array.isArray(prof.horarios)) return [];
    const now = new Date();
    const slots = [];
    for (let offset = 0; offset < daysAhead; offset++) {
      const date = new Date();
      date.setDate(now.getDate() + offset);
      prof.horarios.forEach((h) => {
        const dayIdx = dayNameToIndex[(h.diaSemana || '').toLowerCase()];
        if (dayIdx === undefined) return;
        if (date.getDay() !== dayIdx) return;
        const [sh, sm] = (h.horaInicio || '00:00').split(':').map(Number);
        const [eh, em] = (h.horaFin || '00:00').split(':').map(Number);
        if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return;
        const startBase = new Date(date); startBase.setHours(sh, sm, 0, 0);
        const endBase = new Date(date); endBase.setHours(eh, em, 0, 0);
        for (let t = new Date(startBase); t < endBase; t = new Date(t.getTime() + 30 * 60000)) {
          const slotStart = new Date(t);
          const slotEnd = new Date(t.getTime() + 30 * 60000);
          if (slotEnd <= now) continue; // skip past slots
          if (slotEnd > endBase) continue;
          slots.push({
            isoStart: slotStart.toISOString(),
            isoEnd: slotEnd.toISOString(),
            label: `${slotStart.toLocaleDateString()} ${String(slotStart.getHours()).padStart(2,'0')}:${String(slotStart.getMinutes()).padStart(2,'0')} - ${String(slotEnd.getHours()).padStart(2,'0')}:${String(slotEnd.getMinutes()).padStart(2,'0')}`
          });
        }
      });
    }
    slots.sort((a, b) => new Date(a.isoStart) - new Date(b.isoStart));
    return slots;
  };

  // load horarios and group by professor
  useEffect(() => {
    if (String(activeSubsection || '').toLowerCase().trim() !== 'reservar') return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // try primary endpoint then fallback
        let res = await fetchApi('/api/horarios');
        if (!res.ok) res = await fetchApi('/api/horarios/horarios');
        if (!res.ok) throw new Error('No se pudieron cargar horarios');
        const horarios = await res.json();
        const activos = Array.isArray(horarios) ? horarios.filter(x => x && x.activo) : [];

        const map = new Map();
        activos.forEach((h) => {
          let profId = 'sin-profesor';
          if (h.profesor) {
            if (typeof h.profesor === 'object' && (h.profesor._id || h.profesor.id)) profId = String(h.profesor._id || h.profesor.id);
            else profId = String(h.profesor);
          } else if (h.profesorId) {
            profId = String(h.profesorId);
          }
          if (!map.has(profId)) map.set(profId, { id: profId, horarios: [] });
          map.get(profId).horarios.push(h);
        });

        const entries = Array.from(map.values());
        const profsWithNames = await Promise.all(entries.map(async (p) => {
          if (!p.id || p.id === 'sin-profesor') return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          try {
            // prefer /api/usuarios
            let r = await fetchApi(`/api/usuarios/${encodeURIComponent(p.id)}`);
            if (!r.ok) r = await fetchApi(`/api/users/${encodeURIComponent(p.id)}`);
            if (!r.ok) throw new Error('no user');
            const u = await r.json();
            const name = u.name || u.username || u.fullName || (u.email ? u.email.split('@')[0] : 'Profesor');
            return { id: p.id, name, horarios: p.horarios };
          } catch {
            return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          }
        }));

        if (!cancelled) setProfesores(profsWithNames);
      } catch (err) {
        console.error('Error cargando profesores con horarios', err);
        if (!cancelled) setProfesores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeSubsection]);

  // open reservation drawer for a professor
  const openReserve = (prof) => {
    setReservedProfessor(prof);
    const slots = computeSlotsForProfessor(prof, 14);
    setAvailableSlots(slots);
    setSelectedSlot(slots[0] || null);
    setTema('');
    setDescripcion('');
    setModalidadReserva('presencial');
    setLugarReserva('');
    setShowReserveDrawer(true);
  };

  const closeReserve = () => {
    setShowReserveDrawer(false);
    setReservedProfessor(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
  };

  // submit Tutoria to server (use /api/tutorias)
  const submitReserva = async () => {
    if (!reservedProfessor || !selectedSlot) {
      alert('Selecciona un hueco de 30 min.');
      return;
    }
    if (!user || !(user._id || user.id)) {
      alert('Usuario no identificado.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tema: tema || `Tutoria con ${reservedProfessor.name}`,
        descripcion: descripcion || '',
        profesor: reservedProfessor.id,
        estudiante: user._id || user.id,
        fechaInicio: selectedSlot.isoStart,
        fechaFin: selectedSlot.isoEnd,
        modalidad: modalidadReserva,
        lugar: lugarReserva || ''
      };
      const res = await fetchApi('/api/tutorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(()=>null);
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      // refresh list of profesores/hours
      // small delay to allow backend to be consistent
      await new Promise(r => setTimeout(r, 250));
      // reload by reusing the effect: trigger by temporarily toggling activeSubsection? simpler: call load logic directly
      // we'll call the same fetch used in effect:
      let reloadRes = await fetchApi('/api/horarios');
      if (!reloadRes.ok) reloadRes = await fetchApi('/api/horarios/horarios');
      if (reloadRes.ok) {
        const horarios = await reloadRes.json();
        const activos = Array.isArray(horarios) ? horarios.filter(x => x && x.activo) : [];
        const map = new Map();
        activos.forEach((h) => {
          let profId = 'sin-profesor';
          if (h.profesor) {
            if (typeof h.profesor === 'object' && (h.profesor._id || h.profesor.id)) profId = String(h.profesor._id || h.profesor.id);
            else profId = String(h.profesor);
          } else if (h.profesorId) profId = String(h.profesorId);
          if (!map.has(profId)) map.set(profId, { id: profId, horarios: [] });
          map.get(profId).horarios.push(h);
        });
        const entries = Array.from(map.values());
        const profsWithNames = await Promise.all(entries.map(async (p) => {
          if (!p.id || p.id === 'sin-profesor') return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          try {
            let r = await fetchApi(`/api/usuarios/${encodeURIComponent(p.id)}`);
            if (!r.ok) r = await fetchApi(`/api/users/${encodeURIComponent(p.id)}`);
            if (!r.ok) throw new Error('no user');
            const u = await r.json();
            const name = u.name || u.username || (u.email ? u.email.split('@')[0] : 'Profesor');
            return { id: p.id, name, horarios: p.horarios };
          } catch {
            return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          }
        }));
        setProfesores(profsWithNames);
      }
      closeReserve();
      alert('Tutoria creada correctamente.');
    } catch (err) {
      console.error('Error creando tutoria', err);
      alert('No se pudo crear la tutoria: ' + (err.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  // replace simple alert with drawer opener
  const onReservar = (prof) => {
    openReserve(prof);
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col items-start justify-start min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
        <div className="text-left w-full">
          {activeSubsection === 'reservar' ? (
            <div className="mt-6 w-full">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Profesores con horarios</h3>
              {loading ? <div className="text-sm text-gray-500">Cargando...</div> : null}
              {profesores.length === 0 ? (
                <div className="text-sm text-gray-500">No hay profesores disponibles en este momento.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profesores.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between items-start">
                      <div className="flex gap-4 items-start w-full">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-700">
                            {(p.name || 'P').split(' ').map(n => n?.[0] || '').slice(0,2).join('').toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-800">{p.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{p.horarios.length} {p.horarios.length === 1 ? 'sesion' : 'franjas'}</div>
                          <ul className="mt-3 p-0 text-sm text-gray-600 space-y-1 max-h-28 overflow-auto pr-2 text-left">
                            {p.horarios.slice(0, 6).map((h) => (
                              <li key={h._id || `${p.id}-${h.diaSemana}-${h.horaInicio}`} className="flex items-center gap-2">
                                <span>{h.asignatura ? `${h.asignatura} · ` : ''}{h.diaSemana} {h.horaInicio} - {h.horaFin}{h.modalidad ? <span className="text-xs text-gray-400 ml-2">· {h.modalidad}</span> : null}</span>
                              </li>
                            ))}
                            {p.horarios.length > 6 && <li className="text-xs text-gray-400">...y más</li>}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 w-full">
                        <button onClick={() => onReservar(p)} className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md">Reservar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Reservar tutoría</button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer / slide form */}
      {showReserveDrawer && reservedProfessor && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={closeReserve} />
          <div className="w-full sm:w-96 bg-white shadow-xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Reservar con {reservedProfessor.name}</h4>
              <button onClick={closeReserve} className="text-gray-600">Cerrar</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Huecos disponibles (30 min)</label>
                <div className="mt-2 max-h-48 overflow-auto border rounded p-2">
                  {availableSlots.length === 0 ? <div className="text-sm text-gray-500">No hay huecos disponibles en los próximos días.</div> : availableSlots.map((s) => (
                    <label key={s.isoStart} className="flex items-center gap-2 text-sm p-1 cursor-pointer">
                      <input type="radio" name="slot" checked={selectedSlot && selectedSlot.isoStart === s.isoStart} onChange={() => setSelectedSlot(s)} />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Tema</label>
                <input value={tema} onChange={(e) => setTema(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Descripción (opcional)</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full p-2 border rounded" rows={3} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Modalidad</label>
                  <select value={modalidadReserva} onChange={(e) => setModalidadReserva(e.target.value)} className="w-full p-2 border rounded">
                    <option value="presencial">presencial</option>
                    <option value="online">online</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Lugar (opcional)</label>
                  <input value={lugarReserva} onChange={(e) => setLugarReserva(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={closeReserve} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
                <button onClick={submitReserva} disabled={saving || !selectedSlot} className="px-3 py-1 bg-violet-600 text-white rounded">
                  {saving ? 'Reservando...' : 'Confirmar reserva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutoriasAlumno;
