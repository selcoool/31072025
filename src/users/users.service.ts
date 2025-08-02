import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll(): string {
    return 'Danh sách tất cả người dùng';
  }
}

