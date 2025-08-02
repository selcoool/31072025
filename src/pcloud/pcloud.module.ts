import { Module } from '@nestjs/common';
import { PCloudController } from './pcloud.controller';
import { PCloudService } from './pcloud.service';

@Module({
  controllers: [PCloudController],
  providers: [PCloudService],
})
export class PCloudModule {}



