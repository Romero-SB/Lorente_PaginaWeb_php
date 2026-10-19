import { router } from '@inertiajs/react';

import AuthModal from '../../Components/Auth/AuthModal';

export default function ResetPassword({ token, email }) {
    return (
        <AuthModal
            vistaInicial="restablecer"
            token={token}
            email={email}
            onClose={() => router.visit('/lorente-panel/login')}
        />
    );
}
