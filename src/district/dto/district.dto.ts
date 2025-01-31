import { IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";


export class CreateDistrictDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string

}


export class UpdateDistrictDto {

    @IsNumber()
    id: number

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string

}