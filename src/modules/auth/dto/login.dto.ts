import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'advogado@deskyura.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Lawyer@123' })
  @IsString()
  @MinLength(6)
  password: string;
}
