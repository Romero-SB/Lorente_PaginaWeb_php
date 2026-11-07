import { router } from '@inertiajs/react';

import AuthModal from '../../Components/Auth/AuthModal';

export default function Login({ vista = 'login', email = '' }) {
    return <AuthModal vistaInicial={vista} email={email} onClose={() => router.visit('/')} />;
}
