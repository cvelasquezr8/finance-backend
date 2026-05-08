import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  firstName: string

  @ApiProperty({ example: 'Velasquez' })
  @IsString()
  @MinLength(2, { message: 'Mínimo 2 caracteres' })
  lastName: string

  @ApiPropertyOptional({ example: 'Eduardo' })
  @IsOptional()
  @IsString()
  middleName?: string

  @ApiPropertyOptional({ example: 'Ramirez' })
  @IsOptional()
  @IsString()
  secondLastName?: string

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Correo inválido' })
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Mínimo 6 caracteres' })
  password: string

  @ApiProperty({ example: '@carlos_v' })
  @IsString()
  @Matches(/^@[a-z0-9_]{2,20}$/, {
    message: 'El alias debe seguir el formato @alias (2-20 caracteres)',
  })
  alias: string

  @ApiPropertyOptional({ example: '+525512345678' })
  @IsOptional()
  @IsString()
  phone?: string
}
