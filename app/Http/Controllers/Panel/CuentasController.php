<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\ResetCuentaPasswordRequest;
use App\Http\Requests\Panel\StoreCuentaRequest;
use App\Models\User;
use App\Support\Historial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class CuentasController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $cuentas = User::query()
            ->when($usuario->isAdministrador(), fn ($query) => $query->where('role', User::ROLE_DOCENTE))
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $cuenta) => [
                'id' => $cuenta->id,
                'name' => $cuenta->name,
                'email' => $cuenta->email,
                'cargo' => $cuenta->cargo,
                'rol' => $cuenta->role,
                'rol_etiqueta' => config("panel.labels.{$cuenta->role}", $cuenta->role),
                'debe_cambiar_password' => $cuenta->must_change_password,
                'es_propia' => $cuenta->id === $usuario->id,
                'puede_gestionar' => $this->puedeGestionar($usuario, $cuenta),
                'puede_eliminar' => $usuario->isSuperUsuario()
                    && $cuenta->id !== $usuario->id
                    && ! $cuenta->isSuperUsuario(),
            ])
            ->values()
            ->all();

        return Inertia::render('Panel/Cuentas', [
            'cuentas' => $cuentas,
            'roles_asignables' => $this->opcionesRoles($usuario),
            'es_super' => $usuario->isSuperUsuario(),
        ]);
    }

    public function store(StoreCuentaRequest $request, Historial $historial): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $datos = $request->validated();

        $cuenta = new User;
        $cuenta->forceFill([
            'name' => trim($datos['name']),
            'email' => $datos['email'],
            'cargo' => trim((string) ($datos['cargo'] ?? '')) ?: null,
            'role' => $datos['role'],
            'password' => Hash::make($datos['password']),
            'must_change_password' => true,
            'email_verified_at' => now(),
        ])->save();

        $historial->registrar($usuario, 'crear cuenta', $cuenta, $cuenta->name);

        return back()->with('ok', 'Cuenta creada correctamente.');
    }

    public function resetPassword(ResetCuentaPasswordRequest $request, User $cuenta, Historial $historial): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $this->autorizarGestion($usuario, $cuenta);

        $datos = $request->validated();

        $cuenta->password = Hash::make($datos['password']);
        $cuenta->must_change_password = true;
        $cuenta->save();

        $historial->registrar($usuario, 'resetear contraseña', $cuenta, $cuenta->name);

        return back()->with('ok', 'Contraseña restablecida. La persona deberá cambiarla al ingresar.');
    }

    public function destroy(Request $request, User $cuenta, Historial $historial): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        if (! $usuario->isSuperUsuario()) {
            abort(403, 'Solo el Super Usuario puede eliminar cuentas.');
        }

        if ($cuenta->id === $usuario->id) {
            abort(403, 'No puedes eliminar tu propia cuenta.');
        }

        if ($cuenta->isSuperUsuario()) {
            abort(403, 'No puedes eliminar una cuenta de Super Usuario.');
        }

        $historial->registrar($usuario, 'eliminar cuenta', $cuenta, $cuenta->name);
        $cuenta->delete();

        return back()->with('ok', 'Cuenta eliminada.');
    }

    /**
     * @return array<int, string>
     */
    private function rolesAsignables(User $usuario): array
    {
        return $usuario->isSuperUsuario()
            ? [User::ROLE_ADMIN, User::ROLE_DOCENTE]
            : [User::ROLE_DOCENTE];
    }

    /**
     * @return array<int, array{valor: string, etiqueta: string}>
     */
    private function opcionesRoles(User $usuario): array
    {
        return array_map(
            fn (string $rol) => ['valor' => $rol, 'etiqueta' => config("panel.labels.$rol", $rol)],
            $this->rolesAsignables($usuario),
        );
    }

    private function puedeGestionar(User $usuario, User $objetivo): bool
    {
        if ($usuario->isSuperUsuario()) {
            return true;
        }

        return $usuario->isAdministrador() && $objetivo->isDocente();
    }

    private function autorizarGestion(User $usuario, User $objetivo): void
    {
        if (! $this->puedeGestionar($usuario, $objetivo)) {
            abort(403, 'No puedes gestionar esta cuenta.');
        }
    }
}
