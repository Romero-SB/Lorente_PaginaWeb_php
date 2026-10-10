<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Noticia extends Model
{
    use SoftDeletes;

    public const EST_BORRADOR = 'borrador';

    public const EST_PUBLICADO = 'publicado';

    protected $table = 'noticias';

    protected $fillable = [
        'titulo',
        'slug',
        'fiso',
        'fec',
        'cat',
        'res',
        'con',
        'est',
        'author_id',
        'aut',
        'updated_by',
    ];

    protected $casts = [
        'fiso' => 'date',
        'fec' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (Noticia $noticia) {
            if (blank($noticia->slug)) {
                $noticia->slug = static::generarSlug($noticia->titulo);
            }
        });
    }

    public static function generarSlug(string $titulo, ?int $ignoreId = null): string
    {
        $base = Str::slug($titulo) ?: 'noticia';
        $slug = $base;
        $i = 2;

        while (static::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function imagenes()
    {
        return $this->hasMany(NoticiaImagen::class)->orderBy('orden');
    }

    public function adjuntos()
    {
        return $this->hasMany(Adjunto::class)->orderBy('orden');
    }

    public function portada()
    {
        return $this->hasOne(NoticiaImagen::class)->where('es_portada', true);
    }

    public function estaPublicada(): bool
    {
        return $this->est === self::EST_PUBLICADO;
    }
}
