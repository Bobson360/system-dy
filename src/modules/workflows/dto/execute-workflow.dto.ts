import { IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecuteWorkflowDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  input?: Record<string, any>;
}
