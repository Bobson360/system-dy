import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(Role.LAWYER, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Upload de documento (vincula a demanda e/ou cliente)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file:     { type: 'string', format: 'binary' },
        demandId: { type: 'string' },
        clientId: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  upload(
    @CurrentUser('id') userId: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 })] }))
    file: Express.Multer.File,
    @Body('demandId') demandId?: string,
    @Body('clientId') clientId?: string,
  ) {
    return this.documentsService.create(userId, file, demandId, clientId);
  }

  @Get()
  @Roles(Role.LAWYER, Role.CLIENT, Role.REVIEWER, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Listar documentos por demanda ou cliente' })
  findAll(
    @Query('demandId') demandId?: string,
    @Query('clientId') clientId?: string,
  ) {
    if (demandId) return this.documentsService.findByDemand(demandId);
    if (clientId) return this.documentsService.findByClient(clientId);
    return [];
  }

  @Delete(':id')
  @Roles(Role.LAWYER, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Excluir documento' })
  remove(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Param('id') id: string,
  ) {
    return this.documentsService.remove(userId, userRole, id);
  }
}
