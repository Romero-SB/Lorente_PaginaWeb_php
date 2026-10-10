<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use App\Support\Correo;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_SUPER = 'super-usuario';

    public const ROLE_ADMIN = 'administrador';

    public const ROLE_DOCENTE = 'docente';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'cargo',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    public function isSuperUsuario(): bool
    {
        return $this->role === self::ROLE_SUPER;
    }

    public function isAdministrador(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isDocente(): bool
    {
        return $this->role === self::ROLE_DOCENTE;
    }

    /** @return array<int, string> */
    public static function roles(): array
    {
        return [self::ROLE_SUPER, self::ROLE_ADMIN, self::ROLE_DOCENTE];
    }

    protected static function booted(): void
    {
        static::saving(function (User $user): void {
            if ($user->email !== null) {
                $user->email = Correo::normalizar($user->email);
            }
        });
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token, $this->email));
    }

    public function noticias()
    {
        return $this->hasMany(Noticia::class, 'author_id');
    }

    public function documentos()
    {
        return $this->hasMany(Documento::class, 'author_id');
    }

    public function actividades()
    {
        return $this->hasMany(Actividad::class);
    }
}
