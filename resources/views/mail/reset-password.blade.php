<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Restablece tu contraseña</title>
</head>
<body style="margin:0;padding:0;background:#f6f4ef;color:#26303e;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e3dfd3;border-radius:14px;overflow:hidden;">
                    <tr>
                        <td style="background:#16265e;padding:24px 28px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="58" valign="middle">
                                        <img src="{{ $logo }}" width="48" height="48" alt="Logo {{ $institucion }}" style="display:block;width:48px;height:48px;border-radius:10px;background:#ffffff;padding:5px;">
                                    </td>
                                    <td valign="middle" style="padding-left:14px;color:#ffffff;">
                                        <div style="margin:0 0 3px;font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#d9b45a;">
                                            Panel de Gestión
                                        </div>
                                        <div style="font-size:17px;font-weight:bold;line-height:1.35;">
                                            {{ $institucion }}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;font-size:14px;line-height:1.7;color:#26303e;">
                            <p style="margin:0 0 16px;">Hola, <strong>{{ $nombre }}</strong>:</p>

                            <p style="margin:0 0 16px;">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta
                                <strong>{{ $correo }}</strong> en el Panel de Gestión de la
                                {{ $institucion }}.
                            </p>

                            <p style="margin:0 0 20px;">
                                Para continuar, haz clic en el siguiente botón. Este enlace es de
                                <strong>un solo uso</strong> y caduca en <strong>{{ $minutos }} minutos</strong>.
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;">
                                <tr>
                                    <td align="center" style="border-radius:10px;background:#16265e;">
                                        <a href="{{ $url }}" target="_blank" rel="noopener" style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;background:#16265e;">
                                            Restablecer mi contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 20px;font-size:12px;line-height:1.6;color:#5a6472;word-break:break-all;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                <a href="{{ $url }}" target="_blank" rel="noopener" style="color:#2a45a0;">{{ $url }}</a>
                            </p>

                            <div style="margin:0 0 20px;padding:14px 16px;border-left:3px solid #c29a2b;border-radius:0 8px 8px 0;background:#fbf6e8;font-size:13px;line-height:1.6;color:#5f4b17;">
                                Si no solicitaste este cambio, ignora este correo. Tu contraseña seguirá siendo la misma.
                                Por seguridad, no compartas este enlace con nadie.
                            </div>

                            <p style="margin:0;">
                                Atentamente,<br>
                                <strong>Panel de Gestión</strong><br>
                                {{ $institucion }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px;border-top:1px solid #e3dfd3;background:#f6f4ef;font-size:11px;line-height:1.6;color:#7a8290;">
                            Este es un mensaje automático de la {{ $institucion }}. No respondas a este correo.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
