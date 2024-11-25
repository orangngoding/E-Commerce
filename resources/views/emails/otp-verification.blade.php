<!DOCTYPE html>
<html>
<head>
    <style>
        .container { padding: 20px; }
        .code { font-size: 32px; font-weight: bold; color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Hello {{ $name }},</h2>
        <p>Your verification code for {{ $appName }} is:</p>
        <p class="code">{{ $code }}</p>
        <p>This code will expire in {{ $expireTime }} minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
    </div>
</body>
</html>
