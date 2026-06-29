import { IsString, IsOptional, IsArray, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStatus } from '@prisma/client';

export class UpdateWorkflowDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false, enum: WorkflowStatus })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

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
