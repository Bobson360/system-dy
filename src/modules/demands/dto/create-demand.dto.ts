import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DemandCategory } from '@prisma/client';

export class CreateDemandDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  body: string;

  @ApiProperty({ enum: DemandCategory })
  @IsEnum(DemandCategory)
  category: DemandCategory;

  @ApiProperty({ description: 'ID do perfil do cliente' })
  @IsUUID()
  clientId: string;
}
