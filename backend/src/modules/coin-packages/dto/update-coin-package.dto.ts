import { PartialType } from '@nestjs/swagger';
import { CreateCoinPackageDto } from './create-coin-package.dto.js';

export class UpdateCoinPackageDto extends PartialType(CreateCoinPackageDto) {}
