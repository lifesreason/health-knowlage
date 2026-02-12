import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @ApiPropertyOptional({ description: '头像 URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: '字体倍率', minimum: 1.0, maximum: 1.4 })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(1.4)
  fontScale?: number;
}
