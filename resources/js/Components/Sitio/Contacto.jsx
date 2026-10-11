import { useForm } from '@inertiajs/react';

import Turnstile from '../Auth/Turnstile';
import Reveal from './Reveal';
import SectionHeader from './SectionHeader';

const ASUNTOS = ['Matrícula', 'Consulta académica', 'Consulta general', 'Sugerencia', 'Otro'];

export default function Contacto({ config = {} }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: '',
        email: '',
        telefono: '',
        asunto: ASUNTOS[0],
        mensaje: '',
    });

    function submit(e) {
        e.preventDefault();
        post('/contacto', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <div className="ci">
            <Reveal>
                <div>
                    <SectionHeader numeral="06" label="Comunícate" title="Contacto" />
                    <p className="sd">Estamos aquí para atender a padres, estudiantes y la comunidad.</p>

                    <div style={{ marginTop: 24 }}>
                        <Reveal delay={80}>
                            <div className="ii">
                                <div className="iic">
                                    <i className="fas fa-location-dot"></i>
                                </div>
                                <div className="iit">
                                    <strong>Dirección</strong>
                                    <span>{config.direccion || 'Jr. Ayacucho 276, Huancayo'}</span>
                                </div>
                            </div>
                        </Reveal>
                        <Reveal delay={160}>
                            <div className="ii">
                                <div className="iic">
                                    <i className="fas fa-phone"></i>
                                </div>
                                <div className="iit">
                                    <strong>Teléfono</strong>
                                    <span>{config.phone || '+51 964 XXX XXX'}</span>
                                </div>
                            </div>
                        </Reveal>
                        <Reveal delay={240}>
                            <div className="ii">
                                <div className="iic">
                                    <i className="fas fa-envelope"></i>
                                </div>
                                <div className="iit">
                                    <strong>Correo</strong>
                                    <span>{config.email || 'ie31501sebastianlorente@gmail.com'}</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={140}>
                <form className="cform" onSubmit={submit} noValidate>
                    <div className="cfr">
                        <label htmlFor="c-nombre">Nombre</label>
                        <input
                            id="c-nombre"
                            type="text"
                            placeholder="Tu nombre completo"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                        />
                        {errors.nombre && <span className="cfr-error">{errors.nombre}</span>}
                    </div>
                    <div className="cfr">
                        <label htmlFor="c-email">Correo</label>
                        <input
                            id="c-email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && <span className="cfr-error">{errors.email}</span>}
                    </div>
                    <div className="cfr">
                        <label htmlFor="c-telefono">Teléfono (opcional)</label>
                        <input
                            id="c-telefono"
                            type="text"
                            placeholder="+51 900 000 000"
                            value={data.telefono}
                            onChange={(e) => setData('telefono', e.target.value)}
                        />
                        {errors.telefono && <span className="cfr-error">{errors.telefono}</span>}
                    </div>
                    <div className="cfr">
                        <label htmlFor="c-asunto">Asunto</label>
                        <select
                            id="c-asunto"
                            value={data.asunto}
                            onChange={(e) => setData('asunto', e.target.value)}
                        >
                            {ASUNTOS.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                        {errors.asunto && <span className="cfr-error">{errors.asunto}</span>}
                    </div>
                    <div className="cfr">
                        <label htmlFor="c-mensaje">Mensaje</label>
                        <textarea
                            id="c-mensaje"
                            placeholder="Escribe tu mensaje…"
                            value={data.mensaje}
                            onChange={(e) => setData('mensaje', e.target.value)}
                        />
                        {errors.mensaje && <span className="cfr-error">{errors.mensaje}</span>}
                    </div>

                    <Turnstile />
                    {errors['cf-turnstile-response'] && (
                        <span className="cfr-error">{errors['cf-turnstile-response']}</span>
                    )}

                    <button className="benv" type="submit" disabled={processing}>
                        <i className="fas fa-paper-plane" style={{ marginRight: 8 }}></i>
                        {processing ? 'Enviando…' : 'Enviar mensaje'}
                    </button>
                </form>
            </Reveal>
        </div>
    );
}
