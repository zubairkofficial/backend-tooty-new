import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { CreatePuzzleDto, DeletePuzzleDto, InitializeSubmitPuzzleDto, SubmitPuzzleDto, UpdatePuzzleDto } from './dto/puzzle.dto';
import { Puzzle } from './entity/puzzle.entity';
import { Model, Op } from 'sequelize';
import { PuzzleAttempt } from './entity/puzzle-attempts.entity';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as fs from 'fs'
import { HumanMessage } from '@langchain/core/messages';
import { join } from 'path';
import { z } from 'zod';
import { Subject } from 'src/subject/entity/subject.entity';
import { Level } from 'src/level/entity/level.entity';

const output = z.object({
    remarks: z.string(),
    obtained_marks: z.number()
})
@Injectable()
export class PuzzleService {

    constructor(
        private readonly sequelize: Sequelize
    ) { }

    async puzzleMarking(fileName: string, submit_puzzle_id: number, puzzle: Puzzle) {

        try {

            const prompt = `

You are an AI assistant tasked with evaluating student submissions based on an image and a detailed teacher's description, using the Gemini Pro Vision model. You will receive an image as a base64 encoded string, the teacher's instructions, and the total possible marks. Your output MUST be a JSON object.

**Input Data (Available in the context - DO NOT TRY TO ACCESS EXTERNAL FILES):**

*   **Base64 Encoded Image Data:** The image data will be provided within the 'image_url' field of the content array in the HumanMessage. You do *not* need to read from the file system. You already have the image data.
*   **Teacher's Description:** <A comprehensive textual description of the student's task, including: the context of the image, clear instructions on what the student was expected to do, the criteria for evaluating the student's response (how marks are awarded and penalties applied), any constraints or rules, and quantifiable elements whenever possible.>
*   **Total Possible Marks:** <Integer representing the total marks for the assignment.>
*   **Ground Truth (Optional):** <A structured representation of the correct solution, if applicable. Leave blank if the Teacher Description provides all the necessary information to grade.>

**Your Task:**

1.  **Analyze the Image:** Use your image analysis capabilities to understand the contents of the image and how the student has modified it.

2.  **Understand the Task:** Carefully interpret the teacher's description to fully grasp what the student was supposed to do and how their work should be evaluated.

3.  **Evaluate the Submission:** Compare the student's actions with the teacher's instructions and the optional Ground Truth. Assess whether the student followed all instructions and rules. Award and deduct marks according to the teacher's description.

4.  **Generate JSON Output:** Create a JSON object with the following structure:
** Do NOT add \`\`\`json before json data and \`\`\` after json data, it must be just json data starts with \{ and ends with \}**

{{
  "obtained_marks": number,
  "remarks": "string" 
}}

obtained_marks: The integer value of the marks the student earned.

remarks: A concise and informative summary of the student's performance, including: what the student did, the number of correct/incorrect actions, specific feedback, how marks were awarded, and why the student failed (if applicable).

Important Considerations:

Base64 Image Data: Image data is provided in base64. Do not try to access the file system.

Context is Key: All necessary data (teacher description, total marks, ground truth) will be provided within this prompt.

JSON Output ONLY: Your response must be a valid JSON object.

Error Handling: If errors occur, return {{"obtained_marks": 0, "remarks": "Error: [Describe the error]"}}.

Teacher's Description Importance: The teacher's description dictates the evaluation.

`
            const visionModel = new ChatGoogleGenerativeAI({
                model: "gemini-1.5-flash",
                maxOutputTokens: 2048,
                apiKey: "AIzaSyDQKEZxV2ZyXKKxpkV44rCQQLHoJ-4PW8U"
            });

            if (!visionModel) {
                throw new Error("Error connecting to Vision Model")
            }
            const path = join(__dirname, '..', '..', 'images', `${fileName}`)

            const image = fs.readFileSync(path).toString("base64");
            if (!image) {
                throw new Error("Error in getting image")
            }
            const input = [
                new HumanMessage({
                    content: [

                        {
                            type: "text",
                            text: prompt + "\n\nTeacher's Description: " + puzzle.description + "\nTotal Possible Marks: " + puzzle.total_score,
                        },
                        {
                            type: "image_url",
                            image_url: `data:image/png;base64,${image}`,
                        },
                    ],
                }),
            ];
            const structre_llm = visionModel.withStructuredOutput(output)
            const res = await structre_llm.invoke(input);

            console.log("response", res)

            if (res.obtained_marks && res.remarks) {
                await PuzzleAttempt.update({
                    marked: true,
                    obtained_score: Number(res.obtained_marks),
                    bot_remarks: res.remarks

                }, {
                    where: {
                        id: {
                            [Op.eq]: submit_puzzle_id
                        }
                    }
                })
            } else {
                throw new Error("unable to parse json data")
            }

            return res
        } catch (error) {
            console.log("error", error)
            throw new Error("Error Analysing image")
        }
    }

    async createSubmitPuzzle(submitPuzzleDto: InitializeSubmitPuzzleDto, req: any) {
        const { puzzle_id } = submitPuzzleDto

        try {

            const puzzle = await Puzzle.findByPk(Number(puzzle_id))

            if (!puzzle) {
                throw new Error("No puzzle exist with given ID")
            }

            await PuzzleAttempt.create({
                puzzle_id: Number(puzzle_id),
                bot_remarks: "",
                obtained_marks: 0,
                student_id: req.user.sub,
                marked: false
            })


            return {
                statusCode: 200,
                message: "submittion initialized successfully",
            }


        } catch (error) {
            console.log("error", error)
            throw new HttpException(error.message || 'Failed to create Puzzle submittion initialization', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async submitPuzzle(file: Express.Multer.File, submitPuzzleDto: SubmitPuzzleDto, req: any) {
        const { puzzle_id } = submitPuzzleDto

        try {

            const puzzle = await Puzzle.findByPk(Number(puzzle_id))
            if (!puzzle) {
                throw new HttpException("No puzzle found wiht ID", HttpStatus.BAD_REQUEST)
            }

            let puzzle_submission = await PuzzleAttempt.findOne({
                where: {
                    puzzle_id: {
                        [Op.eq]: Number(puzzle_id)
                    },
                    student_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })

            if (puzzle_submission.marked) {
                throw new HttpException("puzzle already marked", HttpStatus.BAD_REQUEST)
            }

            if (!puzzle_submission) {
                puzzle_submission = await PuzzleAttempt.create({
                    image_url: file.filename,
                    puzzle_id: Number(puzzle_id),
                    bot_remarks: "",
                    obtained_marks: 0,
                    student_id: req.user.sub,
                    marked: false
                })
            }

            const res = await this.puzzleMarking(file.filename, puzzle_submission.id, puzzle)
            if (res) {
                return {
                    statusCode: 200,
                    message: "submitted successfully",
                    data: res
                }
            }

        } catch (error) {
            console.log("error", error)
            throw new HttpException(error.message || 'Failed to create Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async update(updatePuzzleDto: UpdatePuzzleDto) {
        const { id, level_id, subject_id, description, total_score } = updatePuzzleDto
        try {



            const puzzle = await Puzzle.findByPk(id)

            if (!puzzle) {
                throw new HttpException("No puzzle found with this ID", HttpStatus.BAD_REQUEST)
            }

            puzzle.level_id = level_id;


            puzzle.subject_id = subject_id;



            puzzle.description = description


            puzzle.total_score = total_score


            await puzzle.save()

            return {
                statusCode: 200,
                message: "puzzle updated successfully"
            }
        } catch (error) {

            throw new HttpException(error.message || 'Failed to update Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async create(file: Express.Multer.File, createPuzzleDto: CreatePuzzleDto) {
        const transaction = await this.sequelize.transaction()
        try {
            await Puzzle.create({
                image_url: `${file?.filename}`,
                level_id: Number(createPuzzleDto.level_id),
                subject_id: Number(createPuzzleDto.subject_id),
                description: createPuzzleDto.description,
                total_score: Number(createPuzzleDto.total_score)
            }, {
                transaction
            })
            await transaction.commit()
            return {
                statusCode: 200,
                message: "puzzle created successfully"
            }
        } catch (error) {
            await transaction.rollback()
            throw new HttpException(error.message || 'Failed to create Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async delete(deletePuzzleDto: DeletePuzzleDto) {

        try {
            const puzzle = await Puzzle.findByPk(deletePuzzleDto.puzzle_id)
            if (!puzzle) {
                throw new Error("puzzle with ID do not exist")
            }

            const path = join(__dirname, '..', '..', 'images', `${puzzle.image_url}`);

            fs.unlink(path, (err) => {
                if (err) {
                    throw new Error("unable to delete puzzle" + err.message)
                    return
                }
            })

            await Puzzle.destroy({
                where: {
                    id: {
                        [Op.eq]: deletePuzzleDto.puzzle_id
                    }
                }
            })
            return {
                statusCode: 200,
                message: "puzzle deleted successfully"
            }
        } catch (error) {
            console.log("error", error.message)
            throw new HttpException(error.message || 'Failed to delete Puzzle', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getByID(puzzle_id: string) {
        try {
            const puzzle = await Puzzle.findByPk(puzzle_id, {
                include: [{
                    model: Subject
                }, {
                    model: Level
                }]
            })
            return {
                statusCode: 200,
                data: puzzle
            }
        } catch (error) {
            throw new HttpException(error.message || 'Failed to find Puzzle with this ID', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getByLevel(req: any) {
        try {
            const puzzles = await Puzzle.findAll({
                include: [{
                    required: false,
                    model: PuzzleAttempt,
                    where: {
                        student_id: {
                            [Op.eq]: req.user.sub
                        }
                    }
                }],
                where: {
                    level_id: {
                        [Op.eq]: req.user.level_id
                    }
                }
            })
            return {
                statusCode: 200,
                data: puzzles
            }
        } catch (error) {
            throw new HttpException(error.message || 'Failed to find Puzzle with this ID', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    async getAll(page: number = 1, limit: number = 10) {
        try {

            const offset = (page - 1) * limit;


            const { rows: puzzles, count: total } = await Puzzle.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });


            const totalPages = Math.ceil(total / limit);

            return {
                statusCode: 200,
                message: "puzzles fetched successfully",
                data: puzzles,
                total,
                page,
                totalPages,
            };

        } catch (error) {
            throw new HttpException(error.message || 'Failed to find Puzzle with this ID', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
