import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

// GET — admin: listar participantes con filtros opcionales + export CSV
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get('fecha');       // YYYY-MM-DD
    const matchId = searchParams.get('matchId');
    const telefono = searchParams.get('telefono');
    const formato = searchParams.get('formato');   // 'csv'

    let lista = await storage.getSorteoMundialParticipantes();

    // Filtros
    if (fecha) {
      lista = lista.filter((p: any) => {
        const f = new Date(p.fechaParticipacion).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        return f === fecha;
      });
    }
    if (matchId) {
      lista = lista.filter((p: any) => p.matchId === matchId);
    }
    if (telefono) {
      lista = lista.filter((p: any) => p.telefono.includes(telefono));
    }

    if (formato === 'csv') {
      const cols = ['id', 'nombre', 'telefono', 'matchLabel', 'prediccionLabel', 'fechaParticipacion', 'estado'];
      const rows = [cols.join(',')];
      for (const p of lista) {
        rows.push(cols.map(c => `"${String(p[c] || '').replace(/"/g, '""')}"`).join(','));
      }
      return new Response(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sorteo-mundial-${fecha || 'todos'}.csv"`,
        },
      });
    }

    return NextResponse.json({ participantes: lista, total: lista.length });
  } catch (err) {
    console.error('[sorteo-mundial/participantes GET]', err);
    return NextResponse.json({ error: 'Error cargando participantes' }, { status: 500 });
  }
}

// DELETE — eliminar participante por id (?id=xxx)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const lista = await storage.getSorteoMundialParticipantes();
    const nueva = lista.filter((p: any) => p.id !== id);
    if (nueva.length === lista.length) {
      return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 });
    }
    await storage.saveSorteoMundialParticipantesList(nueva);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[sorteo-mundial/participantes DELETE]', err);
    return NextResponse.json({ error: 'Error eliminando participante' }, { status: 500 });
  }
}
