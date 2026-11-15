const ZONA = 'America/Santiago';

// Agregación 1: cumplimiento semanal de un paciente (porcentaje de avisos confirmados por semana)
function pipelineCumplimiento(pacienteId, desde, hasta) {
  return [
    { $match: { pacienteId, fechaProgramada: { $gte: desde, $lte: hasta } } },
    {
      $group: {
        _id: { $dateTrunc: { date: '$fechaProgramada', unit: 'week', startOfWeek: 'monday', timezone: ZONA } },
        total: { $sum: 1 },
        confirmados: { $sum: { $cond: [{ $eq: ['$estado', 'confirmado'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        semana: '$_id',
        total: 1,
        confirmados: 1,
        porcentaje: { $round: [{ $multiply: [{ $divide: ['$confirmados', '$total'] }, 100] }, 1] }
      }
    },
    { $sort: { semana: 1 } }
  ];
}

// Agregación 2: avisos no atendidos según la franja horaria del día (mañana, tarde y noche)
function pipelineFranjas(pacienteId, desde) {
  return [
    { $match: { pacienteId, fechaProgramada: { $gte: desde } } },
    { $addFields: { hora: { $hour: { date: '$fechaProgramada', timezone: ZONA } } } },
    {
      $addFields: {
        franja: {
          $switch: {
            branches: [
              { case: { $lt: ['$hora', 12] }, then: 'manana' },
              { case: { $lt: ['$hora', 19] }, then: 'tarde' }
            ],
            default: 'noche'
          }
        }
      }
    },
    {
      $group: {
        _id: '$franja',
        total: { $sum: 1 },
        noAtendidos: { $sum: { $cond: [{ $eq: ['$estado', 'no_atendido'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        franja: '$_id',
        total: 1,
        noAtendidos: 1,
        porcentajeNoAtendidos: { $round: [{ $multiply: [{ $divide: ['$noAtendidos', '$total'] }, 100] }, 1] }
      }
    },
    { $sort: { noAtendidos: -1, franja: 1 } }
  ];
}

module.exports = { pipelineCumplimiento, pipelineFranjas };
