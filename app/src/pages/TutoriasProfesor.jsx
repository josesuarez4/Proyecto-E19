import React from 'react';
import Icon from '../components/Icon';

function TutoriasProfesor({ menu, activeSubsection }) {
  const item = (menu || []).find((m) => m.id === activeSubsection) || {};
  const tab = item.id || activeSubsection || 'default';
  console.log (menu);
  // contenidos de ejemplo por pestaña (ajusta las claves a los ids reales del menú)
  const contenidos = {
    reservar: [
      { id: 1, alumno: 'María Pérez', hora: '10:00' },
      { id: 2, alumno: 'Juan García', hora: '11:30' },
    ],
    'mis-tutorias': [
      { id: 1, alumno: 'Ana López', motivo: 'Consulta TFG', fecha: '2025-11-27' },
      { id: 2, alumno: 'Luis Ruiz', motivo: 'Revisión parcial', fecha: '2025-11-28' },
    ],
    historial: [
      { id: 1, alumno: 'María Pérez', resultado: 'Realizada', fecha: '2025-10-15' },
      { id: 2, alumno: 'Juan García', resultado: 'Cancelada', fecha: '2025-10-20' },
    ],
    profesores: null, // mostrará la vista de configuración
  };

  const sesiones = contenidos[tab];

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="min-h-[300px]">
        <div className="flex items-center gap-4 mb-4">
          <Icon name={item.icon || 'user-tie'} className="w-10 h-10 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">{item.label || 'Zona Profesor'}</h2>
        </div>

        {/* Vista para la pestaña "reservar" (o por defecto si coincide) */}
        {tab === 'reservar' && sesiones && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Panel de gestión de tutorías: confirma, cancela o reprograma sesiones con tus alumnos.
            </p>
            <div className="space-y-3">
              {sesiones.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{s.alumno}</div>
                    <div className="text-xs text-gray-500">{s.hora}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-500 text-white rounded">Confirmar</button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded">Cancelar</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vista para la pestaña "solicitudes" */}
        {tab === 'mis-tutorias' && sesiones && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Solicitudes pendientes: revisa y acepta o rechaza las peticiones de tutoría.
            </p>
            <div className="space-y-3">
              {sesiones.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{s.alumno}</div>
                    <div className="text-xs text-gray-500">{s.motivo} · {s.fecha}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded">Aceptar</button>
                    <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded">Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vista para la pestaña "historial" */}
        {tab === 'historial' && sesiones && (
          <>
            <p className="text-sm text-gray-600 mb-4">Historial de tutorías realizadas o canceladas.</p>
            <div className="space-y-3">
              {sesiones.map((s) => (
                <div key={s.id} className="p-3 border rounded">
                  <div className="font-semibold">{s.alumno}</div>
                  <div className="text-xs text-gray-500">{s.fecha} · {s.resultado}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vista para la pestaña "config" */}
        {tab === 'profesores' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Ajustes de tutorías: configura horarios, duración y preferencias.
            </p>
            <div className="space-y-3">
              <div className="p-3 border rounded">Opción 1: Horarios disponibles</div>
              <div className="p-3 border rounded">Opción 2: Duración por defecto</div>
            </div>
          </>
        )}

        {/* Fallback si la pestaña no tiene contenido específico */}
        {!Object.prototype.hasOwnProperty.call(contenidos, tab) && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Contenido por defecto para la pestaña seleccionada.
            </p>
            <div className="p-3 border rounded">Ajusta los ids del menú para enlazar contenido específico (ej.: "agenda", "solicitudes", "historial", "config").</div>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-400">
          <p>Subsección: <span className="font-semibold">{activeSubsection}</span></p>
        </div>
      </div>
    </div>
  );
}

export default TutoriasProfesor;
