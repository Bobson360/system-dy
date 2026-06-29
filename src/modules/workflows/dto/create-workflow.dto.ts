import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkflowDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  nodes?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  edges?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  schedule?: string;
}
