<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerUser;
use App\Models\EmailVerificationCode;
use App\Http\Resources\PostResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Notifications\OtpVerificationNotification;
use Exception;

class RegisterCustomerController extends Controller
{
    private function validateEmailExists($email)
    {
        try {
            $parts = explode('@', $email);
            if (count($parts) !== 2) return false;
            
            $domain = $parts[1];
            
            // Check MX record
            if (!checkdnsrr($domain, 'MX')) {
                return false;
            }

            // Test email deliverability using a verification service or SMTP check
            return $this->verifyEmailDeliverable($email);
        } catch (Exception $e) {
            return false;
        }
    }

    private function verifyEmailDeliverable($email)
    {
        try {
            // Basic SMTP verification
            $domain = substr(strrchr($email, "@"), 1);
            $mxhosts = [];
            getmxrr($domain, $mxhosts);

            if (empty($mxhosts)) {
                return false;
            }

            $mxhost = $mxhosts[0];
            $socket = @fsockopen($mxhost, 25, $errno, $errstr, 5);

            if (!$socket) {
                return false;
            }

            $response = fgets($socket);
            if (empty($response)) {
                fclose($socket);
                return false;
            }

            fputs($socket, "HELO " . $_SERVER['SERVER_NAME'] . "\r\n");
            $response = fgets($socket);
            
            fputs($socket, "MAIL FROM: <verify@" . $_SERVER['SERVER_NAME'] . ">\r\n");
            $response = fgets($socket);
            
            fputs($socket, "RCPT TO: <{$email}>\r\n");
            $response = fgets($socket);
            
            fputs($socket, "QUIT\r\n");
            fclose($socket);

            // Check if email is accepted by SMTP server
            return (strpos($response, '250') !== false || strpos($response, '2.1.5') !== false);
        } catch (Exception $e) {
            return false;
        }
    }

    public function register(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string|unique:customer_users,username',
                'email' => 'required|email|unique:customer_users,email',
                'password' => 'required|string|min:8|confirmed',
            ]);

            // Validate email deliverability
            if (!$this->validateEmailExists($request->email)) {
                return new PostResource(false, 'The provided email address appears to be invalid or non-existent. Please use a valid email address.', null);
            }

            // Create customer with pending status
            $customer = CustomerUser::create([
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'status' => 'suspended' // Initial status before OTP verification
            ]);

            // Generate OTP Code
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            try {
                // Attempt to send OTP email first
                $this->sendOtpEmail($customer->email, $code);
                
                // If email sends successfully, store OTP and update status
                EmailVerificationCode::create([
                    'customer_user_id' => $customer->id,
                    'code' => $code,
                    'expires_at' => now()->addMinutes(3)
                ]);

                return new PostResource(true, 'Registration successful. Please check your email for OTP verification.', [
                    'user_id' => $customer->id
                ]);

            } catch (Exception $e) {
                // If email fails to send, delete the customer and return error
                $customer->delete();
                return new PostResource(false, 'Unable to send verification email. Please check your email address and try again.', null);
            }

        } catch (Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    public function verifyOtp(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:customer_users,id',
                'otp_code' => 'required|string|size:6'
            ]);

            $verification = EmailVerificationCode::where('customer_user_id', $request->user_id)
                ->where('code', $request->otp_code)
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if (!$verification) {
                return new PostResource(false, 'Invalid or expired OTP code.', null);
            }

            // Activate user
            $customer = CustomerUser::find($request->user_id);
            $customer->update([
                'status' => 'active',
                'email_verified_at' => now()
            ]);

            // Delete used OTP
            $verification->delete();


            return new PostResource(true, 'Email verified successfully.', [
                'user' => $customer,
            ]);

        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    public function resendOtp(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:customer_users,id'
            ]);

            $customer = CustomerUser::find($request->user_id);

            if ($customer->email_verified_at) {
                return new PostResource(false, 'Email already verified.', null);
            }

            // Delete existing OTP codes
            EmailVerificationCode::where('customer_user_id', $customer->id)->delete();

            // Generate new OTP Code
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store new OTP Code
            EmailVerificationCode::create([
                'customer_user_id' => $customer->id,
                'code' => $code,
                'expires_at' => now()->addMinutes(10)
            ]);

            // Send new OTP Email
            $this->sendOtpEmail($customer->email, $code);

            return new PostResource(true, 'New OTP code sent successfully.', null);

        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    private function sendOtpEmail($email, $code)
    {
        try {
            $customer = CustomerUser::where('email', $email)->first();
            $customer->notify(new OtpVerificationNotification($code));
            return true;
        } catch (Exception $e) {
            throw new Exception('Failed to send verification email');
        }
    }
}
