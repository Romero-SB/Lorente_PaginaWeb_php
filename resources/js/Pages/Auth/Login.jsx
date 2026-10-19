import { router } from '@inertiajs/react';

import AuthModal from '../../Components/Auth/AuthModal';

export default function Login({ vista = 'login' }) {
    return <AuthModal vistaInicial={vista} onClose={() => router.visit('/')} />;
}
