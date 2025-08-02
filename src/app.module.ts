import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

import { PCloudModule } from './pcloud/pcloud.module';

@Module({
  imports: [UsersModule, PCloudModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
