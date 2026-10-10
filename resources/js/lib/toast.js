const escuchas = new Set();
let cola = [];

export function toast(mensaje, tipo = 'ok') {
    const id = `${Date.now()}-${Math.random()}`;
    cola = [...cola, { id, mensaje, tipo }];
    notificar();
    setTimeout(() => {
        cola = cola.filter((t) => t.id !== id);
        notificar();
    }, 3500);
}

export function subscribeToasts(fn) {
    escuchas.add(fn);
    fn([...cola]);
    return () => escuchas.delete(fn);
}

function notificar() {
    escuchas.forEach((fn) => fn([...cola]));
}