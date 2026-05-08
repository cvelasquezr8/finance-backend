import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Correo inválido' })
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Mínimo 6 caracteres' })
  password: string
}
