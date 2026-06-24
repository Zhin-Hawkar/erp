<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        (new PermissionRoleSeeder())->run();
        (new DefultSetting())->run();
        (new EmailTemplatesSeeder())->run();
        (new NotificationsTableSeeder())->run();

        $userId = User::where('email', 'company@example.com')->first()->id;
        User::CompanySetting($userId);

        // Plans / memberships removed: enable all modules and set up the default
        // company so it can use the system immediately without any plan.
        (new PackageSeeder())->run($userId);

        if(config('app.run_demo_seeder'))
        {
            (new DemoUserSeeder())->run();

            (new DemoStaffSeeder())->run($userId);
            (new DemoLoginHistorySeeder())->run($userId);
            (new DemoWarehouseSeeder())->run($userId);
            (new HelpdeskCategorySeeder())->run();
            (new HelpdeskTicketSeeder())->run($userId);
            (new HelpdeskReplySeeder())->run($userId);
            (new MessengerSeeder())->run();
            (new AIAgentChatSessionSeeder())->run($userId);
            (new AIAgentChatMessageSeeder())->run($userId);

            // in this seeder product
            (new DemoTransferSeeder())->run($userId);
        }
    }
}
