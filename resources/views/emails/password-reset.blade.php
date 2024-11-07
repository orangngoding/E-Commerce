<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Logo Header -->
        <div style="text-align: center; padding: 20px; background-color: #f8fafc;">
            <img src="{{ $logoUrl }}" alt="{{ $appName }}" style="max-width: 200px; height: auto;">
            <div style="margin-top: 20px; border-top: 1px solid #e2e8f0;"></div>
        </div>

        <!-- Content -->
        <div style="padding: 20px;">
            <h1 style="font-size: 24px; color: #1a202c; margin-bottom: 20px;">Hello {{ $name }},</h1>
            
            <p style="margin-bottom: 20px;"><strong>We received a password reset request for your account.</strong></p>
            
            <p style="color: #64748b; margin-bottom: 20px;">
                For your security, this reset link will expire in <strong>{{ $expireTime }} minutes</strong>.
            </p>

            <!-- Reset Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $url }}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Reset Your Password
                </a>
            </div>

            <!-- Security Notice -->
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <strong>Security Notice:</strong> This is a secure communication from {{ $appName }}. 
                For your protection, please do not forward this email.
            </div>

            <p style="color: #64748b; margin-bottom: 20px;">
                If you did not request this password reset, please contact our security team immediately.
            </p>

            <!-- Signature -->
            <div style="margin-top: 30px; color: #1a202c;">
                Best regards,<br>
                <strong>{{ $appName }} Security Team</strong>
            </div>
        </div>
    </div>
</body>
</html>
