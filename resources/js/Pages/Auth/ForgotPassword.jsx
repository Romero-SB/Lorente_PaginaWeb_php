import { router } from '@inertiajs/react';

import AuthModal from '../../Components/Auth/AuthModal';

export default function ForgotPassword() {
    return <AuthModal vistaInicial="recuperar" onClose={() => router.visit('/')} />;
}
