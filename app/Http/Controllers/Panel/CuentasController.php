<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Historial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
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

    public function store(Request $request): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $datos = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'cargo' => ['nullable', 'string', 'max:200'],
            'role' => ['required', Rule::in($this->rolesAsignables($usuario))],
            'password' => ['required', 'confirmed', Password::min(8)],
        ], $this->mensajes());

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

        Historial::registrar($usuario, 'crear cuenta', $cuenta, $cuenta->name);

        return back()->with('ok', 'Cuenta creada correctamente.');
    }

    public function resetPassword(Request $request, User $cuenta): RedirectResponse
    {
        /** @var User $usuario */
        $usuario = $request->user();

        $this->autorizarGestion($usuario, $cuenta);

        $datos = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ], $this->mensajes());

        $cuenta->password = Hash::make($datos['password']);
        $cuenta->must_change_password = true;
        $cuenta->save();

        Historial::registrar($usuario, 'resetear contraseña', $cuenta, $cuenta->name);

        return back()->with('ok', 'Contraseña restablecida. La persona deberá cambiarla al ingresar.');
    }

    public function destroy(Request $request, User $cuenta): RedirectResponse
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

        Historial::registrar($usuario, 'eliminar cuenta', $cuenta, $cuenta->name);
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

    /**
     * @return array<string, string>
     */
    private function mensajes(): array
    {
        return [
            'name.required' => 'Ingresa el nombre de la persona.',
            'email.required' => 'Ingresa el correo electrónico.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'email.unique' => 'Ese correo ya está en uso por otra cuenta.',
            'role.required' => 'Selecciona un rol.',
            'role.in' => 'El rol seleccionado no es válido.',
            'password.required' => 'Ingresa una contraseña.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ];
    }
}
