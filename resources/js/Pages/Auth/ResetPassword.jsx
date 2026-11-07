import { router } from '@inertiajs/react';

import AuthModal from '../../Components/Auth/AuthModal';

export default function ResetPassword({ token, email, estado = 'valido' }) {
    return (
        <AuthModal
            vistaInicial="restablecer"
            token={token}
            email={email}
            estado={estado}
            onClose={() => router.visit('/lorente-panel/login')}
        />
    );
}
