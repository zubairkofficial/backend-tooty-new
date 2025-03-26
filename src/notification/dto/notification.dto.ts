import { IsNumber } from "class-validator";

export class UpdateNotification {
    @IsNumber()
    id: number
}