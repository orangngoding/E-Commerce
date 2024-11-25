<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ChangePasswordNotification extends Notification
{
    use Queueable;

    protected $token;

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
        return (new MailMessage)
            ->subject('Change Password Request')
            ->greeting('Hello ' . $notifiable->username . '!')
            ->line('You have requested to change your password.')
            ->line('To proceed with the password change, please click the button below:')
            ->action('Change Password', url("/customer/change-password/{$this->token}"))
            ->line('This password change link will expire in 60 minutes.')
            ->line('If you did not request a password change, no further action is required.')
            ->salutation('Best regards,')
            ->from('noreply@yourapp.com', config('app.name'));
    }
}
