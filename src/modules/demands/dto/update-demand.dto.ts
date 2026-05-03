import { PartialType } from '@nestjs/swagger';
import { CreateDemandDto } from './create-demand.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateDemandDto extends PartialType(OmitType(CreateDemandDto, ['clientId'] as const)) {}
