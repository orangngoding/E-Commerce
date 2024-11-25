<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Exception;

class OtpVerificationNotification extends Notification
{
    use Queueable;

    protected $code;

    public function __construct($code)
    {
        $this->code = $code;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->view('emails.otp-verification', [
                'code' => $this->code,
                'name' => $notifiable->username,
                'appName' => config('app.name'),
                'expireTime' => '3', // minutes
                'logoUrl' => url('images/logo.png')
            ])
            ->subject('🔐 Verification Code - ' . config('app.name'))
            ->priority(1)
            ->from(config('mail.from.address'), config('mail.from.name'));
    }
}
