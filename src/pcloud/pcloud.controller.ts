import { Controller, Post, UploadedFile, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PCloudService } from './pcloud.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('pcloud')
export class PCloudController {
  constructor(private readonly pcloudService: PCloudService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + extname(file.originalname));
      }
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.pcloudService.uploadFile(file.path);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      fs.unlink(file.path, () => {});
    }
  }
}
