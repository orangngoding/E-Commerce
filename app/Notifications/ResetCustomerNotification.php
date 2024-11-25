<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\HtmlString;

class ResetCustomerNotification extends Notification
{
    private $token;
    protected $user;

    public function __construct($token)
    {
        $this->token = $token;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $url = url('/customer/reset-password?token=' . $this->token . '&email=' . $notifiable->email);
        
        return (new MailMessage)
            ->view('emails.password-reset', [
                'url' => $url,
                'name' => $notifiable->name,
                'appName' => config('app.name'),
                'expireTime' => config('auth.passwords.users.expire'),
                'logoUrl' => url('images/logo.png')
            ])
            ->subject('🔒 Secure Password Reset - ' . config('app.name'))
            ->priority(1)
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->replyTo('security@' . parse_url(config('app.url'), PHP_URL_HOST));
    }
}
