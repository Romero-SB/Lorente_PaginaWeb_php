import { Icono } from './Iconos';

export default function EnConstruccion({ titulo, descripcion }) {
    return (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-blue-950 text-blue-100">
                <Icono nombre="caja" className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
        </div>
    );
}