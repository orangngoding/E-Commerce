<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();  // Kode kupon yang unik
            $table->decimal('discount_amount', 10, 2); 
            $table->enum('discount_type', ['nominal', 'percent']); // Nilai potongan harga
            $table->datetime('start_date');  // Tanggal mulai berlaku
            $table->datetime('end_date');  // Tanggal berakhir
            $table->boolean('is_active')->default(true);  // Status aktif/nonaktif
            $table->integer('max_usage')->default(0);  // Maksimal penggunaan (0 = unlimited)
            $table->integer('current_usage')->default(0);  // Jumlah sudah digunakan
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kupons');
    }
};
