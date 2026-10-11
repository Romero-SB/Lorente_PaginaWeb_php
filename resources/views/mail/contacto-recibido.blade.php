<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Nuevo mensaje de contacto</title>
</head>
<body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;background:#f6f4ef;color:#26303e;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e3dfd3;border-radius:12px;overflow:hidden;">
        <div style="background:#16265e;padding:20px 24px;color:#ffffff;">
            <h1 style="margin:0;font-size:18px;">Nuevo mensaje de contacto</h1>
            <p style="margin:4px 0 0;font-size:13px;color:#d9b45a;">IE N° 31501 Sebastián Lorente</p>
        </div>
        <div style="padding:24px;">
            <p style="margin:0 0 8px;font-size:14px;"><strong>Nombre:</strong> {{ $mensaje->nombre }}</p>
            <p style="margin:0 0 8px;font-size:14px;"><strong>Correo:</strong> {{ $mensaje->email }}</p>
            @if ($mensaje->telefono)
                <p style="margin:0 0 8px;font-size:14px;"><strong>Teléfono:</strong> {{ $mensaje->telefono }}</p>
            @endif
            <p style="margin:0 0 16px;font-size:14px;"><strong>Asunto:</strong> {{ $mensaje->asunto ?: 'Sin asunto' }}</p>
            <div style="padding:16px;background:#f6f4ef;border-left:3px solid #c29a2b;border-radius:0 8px 8px 0;">
                <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap;">{{ $mensaje->mensaje }}</p>
            </div>
            <p style="margin:20px 0 0;font-size:12px;color:#5a6472;">
                Recibido el {{ $mensaje->created_at?->format('d/m/Y H:i') }} · IP {{ $mensaje->ip }}
            </p>
        </div>
    </div>
</body>
</html>
