import { IsNotEmpty, IsString } from "class-validator";

export class CreateSVGdto {

    @IsString()
    @IsNotEmpty()
    description: string;

}