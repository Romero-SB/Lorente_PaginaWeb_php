<?php

namespace App\Models;

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
