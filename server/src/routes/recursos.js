import express from "express";
import Recurso, { ReservaRecurso } from "../models/Recurso.js";

const router = express.Router();

// Crear recurso
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data.nombre || !data.tipo) {
      return res.status(400).json({ error: "missing_fields", details: "nombre and tipo are required" });
    }
    const recurso = new Recurso({ ...data });
    await recurso.save();
    res.status(201).json(recurso);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// Leer por id
router.get("/:id", async (req, res) => {
  try {
    const r = await Recurso.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "not_found" });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar recursos (por tipo, activo, disponibilidad)
router.get("/", async (req, res) => {
  try {
    const { tipo, estaActivo, limit = 100, page = 1 } = req.query;
    const query = {};
    if (tipo) query.tipo = tipo;
    if (estaActivo !== undefined) query.estaActivo = estaActivo === "true";

    const lim = Math.min(parseInt(limit, 10) || 100, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const docs = await Recurso.find(query)
      .sort({ nombre: 1 })
      .skip(skip)
      .limit(lim);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar
router.put("/:id", async (req, res) => {
  try {
    const r = await Recurso.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!r) return res.status(404).json({ error: "not_found" });
    res.json(r);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Borrar
router.delete("/:id", async (req, res) => {
  try {
    const r = await Recurso.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RUTAS DE RESERVAS 

// Crear reserva de recurso
router.post("/:id/reservas", async (req, res) => {
  try {
    const { usuario, fechaReserva } = req.body;
    
    if (!usuario || !fechaReserva) {
      return res.status(400).json({ error: "missing_fields", details: "usuario and fechaReserva are required" });
    }

    // Verificar que el recurso existe y está activo
    const recurso = await Recurso.findById(req.params.id);
    if (!recurso) return res.status(404).json({ error: "recurso_not_found" });
    if (!recurso.estaActivo) return res.status(400).json({ error: "recurso_inactive" });

    // Verificar que no hay reserva en la misma fecha para el mismo recurso
    const fechaInicio = new Date(fechaReserva);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setHours(23, 59, 59, 999);

    const reservaExistente = await ReservaRecurso.findOne({
      recurso: req.params.id,
      fechaReserva: { $gte: fechaInicio, $lte: fechaFin }
    });

    if (reservaExistente) {
      return res.status(409).json({ error: "already_reserved", details: "Resource already reserved for this date" });
    }

    const reserva = new ReservaRecurso({
      recurso: req.params.id,
      usuario,
      fechaReserva: new Date(fechaReserva)
    });

    await reserva.save();
    await reserva.populate("recurso usuario", "nombre name email");
    res.status(201).json(reserva);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", details: err.message });
  }
});

// Listar reservas de un recurso
router.get("/:id/reservas", async (req, res) => {
  try {
    const { desde, hasta, limit = 100, page = 1 } = req.query;
    const query = { recurso: req.params.id };

    if (desde || hasta) {
      query.fechaReserva = {};
      if (desde) query.fechaReserva.$gte = new Date(desde);
      if (hasta) query.fechaReserva.$lte = new Date(hasta);
    }

    const lim = Math.min(parseInt(limit, 10) || 100, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const reservas = await ReservaRecurso.find(query)
      .sort({ fechaReserva: 1 })
      .skip(skip)
      .limit(lim)
      .populate("usuario", "name email")
      .populate("recurso", "nombre tipo");

    res.json(reservas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener reserva por ID
router.get("/:recursoId/reservas/:reservaId", async (req, res) => {
  try {
    const reserva = await ReservaRecurso.findById(req.params.reservaId)
      .populate("usuario", "name email")
      .populate("recurso", "nombre tipo ubicacion");
    
    if (!reserva) return res.status(404).json({ error: "not_found" });
    if (reserva.recurso._id.toString() !== req.params.recursoId) {
      return res.status(400).json({ error: "reservation_mismatch" });
    }
    
    res.json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar/eliminar reserva
router.delete("/:recursoId/reservas/:reservaId", async (req, res) => {
  try {
    const reserva = await ReservaRecurso.findById(req.params.reservaId);
    if (!reserva) return res.status(404).json({ error: "not_found" });
    
    if (reserva.recurso.toString() !== req.params.recursoId) {
      return res.status(400).json({ error: "reservation_mismatch" });
    }

    await ReservaRecurso.findByIdAndDelete(req.params.reservaId);
    res.json({ ok: true, message: "Reservation cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
