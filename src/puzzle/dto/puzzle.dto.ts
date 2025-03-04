import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator"


export class CreatePuzzleDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    description: string

    @IsString()
    @IsNotEmpty()
    total_score: string

    @IsString()
    @IsNotEmpty()
    subject_id: string

    @IsString()
    @IsNotEmpty()
    level_id: string
}

export class UpdatePuzzleDto {

    @IsNumber()
    id: number


    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    description: string

    @IsOptional()
    @IsNumber()
    total_score: number

    @IsOptional()
    @IsNumber()
    subject_id: number

    @IsOptional()
    @IsNumber()
    level_id: number
}
export class InitializeSubmitPuzzleDto {
    @IsNotEmpty()
    @IsNumber()
    puzzle_assignment_id: number
}

export class SubmitPuzzleDto {
    @IsNotEmpty()
    puzzle_assignment_id: string
}

export class DeletePuzzleDto {
    @IsNumber()
    puzzle_id: number
}


export class CreatePuzzleAssignmnet {
    @IsNotEmpty()
    @IsNumber()
    puzzle_id: number
}

export class DeletePuzzleAssignmnet {
    @IsNotEmpty()
    @IsNumber()
    puzzle_assignment_id: number
}